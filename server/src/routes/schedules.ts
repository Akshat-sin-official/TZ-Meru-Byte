import { Router, Response } from 'express';
import { PrismaClient, Role, ScheduleStatus } from '@prisma/client';
import axios from 'axios';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();
const OPTIMIZER_URL = process.env.OPTIMIZER_URL || 'http://127.0.0.1:8001';

// GET active timetable
router.get('/active', async (req, res) => {
  try {
    const dataset = await prisma.datasetVersion.findFirst({
      where: { isCurrent: true },
    });

    if (!dataset) {
      return res.status(404).json({ error: 'No active dataset found' });
    }

    const schedule = await prisma.scheduleVersion.findFirst({
      where: {
        datasetVersionId: dataset.id,
        status: ScheduleStatus.active,
      },
      include: {
        assignments: true,
      },
    });

    if (!schedule) {
      return res.status(404).json({ error: 'No active schedule found' });
    }

    // Get supporting metadata
    const rooms = await prisma.room.findMany({ where: { datasetVersionId: dataset.id } });
    const faculty = await prisma.faculty.findMany({ where: { datasetVersionId: dataset.id } });
    const groups = await prisma.studentGroup.findMany({ where: { datasetVersionId: dataset.id } });
    const sessions = await prisma.session.findMany({ where: { datasetVersionId: dataset.id } });

    return res.json({
      schedule: {
        id: schedule.id,
        versionNumber: schedule.versionNumber,
        status: schedule.status,
        hardViolations: schedule.hardViolations,
        softScoreTotal: schedule.softScoreTotal,
        activatedAt: schedule.activatedAt,
        assignments: schedule.assignments,
      },
      metadata: {
        rooms,
        faculty,
        studentGroups: groups,
        sessions,
        calendar: (dataset.rawJson as any)?.calendar,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Trigger CP-SAT Solver Generation (Admin only)
router.post('/generate', authenticate, requireRole([Role.admin]), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const dataset = await prisma.datasetVersion.findFirst({ where: { isCurrent: true } });
    if (!dataset) return res.status(404).json({ error: 'No dataset loaded' });

    console.log('Calling Python CP-SAT timetable solver...');
    const solveRes = await axios.post(`${OPTIMIZER_URL}/internal/solve/timetable`, {
      dataset: dataset.rawJson,
      timeout_seconds: 120,
    });

    const result = solveRes.data;
    if (result.status !== 'OPTIMAL' && result.status !== 'FEASIBLE') {
      return res.status(422).json({ error: 'Solver could not find feasible timetable', details: result });
    }

    // Create ScheduleVersion proposal
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
        softScoreTotal: Math.round(result.objective_value || 0),
        createdById: req.user?.id,
      },
    });

    // Save assignments
    for (const a of result.assignments) {
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

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        action: 'GENERATE_SCHEDULE_PROPOSAL',
        entityType: 'SCHEDULE_VERSION',
        entityId: proposal.id,
        details: { solve_time: result.solve_time, assignmentsCount: result.assignments.length },
      },
    });

    return res.json({
      success: true,
      proposalId: proposal.id,
      versionNumber: proposal.versionNumber,
      status: proposal.status,
      solveTime: result.solve_time,
      assignmentsCount: result.assignments.length,
    });
  } catch (err: any) {
    console.error('Schedule generation error:', err.message);
    return res.status(500).json({ error: `Solver error: ${err.message}` });
  }
});

// Validate Move (Drag & Drop Pre-flight validation)
router.post('/validate-move', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { session_id, target_day, target_start_period, target_room_id } = req.body;
    if (!session_id || !target_day || !target_start_period || !target_room_id) {
      return res.status(400).json({ error: 'Missing move parameters' });
    }

    const dataset = await prisma.datasetVersion.findFirst({ where: { isCurrent: true } });
    const activeSchedule = await prisma.scheduleVersion.findFirst({
      where: { datasetVersionId: dataset?.id, status: ScheduleStatus.active },
      include: { assignments: true },
    });

    if (!dataset || !activeSchedule) {
      return res.status(404).json({ error: 'No active schedule available for validation' });
    }

    const currentSchedulePayload = {
      sessions: activeSchedule.assignments.map((a) => ({
        session_id: a.sessionExternalId,
        day: a.day,
        start_period: a.startPeriod,
        room_id: a.roomExternalId,
      })),
    };

    const valRes = await axios.post(`${OPTIMIZER_URL}/internal/validate-move`, {
      dataset: dataset.rawJson,
      current_schedule: currentSchedulePayload,
      session_id,
      target_day,
      target_start_period,
      target_room_id,
    });

    return res.json(valRes.data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Approve Proposal and Activate
router.post('/proposals/:id/approve', authenticate, requireRole([Role.admin]), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const proposalId = req.params.id;
    const proposal = await prisma.scheduleVersion.findUnique({
      where: { id: proposalId },
    });

    if (!proposal || proposal.status !== ScheduleStatus.pending_approval) {
      return res.status(400).json({ error: 'Proposal not found or not in pending_approval state' });
    }

    // Atomic transaction: mark existing active as superseded, activate proposal
    await prisma.$transaction([
      prisma.scheduleVersion.updateMany({
        where: { datasetVersionId: proposal.datasetVersionId, status: ScheduleStatus.active },
        data: { status: ScheduleStatus.superseded },
      }),
      prisma.scheduleVersion.update({
        where: { id: proposalId },
        data: {
          status: ScheduleStatus.active,
          approvedById: req.user?.id,
          activatedAt: new Date(),
        },
      }),
    ]);

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        action: 'ACTIVATE_SCHEDULE',
        entityType: 'SCHEDULE_VERSION',
        entityId: proposalId,
      },
    });

    return res.json({ success: true, message: `Schedule version ${proposal.versionNumber} is now active.` });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;

