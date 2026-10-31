import { Router, Response } from 'express';
import { PrismaClient, Role } from '@prisma/client';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth.js';
import { seedDatabase } from '../seed.js';

const router = Router();
const prisma = new PrismaClient();

// Get current dataset metadata
router.get('/current', async (req, res) => {
  try {
    const dataset = await prisma.datasetVersion.findFirst({
      where: { isCurrent: true },
      include: {
        _count: {
          select: {
            rooms: true,
            faculty: true,
            studentGroups: true,
            courses: true,
            sessions: true,
            bookingRequests: true,
            midsemExams: true,
          },
        },
      },
    });

    if (!dataset) {
      return res.status(404).json({ error: 'No active dataset found' });
    }

    return res.json({
      id: dataset.id,
      datasetId: dataset.datasetId,
      contentHash: dataset.contentHash,
      createdAt: dataset.createdAt,
      counts: dataset._count,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Admin Reset Demo Data
router.post('/reset-demo', authenticate, requireRole([Role.admin]), async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log(`Admin Demo Reset triggered by user ${req.user?.email}...`);
    await seedDatabase();

    // Log in AuditLog
    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        action: 'ADMIN_DEMO_RESET',
        entityType: 'DATASET',
        details: { message: 'Reset database to clean cit_public.json and seeded demo accounts' },
      },
    });

    return res.json({
      success: true,
      message: 'Demo dataset successfully restored to pristine state. All 4 demo accounts and verified schedules are ready.',
    });
  } catch (err: any) {
    console.error('Demo reset failed:', err);
    return res.status(500).json({ error: `Reset failed: ${err.message}` });
  }
});

export default router;

