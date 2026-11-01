import { Router, Response } from 'express';
import { PrismaClient, Role, ScheduleStatus } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth.js';

const execFileAsync = promisify(execFile);
const router = Router();
const prisma = new PrismaClient();

const DATA_PATH = fs.existsSync('/docs/PS/CrunchWeek_StarterPack (1)/CrunchWeek_StarterPack/data/cit_public.json')
  ? '/docs/PS/CrunchWeek_StarterPack (1)/CrunchWeek_StarterPack/data/cit_public.json'
  : path.resolve(__dirname, '../../../docs/PS/CrunchWeek_StarterPack (1)/CrunchWeek_StarterPack/data/cit_public.json');

const VALIDATOR_PATH = fs.existsSync('/docs/PS/CrunchWeek_StarterPack (1)/CrunchWeek_StarterPack/validator.py')
  ? '/docs/PS/CrunchWeek_StarterPack (1)/CrunchWeek_StarterPack/validator.py'
  : path.resolve(__dirname, '../../../docs/PS/CrunchWeek_StarterPack (1)/CrunchWeek_StarterPack/validator.py');

const EXPORTS_DIR = fs.existsSync('/exports/schedule.json')
  ? '/exports'
  : path.resolve(__dirname, '../../../exports');

const OPTIMIZER_URL = process.env.OPTIMIZER_URL || 'http://127.0.0.1:8001';

// GET schedule.json (Admin Only per RBAC in ini.md)
router.get('/schedule.json', authenticate, requireRole([Role.admin]), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const filePath = path.join(EXPORTS_DIR, 'schedule.json');
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

    if (!activeSchedule) {
      if (fs.existsSync(filePath)) {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename="schedule.json"');
        return res.sendFile(filePath);
      }
      return res.status(404).json({ error: 'No active schedule' });
    }

    // Fallbacks if activeSchedule was generated freshly without re-linking exams/bookings
    let bookingDecisions = activeSchedule.bookingDecisions;
    let sessionOverrides = activeSchedule.sessionOverrides;
    let examAllocations = activeSchedule.examAllocations;

    if (bookingDecisions.length === 0 || examAllocations.length === 0) {
      const priorVersion = await prisma.scheduleVersion.findFirst({
        where: {
          datasetVersionId: dataset.id,
          OR: [
            { bookingDecisions: { some: {} } },
            { examAllocations: { some: {} } },
          ],
        },
        orderBy: { versionNumber: 'desc' },
        include: {
          bookingDecisions: { include: { request: true } },
          sessionOverrides: true,
          examAllocations: true,
        },
      });

      if (priorVersion) {
        if (bookingDecisions.length === 0) {
          bookingDecisions = priorVersion.bookingDecisions;
          sessionOverrides = priorVersion.sessionOverrides;
        }
        if (examAllocations.length === 0) {
          examAllocations = priorVersion.examAllocations;
        }
      }
    }

    // If still empty, read from exports/schedule.json as ultimate source of truth
    let fileFallback: any = null;
    if (fs.existsSync(filePath)) {
      try {
        fileFallback = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      } catch (_) {}
    }

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
        bookings: bookingDecisions.length > 0
          ? bookingDecisions.map((d) => ({
              request_id: d.request.externalId,
              status: d.status,
              ...(d.day ? { day: d.day } : {}),
              ...(d.startPeriod ? { start_period: d.startPeriod } : {}),
              ...(d.endPeriod ? { end_period: d.endPeriod } : {}),
              ...(d.roomExternalId ? { room_id: d.roomExternalId } : {}),
              reason: d.reason || 'Decision rendered by CIT CampusOS',
            }))
          : (fileFallback?.fest_week?.bookings || []),
        session_overrides: sessionOverrides.length > 0
          ? sessionOverrides.map((o) => ({
              session_id: o.sessionExternalId,
              day: o.day,
              start_period: o.startPeriod,
              room_id: o.roomExternalId,
              displaced_by: o.displacedByReqId,
            }))
          : (fileFallback?.fest_week?.session_overrides || []),
      },
      exams: examAllocations.length > 0
        ? examAllocations.map((e) => ({
            exam_id: e.examExternalId,
            day: e.day,
            session: e.session,
            rooms: e.rooms,
          }))
        : (fileFallback?.exams || []),
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="schedule.json"');
    return res.send(JSON.stringify(payload, null, 2));
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET schedule_after.json (Admin Only per RBAC in ini.md)
router.get('/schedule_after.json', authenticate, requireRole([Role.admin]), async (req: AuthenticatedRequest, res: Response) => {
  const filePath = path.join(EXPORTS_DIR, 'schedule_after.json');
  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="schedule_after.json"');
    return res.sendFile(filePath);
  }
  return res.status(404).json({ error: 'schedule_after.json not generated yet' });
});

