import { Router, Response } from 'express';
import { PrismaClient, Role, ScheduleStatus } from '@prisma/client';
import axios from 'axios';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();
const OPTIMIZER_URL = process.env.OPTIMIZER_URL || 'http://127.0.0.1:8001';

router.get('/active', async (req, res) => {
  try {
    const dataset = await prisma.datasetVersion.findFirst({ where: { isCurrent: true } });
    if (!dataset) return res.status(404).json({ error: 'No dataset loaded' });

    const activeSchedule = await prisma.scheduleVersion.findFirst({
      where: { datasetVersionId: dataset.id, status: ScheduleStatus.active },
      include: { examAllocations: true },
    });

    const examsMeta = await prisma.midsemExam.findMany({ where: { datasetVersionId: dataset.id } });
    const rooms = await prisma.room.findMany({ where: { datasetVersionId: dataset.id } });

    return res.json({
      allocations: activeSchedule?.examAllocations || [],
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
      for (const a of result.allocations) {
        await prisma.examAllocation.create({
          data: {
            scheduleVersionId: activeSchedule.id,
            examExternalId: a.exam_id,
            day: a.day,
            session: a.session,
            rooms: a.rooms,
          },
        });
      }
    }

    return res.json({ success: true, count: result.allocations.length, solveTime: result.solve_time });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;

