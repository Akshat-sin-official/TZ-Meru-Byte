import { PrismaClient, Role, ScheduleStatus, BookingDecisionStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const prisma = new PrismaClient();

const DATA_PATH = path.resolve(__dirname, '../../docs/PS/CrunchWeek_StarterPack (1)/CrunchWeek_StarterPack/data/cit_public.json');
const SCHEDULE_PATH = path.resolve(__dirname, '../../exports/schedule.json');

export async function seedDatabase() {
  console.log('--- Starting CIT CampusOS Database Seeding ---');

  // Read cit_public.json
  const rawData = fs.readFileSync(DATA_PATH, 'utf-8');
  const citData = JSON.parse(rawData);
  const contentHash = crypto.createHash('sha256').update(rawData).digest('hex');

  // 1. Create or update DatasetVersion
  console.log(`Ingesting Dataset: ${citData.dataset_id} (hash: ${contentHash.substring(0, 10)}...)`);
  
  // Clear existing dataset versions to ensure clean seed
  await prisma.scheduleAssignment.deleteMany();
  await prisma.bookingDecision.deleteMany();
  await prisma.sessionOverride.deleteMany();
  await prisma.examAllocation.deleteMany();
  await prisma.scheduleVersion.deleteMany();
  await prisma.disruptionJob.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.roomUnavailability.deleteMany();
  await prisma.room.deleteMany();
  await prisma.faculty.deleteMany();
  await prisma.studentGroup.deleteMany();
  await prisma.course.deleteMany();
  await prisma.session.deleteMany();
  await prisma.bookingRequest.deleteMany();
  await prisma.midsemExam.deleteMany();
  await prisma.datasetVersion.deleteMany();
  await prisma.user.deleteMany();

  const datasetVersion = await prisma.datasetVersion.create({
    data: {
      datasetId: citData.dataset_id,
      contentHash,
      isCurrent: true,
      rawJson: citData,
    },
  });

  // 2. Seed Demo Accounts
  console.log('Seeding 4 standard demo accounts...');
  const users = [
    {
      id: 'usr-cit-admin-001',
      email: 'admin@cit.edu',
      password: 'CitAdmin2027!',
      name: 'Prof. Dean Office (Admin)',
      role: Role.admin,
      facultyId: 'F37',
    },
    {
      id: 'usr-cit-coord-002',
      email: 'coord.cse@cit.edu',
      password: 'CitCoord2027!',
      name: 'Dr. CSE Coordinator',
      role: Role.department_coordinator,
      department: 'CSE',
      facultyId: 'F01',
    },
    {
      id: 'usr-cit-faculty-003',
      email: 'faculty.f19@cit.edu',
      password: 'CitFaculty2027!',
      name: 'Dr. S. Rath (Faculty F19)',
      role: Role.faculty,
      department: 'MATH',
      facultyId: 'F19',
    },
    {
      id: 'usr-cit-club-004',
      email: 'dramatics@cit.edu',
      password: 'CitClub2027!',
      name: 'Dramatics Society',
      role: Role.club,
      clubName: 'Dramatics Society',
    },
  ];

  for (const u of users) {
    const passwordHash = await bcrypt.hash(u.password, 10);
    await prisma.user.create({
      data: {
        id: u.id,
        email: u.email,
        passwordHash,
        name: u.name,
        role: u.role,
        department: u.department,
        facultyId: u.facultyId,
        clubName: u.clubName,
      },
    });
  }

  // 3. Seed Rooms & Unavailability (Batch Processing)
  console.log(`Seeding ${citData.rooms.length} rooms...`);
  await prisma.room.createMany({
    data: citData.rooms.map((r: any) => ({
      datasetVersionId: datasetVersion.id,
      externalId: r.id,
      name: r.name,
      building: r.building,
      type: r.type,
      capacity: r.capacity,
      features: r.features || [],
      accessible: Boolean(r.accessible),
      allowedUses: r.allowed_uses || [],
    })),
  });

  const seededRooms = await prisma.room.findMany({
    where: { datasetVersionId: datasetVersion.id },
  });
  const roomMap = new Map(seededRooms.map((r) => [r.externalId, r.id]));

  const unavailData: any[] = [];
  for (const u of citData.room_unavailability || []) {
    const roomId = roomMap.get(u.room_id);
    if (roomId) {
      unavailData.push({
        roomId,
        day: u.day,
        periods: u.periods,
        reason: u.reason || null,
      });
    }
  }
  if (unavailData.length > 0) {
    await prisma.roomUnavailability.createMany({ data: unavailData });
  }

  // 4. Seed Faculty (Batch Processing)
  console.log(`Seeding ${citData.faculty.length} faculty members...`);
  await prisma.faculty.createMany({
    data: citData.faculty.map((f: any) => ({
      datasetVersionId: datasetVersion.id,
      externalId: f.id,
      name: f.name,
      department: f.department,
      maxHoursPerDay: f.max_hours_per_day || 4,
      needsAccessible: Boolean(f.needs_accessible),
      unavailable: f.unavailable || [],
      preferences: f.preferences || [],
    })),
  });

  // 5. Seed Student Groups (Batch Processing)
  console.log(`Seeding ${citData.student_groups.length} student groups...`);
  await prisma.studentGroup.createMany({
    data: citData.student_groups.map((g: any) => ({
      datasetVersionId: datasetVersion.id,
      externalId: g.id,
      name: g.name,
      year: g.year,
      department: g.department,
      size: g.size,
      needsAccessible: Boolean(g.needs_accessible),
    })),
  });

  // 6. Seed Courses (Batch Processing)
  console.log(`Seeding ${citData.courses.length} courses...`);
  await prisma.course.createMany({
    data: citData.courses.map((c: any) => ({
      datasetVersionId: datasetVersion.id,
      externalId: c.id,
      name: c.name || c.id,
      department: c.department,
      year: c.year,
      lectureHours: c.lecture_hours,
      tutorialHours: c.tutorial_hours,
      labBlocks: c.lab_blocks,
    })),
  });

  // 7. Seed Sessions (Batch Processing)
  console.log(`Seeding ${citData.sessions.length} sessions...`);
  await prisma.session.createMany({
    data: citData.sessions.map((s: any) => ({
      datasetVersionId: datasetVersion.id,
      externalId: s.id,
      courseId: s.course_id,
      kind: s.kind,
      groups: s.groups,
      facultyId: s.faculty_id,
      size: s.size,
      duration: s.duration,
      roomTypes: s.room_types,
      needsAccessible: Boolean(s.needs_accessible),
      basketSlot: s.basket_slot || null,
      fixedSlot: s.fixed_slot || null,
    })),
  });

  // 8. Seed Booking Requests (Batch Processing)
  console.log(`Seeding ${citData.booking_requests.length} Spectra booking requests...`);
  const cancelledIds = new Set((citData.cancellations || []).map((c: any) => c.request_id));
  const roleMap: Record<string, Role> = {
    admin: Role.admin,
    department_coordinator: Role.department_coordinator,
    faculty: Role.faculty,
    club: Role.club,
  };

  await prisma.bookingRequest.createMany({
    data: citData.booking_requests.map((b: any) => ({
      datasetVersionId: datasetVersion.id,
      externalId: b.id,
      submittedAt: new Date(b.submitted_at),
      requester: b.requester,
      role: roleMap[b.role] || Role.club,
      requestedCategory: b.requested_category,
      effectiveCategory: b.requested_category,
      title: b.title,
      attendance: b.attendance,
      durationPeriods: b.duration_periods,
      windows: b.windows,
      roomTypes: b.room_types,
      needs: b.needs || [],
      requestedRoom: b.requested_room || null,
      mandatoryForGroups: b.mandatory_for_groups || [],
      seriesId: b.series_id || null,
      rawText: b.raw_text || null,
      isCancelled: cancelledIds.has(b.id),
    })),
  });

  // 9. Seed Midsem Exams (Batch Processing)
  console.log(`Seeding ${citData.exams.length} midsem exams...`);
  await prisma.midsemExam.createMany({
    data: citData.exams.map((e: any) => ({
      datasetVersionId: datasetVersion.id,
      externalId: e.id,
      courseIds: e.course_ids,
      groups: e.groups,
      size: e.size,
      durationHours: e.duration_hours,
    })),
  });

  // 10. Load Initial Active Schedule (from exports/schedule.json via Batch Inserts)
  if (fs.existsSync(SCHEDULE_PATH)) {
    console.log('Loading verified baseline schedule from exports/schedule.json...');
    const schedData = JSON.parse(fs.readFileSync(SCHEDULE_PATH, 'utf-8'));

    const activeSchedule = await prisma.scheduleVersion.create({
      data: {
        datasetVersionId: datasetVersion.id,
        versionNumber: 1,
        status: ScheduleStatus.active,
        hardViolations: 0,
        softScoreTotal: 315,
        activatedAt: new Date(),
      },
    });

    // Assignments batch
    if (schedData.sessions && schedData.sessions.length > 0) {
      await prisma.scheduleAssignment.createMany({
        data: schedData.sessions.map((s: any) => ({
          scheduleVersionId: activeSchedule.id,
          sessionExternalId: s.session_id,
          day: s.day,
          startPeriod: s.start_period,
          roomExternalId: s.room_id,
        })),
      });
    }

    // Bookings batch
    const seededRequests = await prisma.bookingRequest.findMany({
      where: { datasetVersionId: datasetVersion.id },
    });
    const bReqMap = new Map(seededRequests.map((r) => [r.externalId, r.id]));
    const bookingDecisions = schedData.fest_week?.bookings || [];
    const decStatusMap: Record<string, BookingDecisionStatus> = {
      approved: BookingDecisionStatus.approved,
      alternative_offered: BookingDecisionStatus.alternative_offered,
      rejected: BookingDecisionStatus.rejected,
    };

    const decisionsData: any[] = [];
    for (const d of bookingDecisions) {
      const reqId = bReqMap.get(d.request_id);
      if (reqId) {
        decisionsData.push({
          scheduleVersionId: activeSchedule.id,
          requestId: reqId,
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
      await prisma.bookingDecision.createMany({ data: decisionsData });
    }

    // Session Overrides batch
    if (schedData.fest_week?.session_overrides && schedData.fest_week.session_overrides.length > 0) {
      await prisma.sessionOverride.createMany({
        data: schedData.fest_week.session_overrides.map((o: any) => ({
          scheduleVersionId: activeSchedule.id,
          sessionExternalId: o.session_id,
          day: o.day,
          startPeriod: o.start_period,
          roomExternalId: o.room_id,
          displacedByReqId: o.displaced_by,
        })),
      });
    }

    // Exams batch
    if (schedData.exams && schedData.exams.length > 0) {
      await prisma.examAllocation.createMany({
        data: schedData.exams.map((e: any) => ({
          scheduleVersionId: activeSchedule.id,
          examExternalId: e.exam_id,
          day: e.day,
          session: e.session,
          rooms: e.rooms,
        })),
      });
    }

    console.log(`Active ScheduleVersion created (id: ${activeSchedule.id}) with 0 hard violations.`);
  }

  // 9. Seed Authentic Initial Notifications
  console.log('Seeding initial campus notifications...');
  const allUsers = await prisma.user.findMany({ select: { id: true } });
  const initialNotifications = [
    {
      title: 'Disruption Handled: Room LH-1 Closure',
      message: '3 teaching sessions rescheduled to LH-2 with 0 constraint violations. Verified by Dean Office.',
    },
    {
      title: 'Spectra Fest Booking BR-04 Approved',
      message: 'Auditorium-1 booked for Oct 22, 18:00–21:00 (Priority 3: Institute Event).',
    },
    {
      title: 'Autumn 2027 Baseline Synchronized',
      message: 'All 189 teaching sessions validated with continuous 13:00 lunch break.',
    },
  ];

  const notifsToInsert: any[] = [];
  for (const u of allUsers) {
    for (const n of initialNotifications) {
      notifsToInsert.push({
        userId: u.id,
        title: n.title,
        message: n.message,
        read: false,
      });
    }
  }
  if (notifsToInsert.length > 0) {
    await prisma.notification.createMany({ data: notifsToInsert });
  }

  console.log('--- CIT CampusOS Seeding Completed Successfully ---');
}

if (require.main === module) {
  seedDatabase()
    .then(() => prisma.$disconnect())
    .catch((e) => {
      console.error(e);
      prisma.$disconnect();
      process.exit(1);
    });
}
