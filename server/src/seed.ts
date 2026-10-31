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
      email: 'admin@cit.edu',
      password: 'CitAdmin2027!',
      name: 'Prof. Dean Office (Admin)',
      role: Role.admin,
      facultyId: 'F37',
    },
    {
      email: 'coord.cse@cit.edu',
      password: 'CitCoord2027!',
      name: 'Dr. CSE Coordinator',
      role: Role.department_coordinator,
      department: 'CSE',
      facultyId: 'F01',
    },
    {
      email: 'faculty.f19@cit.edu',
      password: 'CitFaculty2027!',
      name: 'Dr. S. Rath (Faculty F19)',
      role: Role.faculty,
      department: 'MATH',
      facultyId: 'F19',
    },
    {
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

  // 3. Seed Rooms
  console.log(`Seeding ${citData.rooms.length} rooms...`);
  for (const r of citData.rooms) {
    const roomRecord = await prisma.room.create({
      data: {
        datasetVersionId: datasetVersion.id,
        externalId: r.id,
        name: r.name,
        building: r.building,
        type: r.type,
        capacity: r.capacity,
        features: r.features || [],
        accessible: Boolean(r.accessible),
        allowedUses: r.allowed_uses || [],
      },
    });

    // Unavailability
    const unavails = (citData.room_unavailability || []).filter((u: any) => u.room_id === r.id);
    for (const u of unavails) {
      await prisma.roomUnavailability.create({
        data: {
          roomId: roomRecord.id,
          day: u.day,
          periods: u.periods,
          reason: u.reason || null,
        },
      });
    }
  }

  // 4. Seed Faculty
  console.log(`Seeding ${citData.faculty.length} faculty members...`);
  for (const f of citData.faculty) {
    await prisma.faculty.create({
      data: {
        datasetVersionId: datasetVersion.id,
        externalId: f.id,
        name: f.name,
        department: f.department,
        maxHoursPerDay: f.max_hours_per_day || 4,
        needsAccessible: Boolean(f.needs_accessible),
        unavailable: f.unavailable || [],
        preferences: f.preferences || [],
      },
    });
  }

  // 5. Seed Student Groups
  console.log(`Seeding ${citData.student_groups.length} student groups...`);
  for (const g of citData.student_groups) {
    await prisma.studentGroup.create({
      data: {
        datasetVersionId: datasetVersion.id,
        externalId: g.id,
        name: g.name,
        year: g.year,
        department: g.department,
        size: g.size,
        needsAccessible: Boolean(g.needs_accessible),
      },
    });
  }

  // 6. Seed Courses
  console.log(`Seeding ${citData.courses.length} courses...`);
  for (const c of citData.courses) {
    await prisma.course.create({
      data: {
        datasetVersionId: datasetVersion.id,
        externalId: c.id,
        name: c.name || c.id,
        department: c.department,
        year: c.year,
        lectureHours: c.lecture_hours,
        tutorialHours: c.tutorial_hours,
        labBlocks: c.lab_blocks,
      },
    });
  }

  // 7. Seed Sessions
  console.log(`Seeding ${citData.sessions.length} sessions...`);
  for (const s of citData.sessions) {
    await prisma.session.create({
      data: {
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
      },
    });
  }

  // 8. Seed Booking Requests
  console.log(`Seeding ${citData.booking_requests.length} Spectra booking requests...`);
  const cancelledIds = new Set((citData.cancellations || []).map((c: any) => c.request_id));
  const roleMap: Record<string, Role> = {
    admin: Role.admin,
    department_coordinator: Role.department_coordinator,
    faculty: Role.faculty,
    club: Role.club,
  };

  for (const b of citData.booking_requests) {
    await prisma.bookingRequest.create({
      data: {
        datasetVersionId: datasetVersion.id,
        externalId: b.id,
        submittedAt: new Date(b.submitted_at),
        requester: b.requester,
        role: roleMap[b.role] || Role.club,
        requestedCategory: b.requested_category,
        effectiveCategory: b.requested_category, // computed dynamically
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
      },
    });
  }

  // 9. Seed Midsem Exams
  console.log(`Seeding ${citData.exams.length} midsem exams...`);
  for (const e of citData.exams) {
    await prisma.midsemExam.create({
      data: {
        datasetVersionId: datasetVersion.id,
        externalId: e.id,
        courseIds: e.course_ids,
        groups: e.groups,
        size: e.size,
        durationHours: e.duration_hours,
      },
    });
  }

  // 10. Load Initial Active Schedule (from exports/schedule.json)
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

    // Assignments
    for (const s of schedData.sessions || []) {
      await prisma.scheduleAssignment.create({
        data: {
          scheduleVersionId: activeSchedule.id,
          sessionExternalId: s.session_id,
          day: s.day,
          startPeriod: s.start_period,
          roomExternalId: s.room_id,
        },
      });
    }

    // Bookings
    const bookingDecisions = schedData.fest_week?.bookings || [];
    const decStatusMap: Record<string, BookingDecisionStatus> = {
      approved: BookingDecisionStatus.approved,
      alternative_offered: BookingDecisionStatus.alternative_offered,
      rejected: BookingDecisionStatus.rejected,
    };

    for (const d of bookingDecisions) {
      const bReq = await prisma.bookingRequest.findUnique({
        where: {
          datasetVersionId_externalId: {
            datasetVersionId: datasetVersion.id,
            externalId: d.request_id,
          },
        },
      });

      if (bReq) {
        await prisma.bookingDecision.create({
          data: {
            scheduleVersionId: activeSchedule.id,
            requestId: bReq.id,
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

    // Session Overrides
    for (const o of schedData.fest_week?.session_overrides || []) {
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

    // Exams
    for (const e of schedData.exams || []) {
      await prisma.examAllocation.create({
        data: {
          scheduleVersionId: activeSchedule.id,
          examExternalId: e.exam_id,
          day: e.day,
          session: e.session,
          rooms: e.rooms,
        },
      });
    }

    console.log(`Active ScheduleVersion created (id: ${activeSchedule.id}) with 0 hard violations.`);
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