// GET exam_schedule.json (Admin Only per RBAC in ini.md)
router.get('/exam_schedule.json', authenticate, requireRole([Role.admin]), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const filePath = path.join(EXPORTS_DIR, 'schedule.json');
    const dataset = await prisma.datasetVersion.findFirst({ where: { isCurrent: true } });
    if (!dataset) return res.status(404).json({ error: 'No dataset loaded' });

    const activeSchedule = await prisma.scheduleVersion.findFirst({
      where: { datasetVersionId: dataset.id, status: ScheduleStatus.active },
      include: { examAllocations: true },
    });

    let allocations = activeSchedule?.examAllocations || [];

    // Fallback: inherit if empty on active version
    if (allocations.length === 0) {
      const versionWithExams = await prisma.scheduleVersion.findFirst({
        where: {
          datasetVersionId: dataset.id,
          examAllocations: { some: {} },
        },
        orderBy: { versionNumber: 'desc' },
        include: { examAllocations: true },
      });
      if (versionWithExams && versionWithExams.examAllocations.length > 0) {
        allocations = versionWithExams.examAllocations;
      }
    }

    // Secondary fallback: read from exports/schedule.json
    let fileExams: any[] = [];
    if (allocations.length === 0 && fs.existsSync(filePath)) {
      try {
        const fileContent = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        fileExams = fileContent.exams || [];
      } catch (_) {}
    }

    const payload = {
      team: 'CIT CampusOS Team',
      dataset_id: dataset.datasetId,
      exams: allocations.length > 0
        ? allocations.map((e) => ({
            exam_id: e.examExternalId,
            day: e.day,
            session: e.session,
            rooms: e.rooms,
          }))
        : fileExams,
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="exam_schedule.json"');
    return res.send(JSON.stringify(payload, null, 2));
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET spectra_allocations.json (Admin Only per RBAC in ini.md)
router.get('/spectra_allocations.json', authenticate, requireRole([Role.admin]), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const filePath = path.join(EXPORTS_DIR, 'schedule.json');
    const dataset = await prisma.datasetVersion.findFirst({ where: { isCurrent: true } });
    if (!dataset) return res.status(404).json({ error: 'No dataset loaded' });

    const activeSchedule = await prisma.scheduleVersion.findFirst({
      where: { datasetVersionId: dataset.id, status: ScheduleStatus.active },
      include: {
        bookingDecisions: { include: { request: true } },
        sessionOverrides: true,
      },
    });

    let bookingDecisions = activeSchedule?.bookingDecisions || [];
    let sessionOverrides = activeSchedule?.sessionOverrides || [];

    // Fallback: inherit if empty on active version
    if (bookingDecisions.length === 0) {
      const versionWithBookings = await prisma.scheduleVersion.findFirst({
        where: {
          datasetVersionId: dataset.id,
          bookingDecisions: { some: {} },
        },
        orderBy: { versionNumber: 'desc' },
        include: {
          bookingDecisions: { include: { request: true } },
          sessionOverrides: true,
        },
      });
      if (versionWithBookings && versionWithBookings.bookingDecisions.length > 0) {
        bookingDecisions = versionWithBookings.bookingDecisions;
        sessionOverrides = versionWithBookings.sessionOverrides;
      }
    }

    // Secondary fallback: read from exports/schedule.json
    let fileFestWeek: any = null;
    if (bookingDecisions.length === 0 && fs.existsSync(filePath)) {
      try {
        const fileContent = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        fileFestWeek = fileContent.fest_week || null;
      } catch (_) {}
    }

    const payload = {
      team: 'CIT CampusOS Team',
      dataset_id: dataset.datasetId,
      fest_week: {
        bookings: bookingDecisions.length > 0
          ? bookingDecisions.map((d) => ({
              request_id: d.request.externalId,
              status: d.status,
              ...(d.day ? { day: d.day } : {}),
              ...(d.startPeriod ? { start_period: d.startPeriod } : {}),
              ...(d.endPeriod ? { end_period: d.endPeriod } : {}),
              ...(d.roomExternalId ? { room_id: d.roomExternalId } : {}),
              reason: d.reason || 'Decision rendered by CIT CampusOS',
            }))
          : (fileFestWeek?.bookings || []),
        session_overrides: sessionOverrides.length > 0
          ? sessionOverrides.map((o) => ({
              session_id: o.sessionExternalId,
              day: o.day,
              start_period: o.startPeriod,
              room_id: o.roomExternalId,
              displaced_by: o.displacedByReqId,
            }))
          : (fileFestWeek?.session_overrides || []),
      },
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="spectra_allocations.json"');
    return res.send(JSON.stringify(payload, null, 2));
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Run official validator (Admin Only per RBAC in ini.md)
router.post('/verify', authenticate, requireRole([Role.admin]), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const dataset = await prisma.datasetVersion.findFirst({ where: { isCurrent: true } });
    const schedPath = path.join(EXPORTS_DIR, 'schedule.json');
    const reportPath = path.join(EXPORTS_DIR, 'validation_report.json');

    if (!fs.existsSync(schedPath)) {
      return res.status(400).json({ error: 'exports/schedule.json does not exist. Please generate timetable first.' });
    }

    // Direct official validator execution with --json output
    const { stdout, stderr } = await execFileAsync('python', [
      VALIDATOR_PATH,
      '--data', DATA_PATH,
      '--schedule', schedPath,
      '--json', reportPath,
    ]);

    let fullReport: any = null;
    if (fs.existsSync(reportPath)) {
      try {
        fullReport = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
      } catch (e) {
        console.warn('Could not read validation_report.json:', e);
      }
    }

    return res.json({
      verified: true,
      output: stdout,
      errors: stderr || null,
      report: fullReport,
    });
  } catch (err: any) {
    console.error('Validator execution error:', err);
    return res.status(500).json({
      error: `Verification failed: ${err.message}`,
      stdout: err.stdout,
      stderr: err.stderr,
    });
  }
});

export default router;
