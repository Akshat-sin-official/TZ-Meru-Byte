import { Router, Response } from 'express';
import { PrismaClient, ScheduleStatus } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);
const router = Router();
const prisma = new PrismaClient();

const DATA_PATH = path.resolve(__dirname, '../../../docs/PS/CrunchWeek_StarterPack (1)/CrunchWeek_StarterPack/data/cit_public.json');
const VALIDATOR_PATH = path.resolve(__dirname, '../../../docs/PS/CrunchWeek_StarterPack (1)/CrunchWeek_StarterPack/validator.py');
const EXPORTS_DIR = path.resolve(__dirname, '../../../exports');

// GET schedule.json (generated from database)
router.get('/schedule.json', async (req, res) => {
  try {
    const dataset = await prisma.datasetVersion.findFirst({ where: { isCurrent: true } });
    if (!dataset) return res.status(404).json({ error: 'No dataset loaded' });

    const activeSchedule = await prisma.scheduleVersion.findFirst({
      where: { datasetVersionId: dataset.id, status: ScheduleStatus.active },
      include: {
        assignments: true,
        bookingDecisions: { include: { request: true } },
        sessionOverrides: true,
        examAllocations: true,
      },
    });

    if (!activeSchedule) return res.status(404).json({ error: 'No active schedule' });

    const payload = {
      team: 'CIT CampusOS Team',
      dataset_id: dataset.datasetId,
      sessions: activeSchedule.assignments.map((a) => ({
        session_id: a.sessionExternalId,
        day: a.day,
        start_period: a.startPeriod,
        room_id: a.roomExternalId,
      })),
      fest_week: {
        bookings: activeSchedule.bookingDecisions.map((d) => ({
          request_id: d.request.externalId,
          status: d.status,
          ...(d.day ? { day: d.day } : {}),
          ...(d.startPeriod ? { start_period: d.startPeriod } : {}),
          ...(d.endPeriod ? { end_period: d.endPeriod } : {}),
          ...(d.roomExternalId ? { room_id: d.roomExternalId } : {}),
          reason: d.reason || 'Decision rendered by CIT CampusOS',
        })),
        session_overrides: activeSchedule.sessionOverrides.map((o) => ({
          session_id: o.sessionExternalId,
          day: o.day,
          start_period: o.startPeriod,
          room_id: o.roomExternalId,
          displaced_by: o.displacedByReqId,
        })),
      },
      exams: activeSchedule.examAllocations.map((e) => ({
        exam_id: e.examExternalId,
        day: e.day,
        session: e.session,
        rooms: e.rooms,
      })),
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="schedule.json"');
    return res.send(JSON.stringify(payload, null, 2));
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET schedule_after.json
router.get('/schedule_after.json', async (req, res) => {
  const filePath = path.join(EXPORTS_DIR, 'schedule_after.json');
  if (fs.existsSync(filePath)) {
    return res.sendFile(filePath);
  }
  return res.status(404).json({ error: 'schedule_after.json not generated yet' });
});

// Run official validator.py
router.post('/verify', async (req, res) => {
  try {
    const schedPath = path.join(EXPORTS_DIR, 'schedule.json');
    if (!fs.existsSync(schedPath)) {
      return res.status(400).json({ error: 'exports/schedule.json does not exist. Please generate timetable first.' });
    }

    const { stdout, stderr } = await execFileAsync('python', [
      VALIDATOR_PATH,
      '--data', DATA_PATH,
      '--schedule', schedPath,
    ]);

    return res.json({
      verified: true,
      output: stdout,
      errors: stderr || null,
    });
  } catch (err: any) {
    return res.status(500).json({ error: `Verification failed: ${err.message}`, stdout: err.stdout, stderr: err.stderr });
  }
});

export default router;

