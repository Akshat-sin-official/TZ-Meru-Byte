import { Router, Response } from 'express';
import { PrismaClient, Role, ScheduleStatus, BookingDecisionStatus } from '@prisma/client';
import axios from 'axios';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth.js';
import { emitNotification, recordAuditLog } from '../utils/notifications.js';
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

router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
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

    let requests = await prisma.bookingRequest.findMany({
      where: { datasetVersionId: dataset.id },
      orderBy: { submittedAt: 'asc' },
    });

    const userRole = req.user?.role;
    const userName = req.user?.name || '';
    const clubName = req.user?.clubName || '';

    // Per ini.md Section 3: View all venue requests is Admin only; Others view own / department requests
    if (userRole === Role.club) {
      requests = requests.filter(
        (r) =>
          r.role === Role.club ||
          (clubName && r.requester.toLowerCase().includes(clubName.toLowerCase())) ||
          r.requester.toLowerCase().includes(userName.toLowerCase())
      );
    } else if (userRole === Role.faculty) {
      requests = requests.filter(
        (r) =>
          r.role === Role.faculty ||
          r.effectiveCategory === 'guest_lecture' ||
          r.requester.toLowerCase().includes(userName.toLowerCase())
      );
    } else if (userRole === Role.department_coordinator) {
      requests = requests.filter(
        (r) =>
          r.role === Role.department_coordinator ||
          r.effectiveCategory === 'department_event' ||
          r.requester.toLowerCase().includes('coordinator') ||
          r.requester.toLowerCase().includes(userName.toLowerCase())
      );
    }

    const scopedReqIds = new Set(requests.map((r) => r.id));
    const scopedDecisions = (activeSchedule?.bookingDecisions || []).filter((d) =>
      userRole === Role.admin ? true : scopedReqIds.has(d.requestId)
    );

    const rooms = await prisma.room.findMany({ where: { datasetVersionId: dataset.id } });

    return res.json({
      requests,
      decisions: scopedDecisions,
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

    await emitNotification({
      broadcast: true,
      title: 'Spectra Fest Allocations Solved',
      message: `CP-SAT solved ${result.bookings?.length || 0} event venue requests with priority satisfaction (${decisionsData.filter(d => d.status === BookingDecisionStatus.approved).length} approved, ${result.session_overrides?.length || 0} session overrides).`,
    });

    return res.json({ success: true, count: result.bookings.length, overrides: result.session_overrides.length });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});


// Department Coordinator Lab Booking Approval (PS Section 4)
router.post('/approve-lab/:requestId', authenticate, requireRole([Role.department_coordinator, Role.admin]), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const requestId = String(req.params.requestId);
    const bookingReq = await prisma.bookingRequest.findFirst({
      where: {
        OR: [{ id: requestId }, { externalId: requestId }],
      },
    });

    if (!bookingReq) {
      return res.status(404).json({ error: 'Booking request not found' });
    }

    const coordDept = (req.user?.department || '').toUpperCase();
    const isDeptLab = 
      (bookingReq.requestedRoom && (
        (coordDept.includes('CSE') && bookingReq.requestedRoom.includes('CS-LAB')) ||
        (coordDept.includes('ECE') && bookingReq.requestedRoom.includes('ELEC-LAB')) ||
        (coordDept.includes('MECH') && bookingReq.requestedRoom.includes('MECH-WS')) ||
        (coordDept.includes('CIVIL') && bookingReq.requestedRoom.includes('CIVIL-LAB')) ||
        (coordDept.includes('PHY') && bookingReq.requestedRoom.includes('PHY-LAB'))
      )) ||
      (Array.isArray(bookingReq.roomTypes) && (
        (bookingReq.roomTypes as string[]).some(rt => rt.toLowerCase().includes('lab') || rt.toLowerCase().includes('workshop'))
      ));

    if (req.user?.role !== Role.admin && !isDeptLab) {
      return res.status(403).json({
        error: `Forbidden: As ${req.user?.department} Coordinator, you can only approve bookings for your department's specialized laboratories.`,
      });
    }

    // RBAC: Separation of duties check
    if (bookingReq.requester && req.user?.name && bookingReq.requester.toLowerCase().includes(req.user.name.toLowerCase()) && req.user?.role !== Role.admin) {
      return res.status(403).json({
        error: 'Forbidden: You cannot approve your own booking request. Separation of duties requires independent review.',
      });
    }

    const activeSchedule = await prisma.scheduleVersion.findFirst({
      where: { datasetVersionId: bookingReq.datasetVersionId, status: ScheduleStatus.active },
    });

    if (!activeSchedule) {
      return res.status(404).json({ error: 'No active schedule version found to attach booking decision' });
    }

    const windows = bookingReq.windows as any[];
    const firstWin = (windows && windows.length > 0) ? windows[0] : null;
    const allocDay = firstWin?.day || 'FRI';
    const allocStart = firstWin?.start_period || 10;
    const allocEnd = firstWin?.end_period || (allocStart + bookingReq.durationPeriods - 1);
    const allocRoom = bookingReq.requestedRoom || (coordDept.includes('CSE') ? 'CS-LAB-1' : 'CS-LAB-2');

    const decision = await prisma.bookingDecision.upsert({
      where: {
        scheduleVersionId_requestId: {
          scheduleVersionId: activeSchedule.id,
          requestId: bookingReq.id,
        },
      },
      create: {
        scheduleVersionId: activeSchedule.id,
        requestId: bookingReq.id,
        status: BookingDecisionStatus.approved,
        day: allocDay,
        startPeriod: allocStart,
        endPeriod: allocEnd,
        roomExternalId: allocRoom,
        reason: `Approved by Department Coordinator (${req.user?.name || coordDept}) under departmental laboratory booking authority.`,
      },
      update: {
        status: BookingDecisionStatus.approved,
        day: allocDay,
        startPeriod: allocStart,
        endPeriod: allocEnd,
        roomExternalId: allocRoom,
        reason: `Approved by Department Coordinator (${req.user?.name || coordDept}) under departmental laboratory booking authority.`,
      },
    });

    await emitNotification({
      broadcast: true,
      title: 'Lab Booking Approved',
      message: `Booking request for ${bookingReq.title} approved by ${req.user?.name} for ${allocRoom} (${allocDay} P${allocStart}–P${allocEnd}).`,
    });

    return res.json({
      success: true,
      decision,
      message: `Successfully approved lab booking for ${bookingReq.title}.`,
    });
  } catch (err: any) {
    console.error('Approve lab error:', err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
