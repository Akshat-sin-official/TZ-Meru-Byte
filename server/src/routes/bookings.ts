import { Router, Response } from 'express';
import { PrismaClient, Role, ScheduleStatus, BookingDecisionStatus } from '@prisma/client';
import axios from 'axios';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth.js';
import {
  resolveRoomConflict,
  getEffectiveCategory,
  ROOM_PRIORITY_ORDER,
  CATEGORY_META,
} from '../utils/priority.js';

const router = Router();
const prisma = new PrismaClient();
const OPTIMIZER_URL = process.env.OPTIMIZER_URL || 'http://127.0.0.1:8001';

const PRIORITY_HIERARCHY_PAYLOAD = ROOM_PRIORITY_ORDER.map((k) => ({
  rank: CATEGORY_META[k].rank,
  key: k,
  label: CATEGORY_META[k].label,
  description: CATEGORY_META[k].description,
}));

router.get('/', async (req, res) => {
  try {
    const dataset = await prisma.datasetVersion.findFirst({ where: { isCurrent: true } });
    if (!dataset) return res.status(404).json({ error: 'No dataset loaded' });

    const activeSchedule = await prisma.scheduleVersion.findFirst({
      where: { datasetVersionId: dataset.id, status: ScheduleStatus.active },
      include: {
        bookingDecisions: {
          include: { request: true },
        },
        sessionOverrides: true,
      },
    });

    const requests = await prisma.bookingRequest.findMany({
      where: { datasetVersionId: dataset.id },
      orderBy: { submittedAt: 'asc' },
    });

    const rooms = await prisma.room.findMany({ where: { datasetVersionId: dataset.id } });

    return res.json({
      requests,
      decisions: activeSchedule?.bookingDecisions || [],
      sessionOverrides: activeSchedule?.sessionOverrides || [],
      rooms,
      priorityOrder: (dataset.rawJson as any)?.priority_order || ROOM_PRIORITY_ORDER,
      roleCategoryCap: (dataset.rawJson as any)?.role_category_cap,
      priorityHierarchy: PRIORITY_HIERARCHY_PAYLOAD,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Room Conflict Arbiter Endpoint:
 * When two requests want the same room at the same time, this order decides who gets it:
 * 1. Exams
 * 2. Regular classes
 * 3. Institute events (Spectra main events, convocation)
 * 4. Guest lectures
 * 5. Department events
 * 6. Club events
 *
 * Ties are broken by earlier submitted_at timestamp.
 */
router.post('/conflict-check', async (req, res) => {
  try {
    const { request_a, request_b } = req.body;
    if (!request_a || !request_b) {
      return res.status(400).json({
        error: 'Both request_a and request_b are required to evaluate room conflict.',
      });
    }

    const resolution = resolveRoomConflict(request_a, request_b);
    return res.json({
      success: true,
      resolution,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/requests', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      title,
      attendance,
      duration_periods,
      windows,
      room_types,
      needs,
      requested_room,
      mandatory_for_groups,
      raw_text,
      requested_category,
      requestedCategory,
    } = req.body;

    const dataset = await prisma.datasetVersion.findFirst({ where: { isCurrent: true } });
    if (!dataset) return res.status(404).json({ error: 'No dataset loaded' });

    // Derive externalId: BR-NEW-timestamp
    const count = await prisma.bookingRequest.count({ where: { datasetVersionId: dataset.id } });
    const externalId = `BR-EXT-${count + 1}`;

    const userRole = req.user?.role || Role.club;
    const reqCat = requested_category || requestedCategory || (userRole === 'admin' ? 'institute_event' : 'club_event');
    const effCat = getEffectiveCategory({
      role: userRole,
      requestedCategory: reqCat,
    });

    const newReq = await prisma.bookingRequest.create({
      data: {
        datasetVersionId: dataset.id,
        externalId,
        submittedAt: new Date(),
        requester: req.user?.name || 'Authorized Requester',
        role: userRole,
        requestedCategory: reqCat,
        effectiveCategory: effCat,
        title: title || 'Campus Booking',
        attendance: Number(attendance) || 50,
        durationPeriods: Number(duration_periods) || 2,
        windows: windows || [{ day: 'FRI', from_period: 10, to_period: 12 }],
        roomTypes: room_types || ['seminar_hall', 'auditorium'],
        needs: needs || [],
        requestedRoom: requested_room || null,
        mandatoryForGroups: mandatory_for_groups || [],
        rawText: raw_text || null,
      },
    });

    return res.json({
      success: true,
      bookingRequest: newReq,
      priorityDetails: {
        rank: CATEGORY_META[effCat]?.rank || 6,
        category: effCat,
        label: CATEGORY_META[effCat]?.label || 'Club events',
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Run Spectra Allocation
router.post('/solve', authenticate, requireRole([Role.admin]), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const dataset = await prisma.datasetVersion.findFirst({ where: { isCurrent: true } });
    const activeSchedule = await prisma.scheduleVersion.findFirst({
      where: { datasetVersionId: dataset?.id, status: ScheduleStatus.active },
      include: { assignments: true },
    });

    if (!dataset || !activeSchedule) return res.status(404).json({ error: 'Missing active dataset or schedule' });

    const assignmentsPayload = activeSchedule.assignments.map((a) => ({
      session_id: a.sessionExternalId,
      day: a.day,
      start_period: a.startPeriod,
      room_id: a.roomExternalId,
    }));

    const solveRes = await axios.post(`${OPTIMIZER_URL}/internal/solve/bookings`, {
      dataset: dataset.rawJson,
      timetable_assignments: assignmentsPayload,
    });

    const result = solveRes.data;

    // Persist decisions using batch processing
    await prisma.bookingDecision.deleteMany({ where: { scheduleVersionId: activeSchedule.id } });
    await prisma.sessionOverride.deleteMany({ where: { scheduleVersionId: activeSchedule.id } });

    const decStatusMap: Record<string, BookingDecisionStatus> = {
      approved: BookingDecisionStatus.approved,
      alternative_offered: BookingDecisionStatus.alternative_offered,
      rejected: BookingDecisionStatus.rejected,
    };

    // Batch fetch all booking requests in one query
    const allRequests = await prisma.bookingRequest.findMany({
      where: { datasetVersionId: dataset.id },
    });
    const reqMap = new Map(allRequests.map((r) => [r.externalId, r]));

    const decisionsData = [];
    for (const d of result.bookings || []) {
      const reqRecord = reqMap.get(d.request_id);
      if (reqRecord) {
        decisionsData.push({
          scheduleVersionId: activeSchedule.id,
          requestId: reqRecord.id,
          status: decStatusMap[d.status] || BookingDecisionStatus.rejected,
          day: d.day || null,
          startPeriod: d.start_period || null,
          endPeriod: d.end_period || null,
          roomExternalId: d.room_id || null,
          reason: d.reason || '',
        });
      }
    }

    if (decisionsData.length > 0) {
      await prisma.bookingDecision.createMany({
        data: decisionsData,
      });
    }

    if (result.session_overrides && result.session_overrides.length > 0) {
      await prisma.sessionOverride.createMany({
        data: result.session_overrides.map((o: any) => ({
          scheduleVersionId: activeSchedule.id,
          sessionExternalId: o.session_id,
          day: o.day,
          startPeriod: o.start_period,
          roomExternalId: o.room_id,
          displacedByReqId: o.displaced_by,
        })),
      });
    }

    return res.json({ success: true, count: result.bookings.length, overrides: result.session_overrides.length });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
