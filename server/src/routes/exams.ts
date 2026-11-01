import { Router, Response } from 'express';
import { PrismaClient, Role, ScheduleStatus } from '@prisma/client';
import axios from 'axios';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth.js';
import { recordAuditLog, emitNotification } from '../utils/notifications.js';

const router = Router();
const prisma = new PrismaClient();
const OPTIMIZER_URL = process.env.OPTIMIZER_URL || 'http://127.0.0.1:8001';

router.get('/active', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userRole = req.user?.role;
    const userDept = req.user?.department;

    if (userRole === Role.club) {
      return res.status(403).json({
        error: 'Forbidden: Club representatives are not authorized to access midsem exam timetables.',
      });
    }

    const dataset = await prisma.datasetVersion.findFirst({ where: { isCurrent: true } });
    if (!dataset) return res.status(404).json({ error: 'No dataset loaded' });

    const activeSchedule = await prisma.scheduleVersion.findFirst({
      where: { datasetVersionId: dataset.id, status: ScheduleStatus.active },
      include: { examAllocations: true },
    });

    let examsMeta = await prisma.midsemExam.findMany({ where: { datasetVersionId: dataset.id } });
    let allocations = activeSchedule?.examAllocations || [];

    if (userRole === Role.department_coordinator && userDept) {
      examsMeta = examsMeta.filter((e) =>
        ((e.groups as string[]) || []).some((g) => g.startsWith(userDept))
      );
      const examIds = new Set(examsMeta.map((e) => e.externalId));
      allocations = allocations.filter((a) => examIds.has(a.examExternalId));
    }

    const rooms = await prisma.room.findMany({ where: { datasetVersionId: dataset.id } });

    return res.json({
      allocations,
      exams: examsMeta,
      rooms,
      calendar: (dataset.rawJson as any)?.calendar?.exam_week,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Batch CP-SAT Solver for all 41 midsem exams
router.post('/generate', authenticate, requireRole([Role.admin]), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const dataset = await prisma.datasetVersion.findFirst({ where: { isCurrent: true } });
    if (!dataset) return res.status(404).json({ error: 'No dataset loaded' });

    const solveRes = await axios.post(`${OPTIMIZER_URL}/internal/solve/exams`, {
      dataset: dataset.rawJson,
      timeout_seconds: 60,
    });

    const result = solveRes.data;
    if (result.status !== 'OPTIMAL' && result.status !== 'FEASIBLE') {
      return res.status(422).json({ error: 'Exam solver failed', details: result });
    }

    const activeSchedule = await prisma.scheduleVersion.findFirst({
      where: { datasetVersionId: dataset.id, status: ScheduleStatus.active },
    });

    if (activeSchedule) {
      await prisma.examAllocation.deleteMany({ where: { scheduleVersionId: activeSchedule.id } });
      if (result.allocations && result.allocations.length > 0) {
        await prisma.examAllocation.createMany({
          data: result.allocations.map((a: any) => ({
            scheduleVersionId: activeSchedule.id,
            examExternalId: a.exam_id,
            day: a.day,
            session: a.session,
            rooms: a.rooms,
          })),
        });
      }

      await recordAuditLog({
        userId: req.user?.id,
        roleFallback: Role.admin,
        action: 'SOLVE_EXAMS',
        entityType: 'SCHEDULE_VERSION',
        entityId: activeSchedule.id,
        details: {
          count: result.allocations?.length || 0,
          solveTime: result.solve_time,
          status: result.status,
        },
      });

      await emitNotification({
        broadcast: true,
        title: 'Midsem Exams Scheduled',
        message: `CP-SAT scheduled ${result.allocations?.length || 0} midsem course exams with 0 cohort clashes in ${(result.solve_time || 0).toFixed(2)}s.`,
      });
    }

    return res.json({
      success: true,
      count: result.allocations?.length || 0,
      solveTime: result.solve_time,
      status: result.status,
      constraintsChecked: [
        'Half-Capacity Seating (Rule E1)',
        'Exam Room Exclusivity (Rule E4)',
        'Zero Student Cohort Concurrent Clashes (Rule E3)',
        'Multi-Room Capacity Satisfaction (Rule E2)',
        'Daily Workload Smoothing Across Days',
      ],
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Single Exam Reschedule Endpoint with Hard Constraint Pre-flight Validation
router.post('/reschedule-exam', authenticate, requireRole([Role.admin]), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { examExternalId, newDay, newSession, newRooms } = req.body;

    if (!examExternalId || !newDay || !newSession) {
      return res.status(400).json({ error: 'Missing required parameters: examExternalId, newDay, newSession' });
    }

    const dataset = await prisma.datasetVersion.findFirst({ where: { isCurrent: true } });
    if (!dataset) return res.status(404).json({ error: 'No dataset loaded' });

    const activeSchedule = await prisma.scheduleVersion.findFirst({
      where: { datasetVersionId: dataset.id, status: ScheduleStatus.active },
      include: { examAllocations: true },
    });

    if (!activeSchedule) return res.status(404).json({ error: 'No active schedule found' });

    const currentAllocation = activeSchedule.examAllocations.find((a) => a.examExternalId === examExternalId);
    if (!currentAllocation) {
      return res.status(404).json({ error: `Exam allocation '${examExternalId}' not found in active schedule` });
    }

    const allExams = await prisma.midsemExam.findMany({ where: { datasetVersionId: dataset.id } });
    const targetExamMeta = allExams.find((e) => e.externalId === examExternalId);
    if (!targetExamMeta) {
      return res.status(404).json({ error: `Exam metadata '${examExternalId}' not found` });
    }

    const targetGroups = new Set((targetExamMeta.groups as string[]) || []);
    const examMetaMap = new Map(allExams.map((e) => [e.externalId, e]));

    // Rule E3 Check: Zero student cohort clashes in the target slot
    const otherAllocationsInSlot = activeSchedule.examAllocations.filter(
      (a) => a.day === newDay && a.session === newSession && a.examExternalId !== examExternalId
    );

    for (const other of otherAllocationsInSlot) {
      const otherMeta = examMetaMap.get(other.examExternalId);
      if (otherMeta) {
        const otherGroups = (otherMeta.groups as string[]) || [];
        for (const g of otherGroups) {
          if (targetGroups.has(g)) {
            return res.status(422).json({
              error: `Constraint E3 Violation: Student group '${g}' already has exam '${other.examExternalId}' scheduled on ${newDay} ${newSession}.`,
              rule: 'E3',
              conflictingExam: other.examExternalId,
              conflictingGroup: g,
            });
          }
        }
      }
    }

    // Room Assignment & Rule E1 (Half-Capacity Seating) / Rule E4 (Room Exclusivity)
    const allRooms = await prisma.room.findMany({ where: { datasetVersionId: dataset.id } });
    const roomMap = new Map(allRooms.map((r) => [r.externalId, r]));

    const candidateRooms = Array.isArray(newRooms) && newRooms.length > 0
      ? newRooms
      : (currentAllocation.rooms as string[]) || [];

    // Verify rooms are not booked by another exam in that slot
    for (const other of otherAllocationsInSlot) {
      const otherRooms = (other.rooms as string[]) || [];
      for (const r of candidateRooms) {
        if (otherRooms.includes(r)) {
          return res.status(422).json({
            error: `Constraint E4 Violation: Room '${r}' is already assigned to exam '${other.examExternalId}' in ${newDay} ${newSession}.`,
            rule: 'E4',
            conflictingRoom: r,
          });
        }
      }
    }

    // Verify half-capacity seating (sum of capacity // 2 >= exam size)
    let totalHalfCapacity = 0;
    for (const rid of candidateRooms) {
      const r = roomMap.get(rid);
      if (r) {
        totalHalfCapacity += Math.floor(r.capacity / 2);
      }
    }

    if (totalHalfCapacity < targetExamMeta.size) {
      return res.status(422).json({
        error: `Constraint E1 Violation: Assigned room capacity (${totalHalfCapacity} half-capacity seats) is insufficient for ${targetExamMeta.size} students. Requires ${targetExamMeta.size * 2} physical seats.`,
        rule: 'E1',
        available: totalHalfCapacity,
        required: targetExamMeta.size,
      });
    }

    // Persist atomic move
    await prisma.examAllocation.update({
      where: { id: currentAllocation.id },
      data: {
        day: newDay,
        session: newSession,
        rooms: candidateRooms,
      },
    });

    await recordAuditLog({
      userId: req.user?.id,
      roleFallback: Role.admin,
      action: 'RESCHEDULE_EXAM',
      entityType: 'EXAM_ALLOCATION',
      entityId: currentAllocation.id,
      details: {
        examExternalId,
        from: { day: currentAllocation.day, session: currentAllocation.session },
        to: { day: newDay, session: newSession, rooms: candidateRooms },
      },
    });

    await emitNotification({
      broadcast: true,
      title: `Exam Rescheduled: ${examExternalId}`,
      message: `${examExternalId} moved to ${newDay} Session ${newSession} (${candidateRooms.join(', ')}).`,
    });

    return res.json({
      success: true,
      message: `Exam ${examExternalId} successfully rescheduled to ${newDay} Session ${newSession}.`,
      allocation: {
        id: currentAllocation.id,
        examExternalId,
        day: newDay,
        session: newSession,
        rooms: candidateRooms,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
