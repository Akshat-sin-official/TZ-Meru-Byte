import { Router, Response } from 'express';
import { PrismaClient, Role, ScheduleStatus } from '@prisma/client';
import axios from 'axios';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth.js';

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
    }

    return res.json({ success: true, count: result.allocations.length, solveTime: result.solve_time });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;

