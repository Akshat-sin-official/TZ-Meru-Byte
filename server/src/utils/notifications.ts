import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Safely resolves a valid database user ID.
 * If the provided userId is missing or no longer exists (e.g. after a reset or mock login),
 * it falls back to an existing user with matching role to strictly satisfy foreign key constraints.
 */
export async function getSafeUserId(userId?: string | null, roleFallback: Role = Role.admin): Promise<string | null> {
  if (userId) {
    const existing = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (existing) return existing.id;
  }

  // Fallback to first user matching role, or any user in DB
  const fallback = await prisma.user.findFirst({
    where: { role: roleFallback },
    select: { id: true },
  });

  if (fallback) return fallback.id;

  const anyUser = await prisma.user.findFirst({ select: { id: true } });
  return anyUser?.id || null;
}

/**
 * Records an Audit Log entry safely without foreign key violations.
 */
export async function recordAuditLog({
  userId,
  roleFallback = Role.admin,
  action,
  entityType,
  entityId,
  details,
}: {
  userId?: string | null;
  roleFallback?: Role;
  action: string;
  entityType: string;
  entityId?: string;
  details?: any;
}) {
  try {
    const safeUserId = await getSafeUserId(userId, roleFallback);
    return await prisma.auditLog.create({
      data: {
        userId: safeUserId,
        action,
        entityType,
        entityId,
        details,
      },
    });
  } catch (err: any) {
    console.error(`[AuditLog] Failed to record audit log for action ${action}:`, err.message);
  }
}

/**
 * Emits an in-app Notification to a specific user, role cohort, or campus-wide broadcast.
 */
export async function emitNotification({
  userId,
  role,
  broadcast = false,
  title,
  message,
}: {
  userId?: string | null;
  role?: Role;
  broadcast?: boolean;
  title: string;
  message: string;
}) {
  try {
    if (broadcast) {
      const allUsers = await prisma.user.findMany({ select: { id: true } });
      if (allUsers.length > 0) {
        await prisma.notification.createMany({
          data: allUsers.map((u) => ({
            userId: u.id,
            title,
            message,
            read: false,
          })),
        });
      }
      return;
    }

    if (role) {
      const targetUsers = await prisma.user.findMany({
        where: { role },
        select: { id: true },
      });
      if (targetUsers.length > 0) {
        await prisma.notification.createMany({
          data: targetUsers.map((u) => ({
            userId: u.id,
            title,
            message,
            read: false,
          })),
        });
        return;
      }
    }

    const safeUserId = await getSafeUserId(userId, Role.admin);
    if (safeUserId) {
      await prisma.notification.create({
        data: {
          userId: safeUserId,
          title,
          message,
          read: false,
        },
      });
    }
  } catch (err: any) {
    console.error('[Notification] Failed to emit notification:', err.message);
  }
}
