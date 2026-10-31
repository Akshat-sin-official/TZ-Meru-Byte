import { Router, Response } from 'express';
import { PrismaClient, Role, ScheduleStatus, BookingDecisionStatus } from '@prisma/client';
import axios from 'axios';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();
const OPTIMIZER_URL = process.env.OPTIMIZER_URL || 'http://127.0.0.1:8001';

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
      priorityOrder: (dataset.rawJson as any)?.priority_order,
      roleCategoryCap: (dataset.rawJson as any)?.role_category_cap,
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
    } = req.body;

    const dataset = await prisma.datasetVersion.findFirst({ where: { isCurrent: true } });
    if (!dataset) return res.status(404).json({ error: 'No dataset loaded' });

    // Derive externalId: BR-NEW-timestamp
    const count = await prisma.bookingRequest.count({ where: { datasetVersionId: dataset.id } });
    const externalId = `BR-EXT-${count + 1}`;

    const newReq = await prisma.bookingRequest.create({
      data: {
        datasetVersionId: dataset.id,
        externalId,
        submittedAt: new Date(),
        requester: req.user?.name || 'Authorized Requester',
        role: req.user?.role || Role.club,
        requestedCategory: req.user?.role === 'admin' ? 'institute_event' : req.user?.role === 'department_coordinator' ? 'department_event' : req.user?.role === 'faculty' ? 'guest_lecture' : 'club_event',
        effectiveCategory: req.user?.role === 'admin' ? 'institute_event' : req.user?.role === 'department_coordinator' ? 'department_event' : req.user?.role === 'faculty' ? 'guest_lecture' : 'club_event',
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

    return res.json({ success: true, bookingRequest: newReq });
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

    // Persist decisions
    await prisma.bookingDecision.deleteMany({ where: { scheduleVersionId: activeSchedule.id } });
    await prisma.sessionOverride.deleteMany({ where: { scheduleVersionId: activeSchedule.id } });

    const decStatusMap: Record<string, BookingDecisionStatus> = {
      approved: BookingDecisionStatus.approved,
      alternative_offered: BookingDecisionStatus.alternative_offered,
      rejected: BookingDecisionStatus.rejected,
    };

    for (const d of result.bookings) {
      const reqRecord = await prisma.bookingRequest.findUnique({
        where: {
          datasetVersionId_externalId: {
            datasetVersionId: dataset.id,
            externalId: d.request_id,
          },
        },
      });

      if (reqRecord) {
        await prisma.bookingDecision.create({
          data: {
            scheduleVersionId: activeSchedule.id,
            requestId: reqRecord.id,
            status: decStatusMap[d.status] || BookingDecisionStatus.rejected,
            day: d.day || null,
            startPeriod: d.start_period || null,
            endPeriod: d.end_period || null,
            roomExternalId: d.room_id || null,
            reason: d.reason || '',
          },
        });
      }
    }

    for (const o of result.session_overrides || []) {
      await prisma.sessionOverride.create({
        data: {
          scheduleVersionId: activeSchedule.id,
          sessionExternalId: o.session_id,
          day: o.day,
          startPeriod: o.start_period,
          roomExternalId: o.room_id,
          displacedByReqId: o.displaced_by,
        },
      });
    }

    return res.json({ success: true, count: result.bookings.length, overrides: result.session_overrides.length });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;

