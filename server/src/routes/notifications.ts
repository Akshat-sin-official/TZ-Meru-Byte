import { Router, Response } from 'express';
import { PrismaClient, Role } from '@prisma/client';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';
import { getSafeUserId } from '../utils/notifications.js';

const router = Router();
const prisma = new PrismaClient();

// GET /api/notifications - List all notifications for authenticated user
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const safeUserId = await getSafeUserId(req.user?.id, req.user?.role || Role.admin);
    if (!safeUserId) {
      return res.json({ notifications: [], unreadCount: 0 });
    }

    const notifications = await prisma.notification.findMany({
      where: {
        userId: safeUserId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 30,
    });

    const unreadCount = notifications.filter((n) => !n.read).length;

    return res.json({
      notifications,
      unreadCount,
    });
  } catch (err: any) {
    console.error('Failed to fetch notifications:', err);
    return res.status(500).json({ error: 'Failed to retrieve notifications' });
  }
});

// PATCH /api/notifications/:id/read - Mark single notification as read
router.patch('/:id/read', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    const notification = await prisma.notification.update({
      where: { id },
      data: { read: true },
    });

    return res.json({ success: true, notification });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// POST /api/notifications/mark-all-read - Mark all user notifications as read
router.post('/mark-all-read', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const safeUserId = await getSafeUserId(req.user?.id, req.user?.role || Role.admin);
    if (safeUserId) {
      await prisma.notification.updateMany({
        where: {
          userId: safeUserId,
          read: false,
        },
        data: {
          read: true,
        },
      });
    }

    return res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to mark notifications as read' });
  }
});

export default router;
