import { Router, Response } from 'express';
import { PrismaClient, Role, ScheduleStatus } from '@prisma/client';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();
const prisma = new PrismaClient();
const OPTIMIZER_URL = process.env.OPTIMIZER_URL || 'http://127.0.0.1:8001';

// GET baseline vs repaired disruption diff (pre-computed fallback)
router.get('/latest', async (req, res) => {
  try {
    const exportsDir = path.resolve(__dirname, '../../../exports');
    const basePath = path.join(exportsDir, 'schedule.json');
    const afterPath = path.join(exportsDir, 'schedule_after.json');

    if (!fs.existsSync(basePath) || !fs.existsSync(afterPath)) {
      return res.json({ available: false });
    }

    const baseSchedule = JSON.parse(fs.readFileSync(basePath, 'utf-8'));
    const afterSchedule = JSON.parse(fs.readFileSync(afterPath, 'utf-8'));

    const baseMap = new Map<string, { day: string; start: number; room: string }>();
    for (const b of baseSchedule.sessions || []) {
      baseMap.set(b.session_id, { day: b.day, start: b.start_period, room: b.room_id });
    }

    const movedSessions: Array<{
      sessionId: string;
      oldSlot: { day: string; start: number; room: string };
      newSlot: { day: string; start: number; room: string };
      type: 'time_changed' | 'room_only_changed';
    }> = [];

    for (const a of afterSchedule.sessions || []) {
      const orig = baseMap.get(a.session_id);
      if (orig) {
        if (orig.day !== a.day || orig.start !== a.start_period || orig.room !== a.room_id) {
          const type = orig.day !== a.day || orig.start !== a.start_period ? 'time_changed' : 'room_only_changed';
          movedSessions.push({
            sessionId: a.session_id,
            oldSlot: orig,
            newSlot: { day: a.day, start: a.start_period, room: a.room_id },
            type,
          });
        }
      }
    }

    return res.json({
      available: true,
      summary: {
        totalMoved: movedSessions.length,
        timeChanged: movedSessions.filter((m) => m.type === 'time_changed').length,
        roomOnlyChanged: movedSessions.filter((m) => m.type === 'room_only_changed').length,
      },
      movedSessions,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Submit disruption and solve repair
router.post('/submit', authenticate, requireRole([Role.admin]), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const disruption = req.body; // e.g. sample_disruption.json
    if (!disruption || !disruption.changes) {
      return res.status(400).json({ error: 'Invalid disruption payload (missing changes array)' });
    }

    const dataset = await prisma.datasetVersion.findFirst({ where: { isCurrent: true } });
    const activeSchedule = await prisma.scheduleVersion.findFirst({
      where: { datasetVersionId: dataset?.id, status: ScheduleStatus.active },
      include: { assignments: true },
    });

    if (!dataset || !activeSchedule) {
      return res.status(404).json({ error: 'Missing active dataset or schedule' });
    }

    const baselinePayload = {
      sessions: activeSchedule.assignments.map((a) => ({
        session_id: a.sessionExternalId,
        day: a.day,
        start_period: a.startPeriod,
        room_id: a.roomExternalId,
      })),
    };

    console.log('Sending disruption repair job to Python solver...');
    const solveRes = await axios.post(`${OPTIMIZER_URL}/internal/solve/disruption`, {
      dataset: dataset.rawJson,
      disruption,
      baseline_schedule: baselinePayload,
      timeout_seconds: 120,
    });

    const result = solveRes.data;
    if (result.status !== 'OPTIMAL' && result.status !== 'FEASIBLE') {
      return res.status(422).json({ error: 'Disruption repair infeasible', details: result });
    }

    // Compute diff and moved sessions against baseline
    const baseMap = new Map<string, { day: string; start: number; room: string }>();
    for (const b of baselinePayload.sessions) {
      baseMap.set(b.session_id, { day: b.day, start: b.start_period, room: b.room_id });
    }

    const movedSessions: Array<{
      sessionId: string;
      oldSlot: { day: string; start: number; room: string };
      newSlot: { day: string; start: number; room: string };
      type: 'time_changed' | 'room_only_changed';
    }> = [];

    for (const a of result.assignments) {
      const orig = baseMap.get(a.session_id);
      if (orig) {
        if (orig.day !== a.day || orig.start !== a.start_period || orig.room !== a.room_id) {
          const type = orig.day !== a.day || orig.start !== a.start_period ? 'time_changed' : 'room_only_changed';
          movedSessions.push({
            sessionId: a.session_id,
            oldSlot: orig,
            newSlot: { day: a.day, start: a.start_period, room: a.room_id },
            type,
          });
        }
      }
    }

    // Create a DisruptionJob record
    const job = await prisma.disruptionJob.create({
      data: {
        datasetVersionId: dataset.id,
        baseScheduleId: activeSchedule.id,
        status: 'succeeded',
        changesJson: disruption,
        sessionsMoved: movedSessions.length,
        timeChanged: movedSessions.filter((m) => m.type === 'time_changed').length,
        roomOnlyChanged: movedSessions.filter((m) => m.type === 'room_only_changed').length,
      },
    });

    return res.json({
      success: true,
      jobId: job.id,
      repairedAssignments: result.assignments,
      summary: {
        totalMoved: movedSessions.length,
        timeChanged: movedSessions.filter((m) => m.type === 'time_changed').length,
        roomOnlyChanged: movedSessions.filter((m) => m.type === 'room_only_changed').length,
      },
      movedSessions,
    });
  } catch (err: any) {
    console.error('Disruption submit error:', err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;

