import { Router, Response } from 'express';
import { PrismaClient, Role } from '@prisma/client';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth.js';
import { recordAuditLog, emitNotification } from '../utils/notifications.js';
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

    await recordAuditLog({
      userId: req.user?.id,
      roleFallback: Role.admin,
      action: 'ADMIN_DEMO_RESET',
      entityType: 'DATASET',
      details: { message: 'Reset database to clean cit_public.json and seeded demo accounts' },
    });

    await emitNotification({
      broadcast: true,
      title: 'Baseline Schedule Synchronized',
      message: 'Master teaching baseline and demo accounts restored to pristine verified state.',
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

// Admin Load / Upload Custom Dataset JSON (PS Section 2 #9)
router.post('/upload', authenticate, requireRole([Role.admin]), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { dataset } = req.body;
    if (!dataset || !dataset.rooms || !dataset.sessions || !dataset.faculty) {
      return res.status(400).json({ error: 'Invalid dataset format. Missing rooms, sessions, or faculty array.' });
    }

    const datasetId = dataset.id || `cit-custom-${Date.now()}`;
    console.log(`Admin uploading custom dataset: ${datasetId}...`);

    // Create DatasetVersion
    const newVersion = await prisma.datasetVersion.create({
      data: {
        datasetId,
        contentHash: 'custom-' + Date.now(),
        rawJson: dataset,
        isCurrent: true,
      },
    });

    // Mark previous versions as not current
    await prisma.datasetVersion.updateMany({
      where: { id: { not: newVersion.id } },
      data: { isCurrent: false },
    });

    return res.json({
      success: true,
      message: `Custom dataset '${datasetId}' successfully loaded into CIT CampusOS. Ready for timetable generation.`,
      datasetVersionId: newVersion.id,
    });
  } catch (err: any) {
    console.error('Dataset upload error:', err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;

