import { Router, Response } from 'express';
import { PrismaClient, Role, ScheduleStatus } from '@prisma/client';
import axios from 'axios';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();
const OPTIMIZER_URL = process.env.OPTIMIZER_URL || 'http://127.0.0.1:8001';

const VALID_DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI'];
const VALID_PERIODS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

/**
 * POST /api/faculty/unavailability
 * Submit unavailability and trigger automatic conflict-free rescheduling
 */
router.post('/unavailability', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userRole = req.user?.role;
    if (userRole !== Role.faculty && userRole !== Role.admin) {
      return res.status(403).json({
        error: `Forbidden: role '${userRole}' cannot submit faculty unavailability. Only Faculty and Admin are authorized.`,
      });
    }

    let facultyId: string;
    if (userRole === Role.faculty) {
      if (!req.user?.facultyId) {
        return res.status(400).json({ error: 'No faculty ID associated with this authenticated account.' });
      }
      if (req.body.facultyId && req.body.facultyId !== req.user.facultyId) {
        return res.status(403).json({
          error: 'Forbidden: Faculty can only mark their own unavailability, not on behalf of another faculty member.',
        });
      }
      facultyId = req.user.facultyId;
    } else {
      // Admin role can specify facultyId
      facultyId = req.body.facultyId || req.user?.facultyId;
      if (!facultyId) {
        return res.status(400).json({ error: 'facultyId is required.' });
      }
    }

    const { days, periods, reason } = req.body;

    // Validate days & periods
    if (!Array.isArray(days) || days.length === 0) {
      return res.status(400).json({ error: 'Invalid or empty "days" array. At least one day (MON-FRI) is required.' });
    }
    const invalidDays = days.filter((d: string) => !VALID_DAYS.includes(d));
    if (invalidDays.length > 0) {
      return res.status(400).json({ error: `Invalid days specified: ${invalidDays.join(', ')}. Must be within ${VALID_DAYS.join(', ')}.` });
    }

    if (!Array.isArray(periods) || periods.length === 0) {
      return res.status(400).json({ error: 'Invalid or empty "periods" array. At least one teaching period (1-9) is required.' });
    }
    const invalidPeriods = periods.filter((p: number) => !VALID_PERIODS.includes(Number(p)));
    if (invalidPeriods.length > 0) {
      return res.status(400).json({ error: `Invalid periods specified: ${invalidPeriods.join(', ')}. Must be integers between 1 and 9.` });
    }
    const numPeriods = periods.map(Number);

    // Fetch active dataset & active schedule
    const dataset = await prisma.datasetVersion.findFirst({ where: { isCurrent: true } });
    if (!dataset) {
      return res.status(404).json({ error: 'No active dataset loaded' });
    }

    const activeSchedule = await prisma.scheduleVersion.findFirst({
      where: { datasetVersionId: dataset.id, status: ScheduleStatus.active },
      include: { assignments: true },
    });
    if (!activeSchedule) {
      return res.status(404).json({ error: 'No active schedule found to relocate sessions from' });
    }

    // Faculty info
    const faculty = await prisma.faculty.findUnique({
      where: {
        datasetVersionId_externalId: {
          datasetVersionId: dataset.id,
          externalId: facultyId,
        },
      },
    });
    const facultyName = faculty?.name || req.user?.name || `Faculty ${facultyId}`;

    // Identify affected sessions
    const facultySessions = await prisma.session.findMany({
      where: { datasetVersionId: dataset.id, facultyId },
    });
    const sessionMap = new Map(facultySessions.map((s) => [s.externalId, s]));

    const affectedSessions: Array<{
      sessionId: string;
      courseId: string;
      groups: string[];
      facultyId: string;
      day: string;
      startPeriod: number;
      duration: number;
      roomExternalId: string;
    }> = [];

    for (const a of activeSchedule.assignments) {
      const s = sessionMap.get(a.sessionExternalId);
      if (!s) continue;

      if (days.includes(a.day)) {
        // Check if any period in session range [start, start + duration - 1] overlaps with unavailable periods
        const sessionSpan = Array.from({ length: s.duration }, (_, i) => a.startPeriod + i);
        const hasOverlap = sessionSpan.some((p) => numPeriods.includes(p));

        if (hasOverlap) {
          affectedSessions.push({
            sessionId: s.externalId,
            courseId: s.courseId,
            groups: Array.isArray(s.groups) ? (s.groups as string[]) : [],
            facultyId: s.facultyId,
            day: a.day,
            startPeriod: a.startPeriod,
            duration: s.duration,
            roomExternalId: a.roomExternalId,
          });
        }
      }
    }

    // Prepare Disruption Solver payload
    const disruptionPayload = {
      changes: [
        {
          type: 'faculty_unavailable',
          faculty_id: facultyId,
          days,
          periods: numPeriods,
          reason: reason || 'Faculty personal leave / unavailability',
        },
      ],
    };

    const baselineSessions = activeSchedule.assignments.map((a) => ({
      session_id: a.sessionExternalId,
      day: a.day,
      start_period: a.startPeriod,
      room_id: a.roomExternalId,
    }));

    // Call Python CP-SAT Disruption Solver
    let solveRes: any;
    try {
      solveRes = await axios.post(`${OPTIMIZER_URL}/internal/solve/disruption`, {
        dataset: dataset.rawJson,
        disruption: disruptionPayload,
        baseline_schedule: { sessions: baselineSessions },
        timeout_seconds: 60,
      });
    } catch (solveErr: any) {
      return res.status(502).json({
        error: `Failed to communicate with optimization solver microservice: ${solveErr.message}`,
      });
    }

    const solverResult = solveRes.data;
    if (solverResult.status !== 'OPTIMAL' && solverResult.status !== 'FEASIBLE') {
      return res.status(422).json({
        success: false,
        error: 'Complete conflict-free relocation is not possible without violating hard constraints (room capacity, student cohort conflicts, or faculty daily limits).',
        affectedSessions,
        details: solverResult,
      });
    }

    // Calculate diff (moved sessions)
    const baseMap = new Map<string, { day: string; start: number; room: string }>();
    for (const b of baselineSessions) {
      baseMap.set(b.session_id, { day: b.day, start: b.start_period, room: b.room_id });
    }

    const movedSessions: Array<{
      sessionId: string;
      oldSlot: { day: string; startPeriod: number; roomExternalId: string };
      newSlot: { day: string; startPeriod: number; roomExternalId: string };
      type: 'time_changed' | 'room_only_changed';
    }> = [];

    for (const a of solverResult.assignments) {
      const orig = baseMap.get(a.session_id);
      if (orig) {
        if (orig.day !== a.day || orig.start !== a.start_period || orig.room !== a.room_id) {
          movedSessions.push({
            sessionId: a.session_id,
            oldSlot: { day: orig.day, startPeriod: orig.start, roomExternalId: orig.room },
            newSlot: { day: a.day, startPeriod: a.start_period, roomExternalId: a.room_id },
            type: orig.day !== a.day || orig.start !== a.start_period ? 'time_changed' : 'room_only_changed',
          });
        }
      }
    }

    // Create a new ScheduleVersion proposal (pending_approval)
    const latestVersion = await prisma.scheduleVersion.findFirst({
      where: { datasetVersionId: dataset.id },
      orderBy: { versionNumber: 'desc' },
    });
    const nextVersionNumber = (latestVersion?.versionNumber || 0) + 1;

    const proposal = await prisma.scheduleVersion.create({
      data: {
        datasetVersionId: dataset.id,
        versionNumber: nextVersionNumber,
        status: ScheduleStatus.pending_approval,
        hardViolations: 0,
        softScoreTotal: Math.round(solverResult.objective_value || 0),
        createdById: req.user?.id,
      },
    });

    // Save assignments for the proposed version
    for (const a of solverResult.assignments) {
      await prisma.scheduleAssignment.create({
        data: {
          scheduleVersionId: proposal.id,
          sessionExternalId: a.session_id,
          day: a.day,
          startPeriod: a.start_period,
          roomExternalId: a.room_id,
        },
      });
    }

    // Persist FacultyUnavailabilityRequest record
    const unavailRequest = await prisma.facultyUnavailabilityRequest.create({
      data: {
        facultyId,
        facultyName,
        days,
        periods: numPeriods,
        reason: reason || null,
        status: 'pending_approval',
        affectedSessions,
        proposalId: proposal.id,
        createdById: req.user?.id || 'anonymous',
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        action: 'FACULTY_UNAVAILABILITY_SUBMITTED',
        entityType: 'FACULTY_UNAVAILABILITY',
        entityId: unavailRequest.id,
        details: {
          facultyId,
          days,
          periods: numPeriods,
          affectedSessionsCount: affectedSessions.length,
          movedSessionsCount: movedSessions.length,
          proposalId: proposal.id,
        },
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Faculty unavailability submitted and conflict-free relocation proposal generated successfully.',
      unavailabilityId: unavailRequest.id,
      proposalId: proposal.id,
      status: 'pending_approval',
      affectedSessions,
      movedSessions,
      totalAffected: affectedSessions.length,
      totalMoved: movedSessions.length,
    });
  } catch (err: any) {
    console.error('Faculty unavailability error:', err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/faculty/unavailability
 * Retrieve the authenticated faculty member's unavailability records (or all for admin)
 */
router.get('/unavailability', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userRole = req.user?.role;
    if (userRole !== Role.faculty && userRole !== Role.admin) {
      return res.status(403).json({ error: `Forbidden: role '${userRole}' cannot view faculty unavailability records.` });
    }

    let whereCondition: any = {};
    if (userRole === Role.faculty) {
      if (!req.user?.facultyId) {
        return res.status(400).json({ error: 'No facultyId found on authenticated profile.' });
      }
      whereCondition = { facultyId: req.user.facultyId };
    }

    const records = await prisma.facultyUnavailabilityRequest.findMany({
      where: whereCondition,
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ success: true, count: records.length, records });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/faculty/unavailability/:id/affected-sessions
 * Retrieve sessions affected by a particular unavailability request
 */
router.get('/unavailability/:id/affected-sessions', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const requestId = String(req.params.id);
    const request = await prisma.facultyUnavailabilityRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      return res.status(404).json({ error: 'Unavailability request not found' });
    }

    // Role check: Faculty can only access their own
    if (req.user?.role === Role.faculty && req.user.facultyId !== request.facultyId) {
      return res.status(403).json({
        error: "Forbidden: Cannot view another faculty member's affected sessions.",
      });
    }

    return res.json({
      success: true,
      requestId: request.id,
      facultyId: request.facultyId,
      facultyName: request.facultyName,
      affectedSessions: request.affectedSessions || [],
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/faculty/unavailability/:id/proposal
 * Retrieve the proposed relocation plan and validation status
 */
router.get('/unavailability/:id/proposal', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const requestId = String(req.params.id);
    const request = await prisma.facultyUnavailabilityRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      return res.status(404).json({ error: 'Unavailability request not found' });
    }

    if (req.user?.role === Role.faculty && req.user.facultyId !== request.facultyId) {
      return res.status(403).json({
        error: "Forbidden: Cannot inspect another faculty member's relocation proposal.",
      });
    }

    if (!request.proposalId) {
      return res.status(404).json({ error: 'No proposal attached to this unavailability request' });
    }

    const proposal = await prisma.scheduleVersion.findUnique({
      where: { id: request.proposalId },
      include: { assignments: true },
    });

    if (!proposal) {
      return res.status(404).json({ error: 'Proposed schedule version not found' });
    }

    // Diff against active schedule
    const activeSchedule = await prisma.scheduleVersion.findFirst({
      where: { datasetVersionId: proposal.datasetVersionId, status: ScheduleStatus.active },
      include: { assignments: true },
    });

    const activeMap = new Map(
      (activeSchedule?.assignments || []).map((a) => [a.sessionExternalId, a])
    );

    const movedSessions: Array<{
      sessionId: string;
      oldSlot: { day: string; startPeriod: number; roomExternalId: string };
      newSlot: { day: string; startPeriod: number; roomExternalId: string };
      type: 'time_changed' | 'room_only_changed';
    }> = [];

    for (const a of proposal.assignments) {
      const orig = activeMap.get(a.sessionExternalId);
      if (orig) {
        if (orig.day !== a.day || orig.startPeriod !== a.startPeriod || orig.roomExternalId !== a.roomExternalId) {
          movedSessions.push({
            sessionId: a.sessionExternalId,
            oldSlot: { day: orig.day, startPeriod: orig.startPeriod, roomExternalId: orig.roomExternalId },
            newSlot: { day: a.day, startPeriod: a.startPeriod, roomExternalId: a.roomExternalId },
            type: orig.day !== a.day || orig.startPeriod !== a.startPeriod ? 'time_changed' : 'room_only_changed',
          });
        }
      }
    }

    return res.json({
      success: true,
      request: {
        id: request.id,
        facultyId: request.facultyId,
        facultyName: request.facultyName,
        days: request.days,
        periods: request.periods,
        reason: request.reason,
        status: request.status,
      },
      proposal: {
        id: proposal.id,
        versionNumber: proposal.versionNumber,
        status: proposal.status,
        hardViolations: proposal.hardViolations,
        softScoreTotal: proposal.softScoreTotal,
        createdAt: proposal.createdAt,
      },
      affectedSessions: request.affectedSessions || [],
      movedSessions,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
