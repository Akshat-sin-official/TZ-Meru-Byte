import { Router, Response } from 'express';
import { PrismaClient, Role, ScheduleStatus } from '@prisma/client';
import axios from 'axios';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();
const OPTIMIZER_URL = process.env.OPTIMIZER_URL || 'http://127.0.0.1:8001';

// GET active timetable (Role-scoped per RBAC Matrix in ini.md)
router.get('/active', authenticate, async (req: AuthenticatedRequest, res: Response) => {
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

    const userRole = req.user?.role;
    const userFacultyId = req.user?.facultyId;
    const userDept = req.user?.department;

    // Per ini.md Table 1: Club Reps have NO timetable access
    if (userRole === Role.club) {
      return res.status(403).json({
        error: 'Forbidden: Club representatives are not authorized to view academic teaching timetables.',
      });
    }

    // Get supporting metadata
    const rooms = await prisma.room.findMany({ where: { datasetVersionId: dataset.id } });
    const faculty = await prisma.faculty.findMany({ where: { datasetVersionId: dataset.id } });
    const groups = await prisma.studentGroup.findMany({ where: { datasetVersionId: dataset.id } });
    const sessions = await prisma.session.findMany({ where: { datasetVersionId: dataset.id } });

    let scopedAssignments = schedule.assignments;
    let scopedFaculty = faculty;
    let scopedGroups = groups;
    let scopedSessions = sessions;

    if (userRole === Role.faculty) {
      // Faculty: Strictly view ONLY their own personal teaching timetable
      const myFacultyId = userFacultyId || 'F19';
      scopedSessions = sessions.filter((s) => s.facultyId === myFacultyId);
      const sessionIds = new Set(scopedSessions.map((s) => s.externalId));
      scopedAssignments = schedule.assignments.filter((a) => sessionIds.has(a.sessionExternalId));
      scopedFaculty = faculty.filter((f) => f.externalId === myFacultyId);
      const enrolledGroupIds = new Set(scopedSessions.flatMap((s) => (s.groups as string[]) || []));
      scopedGroups = groups.filter((g) => enrolledGroupIds.has(g.externalId));
    } else if (userRole === Role.department_coordinator) {
      // Coordinator: View department timetable, department faculty, department cohorts
      const dept = userDept || 'CSE';
      scopedGroups = groups.filter((g) => g.department === dept || g.externalId.startsWith(dept));
      scopedFaculty = faculty.filter((f) => f.department === dept);
      const deptGroupIds = new Set(scopedGroups.map((g) => g.externalId));
      const deptFacultyIds = new Set(scopedFaculty.map((f) => f.externalId));
      scopedSessions = sessions.filter(
        (s) =>
          deptFacultyIds.has(s.facultyId) ||
          ((s.groups as string[]) || []).some((g) => deptGroupIds.has(g))
      );
      const sessionIds = new Set(scopedSessions.map((s) => s.externalId));
      scopedAssignments = schedule.assignments.filter((a) => sessionIds.has(a.sessionExternalId));
    }

    return res.json({
      schedule: {
        id: schedule.id,
        versionNumber: schedule.versionNumber,
        status: schedule.status,
        hardViolations: schedule.hardViolations,
        softScoreTotal: schedule.softScoreTotal,
        activatedAt: schedule.activatedAt,
        assignments: scopedAssignments,
      },
      metadata: {
        rooms,
        faculty: scopedFaculty,
        studentGroups: scopedGroups,
        sessions: scopedSessions,
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

    // Batch insert assignments (Performance Batching)
    const assignmentsToInsert = result.assignments.map((a: any) => ({
      scheduleVersionId: proposal.id,
      sessionExternalId: a.session_id,
      day: a.day,
      startPeriod: a.start_period,
      roomExternalId: a.room_id,
    }));

    await prisma.scheduleAssignment.createMany({
      data: assignmentsToInsert,
    });

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

// Batch Pre-flight Drag & Drop Validation (Feature Guide #10)
router.post('/batch-validate-moves', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { session_id, candidates } = req.body;
    if (!session_id || !Array.isArray(candidates) || candidates.length === 0) {
      return res.status(400).json({ error: 'Missing session_id or non-empty candidates array' });
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

    const valRes = await axios.post(`${OPTIMIZER_URL}/internal/batch-validate-moves`, {
      dataset: dataset.rawJson,
      current_schedule: currentSchedulePayload,
      session_id,
      candidates,
    });

    return res.json(valRes.data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Approve Proposal and Activate
router.post('/proposals/:id/approve', authenticate, requireRole([Role.admin]), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const proposalId = String(req.params.id);
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

// POST /apply-move: Apply a validated manual move to the active timetable (Admin only per RBAC Matrix)
router.post('/apply-move', authenticate, requireRole([Role.admin]), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { session_id, target_day, target_start_period, target_room_id } = req.body;
    if (!session_id || !target_day || !target_start_period || !target_room_id) {
      return res.status(400).json({ error: 'Missing required parameters: session_id, target_day, target_start_period, target_room_id' });
    }

    const dataset = await prisma.datasetVersion.findFirst({ where: { isCurrent: true } });
    const activeSchedule = await prisma.scheduleVersion.findFirst({
      where: { datasetVersionId: dataset?.id, status: ScheduleStatus.active },
    });

    if (!activeSchedule) return res.status(404).json({ error: 'No active schedule' });

    const assignment = await prisma.scheduleAssignment.findFirst({
      where: {
        scheduleVersionId: activeSchedule.id,
        sessionExternalId: session_id,
      },
    });

    if (!assignment) {
      return res.status(404).json({ error: `Session ${session_id} not found in active schedule` });
    }

    const updated = await prisma.scheduleAssignment.update({
      where: { id: assignment.id },
      data: {
        day: target_day,
        startPeriod: Number(target_start_period),
        roomExternalId: target_room_id,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        action: 'MANUAL_MOVE_APPLIED',
        entityType: 'SCHEDULE_ASSIGNMENT',
        entityId: assignment.id,
        details: { session_id, old: { day: assignment.day, start: assignment.startPeriod, room: assignment.roomExternalId }, new: { day: target_day, start: target_start_period, room: target_room_id } },
      },
    });

    return res.json({
      success: true,
      message: `Session ${session_id} successfully rescheduled to ${target_day} Period ${target_start_period} in ${target_room_id}.`,
      assignment: updated,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;

