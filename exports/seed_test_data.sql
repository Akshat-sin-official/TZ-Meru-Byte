-- =====================================================================
-- CIT CampusOS — Production Test Dataset & Schema
-- Complete MySQL 8.0 DDL & Seed Data for AI Workflows & Campus Scheduling
-- Compatible with Node.js API Gateway, Prisma ORM, and n8n Workflows
-- =====================================================================

CREATE DATABASE IF NOT EXISTS `cit_campus_os`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `cit_campus_os`;

SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------------------------
-- 1. Table: User
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `User`;
CREATE TABLE `User` (
  `id` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `passwordHash` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `role` ENUM('admin', 'department_coordinator', 'faculty', 'club') NOT NULL,
  `department` VARCHAR(191) NULL,
  `facultyId` VARCHAR(191) NULL,
  `clubName` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `User_email_key` (`email`),
  UNIQUE KEY `User_facultyId_key` (`facultyId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 2. Table: DatasetVersion
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `DatasetVersion`;
CREATE TABLE `DatasetVersion` (
  `id` VARCHAR(191) NOT NULL,
  `datasetId` VARCHAR(191) NOT NULL,
  `contentHash` VARCHAR(191) NOT NULL,
  `isCurrent` BOOLEAN NOT NULL DEFAULT FALSE,
  `rawJson` JSON NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `DatasetVersion_contentHash_key` (`contentHash`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 3. Table: Room
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `Room`;
CREATE TABLE `Room` (
  `id` VARCHAR(191) NOT NULL,
  `datasetVersionId` VARCHAR(191) NOT NULL,
  `externalId` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `building` VARCHAR(191) NOT NULL,
  `type` VARCHAR(191) NOT NULL,
  `capacity` INT NOT NULL,
  `features` JSON NOT NULL,
  `accessible` BOOLEAN NOT NULL,
  `allowedUses` JSON NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Room_datasetVersionId_externalId_key` (`datasetVersionId`, `externalId`),
  CONSTRAINT `Room_datasetVersionId_fkey` FOREIGN KEY (`datasetVersionId`) REFERENCES `DatasetVersion` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 4. Table: RoomUnavailability
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `RoomUnavailability`;
CREATE TABLE `RoomUnavailability` (
  `id` VARCHAR(191) NOT NULL,
  `roomId` VARCHAR(191) NOT NULL,
  `day` VARCHAR(191) NOT NULL,
  `periods` JSON NOT NULL,
  `reason` VARCHAR(191) NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `RoomUnavailability_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `Room` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 5. Table: Faculty
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `Faculty`;
CREATE TABLE `Faculty` (
  `id` VARCHAR(191) NOT NULL,
  `datasetVersionId` VARCHAR(191) NOT NULL,
  `externalId` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `department` VARCHAR(191) NOT NULL,
  `maxHoursPerDay` INT NOT NULL DEFAULT 4,
  `needsAccessible` BOOLEAN NOT NULL DEFAULT FALSE,
  `unavailable` JSON NOT NULL,
  `preferences` JSON NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Faculty_datasetVersionId_externalId_key` (`datasetVersionId`, `externalId`),
  CONSTRAINT `Faculty_datasetVersionId_fkey` FOREIGN KEY (`datasetVersionId`) REFERENCES `DatasetVersion` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 6. Table: StudentGroup
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `StudentGroup`;
CREATE TABLE `StudentGroup` (
  `id` VARCHAR(191) NOT NULL,
  `datasetVersionId` VARCHAR(191) NOT NULL,
  `externalId` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `year` INT NOT NULL,
  `department` VARCHAR(191) NOT NULL,
  `size` INT NOT NULL,
  `needsAccessible` BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (`id`),
  UNIQUE KEY `StudentGroup_datasetVersionId_externalId_key` (`datasetVersionId`, `externalId`),
  CONSTRAINT `StudentGroup_datasetVersionId_fkey` FOREIGN KEY (`datasetVersionId`) REFERENCES `DatasetVersion` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 7. Table: Course
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `Course`;
CREATE TABLE `Course` (
  `id` VARCHAR(191) NOT NULL,
  `datasetVersionId` VARCHAR(191) NOT NULL,
  `externalId` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NULL,
  `department` VARCHAR(191) NOT NULL,
  `year` INT NOT NULL,
  `lectureHours` INT NOT NULL,
  `tutorialHours` INT NOT NULL,
  `labBlocks` INT NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Course_datasetVersionId_externalId_key` (`datasetVersionId`, `externalId`),
  CONSTRAINT `Course_datasetVersionId_fkey` FOREIGN KEY (`datasetVersionId`) REFERENCES `DatasetVersion` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 8. Table: Session
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `Session`;
CREATE TABLE `Session` (
  `id` VARCHAR(191) NOT NULL,
  `datasetVersionId` VARCHAR(191) NOT NULL,
  `externalId` VARCHAR(191) NOT NULL,
  `courseId` VARCHAR(191) NOT NULL,
  `kind` VARCHAR(191) NOT NULL,
  `groups` JSON NOT NULL,
  `facultyId` VARCHAR(191) NOT NULL,
  `size` INT NOT NULL,
  `duration` INT NOT NULL,
  `roomTypes` JSON NOT NULL,
  `needsAccessible` BOOLEAN NOT NULL DEFAULT FALSE,
  `basketSlot` VARCHAR(191) NULL,
  `fixedSlot` JSON NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Session_datasetVersionId_externalId_key` (`datasetVersionId`, `externalId`),
  CONSTRAINT `Session_datasetVersionId_fkey` FOREIGN KEY (`datasetVersionId`) REFERENCES `DatasetVersion` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 9. Table: ScheduleVersion
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `ScheduleVersion`;
CREATE TABLE `ScheduleVersion` (
  `id` VARCHAR(191) NOT NULL,
  `datasetVersionId` VARCHAR(191) NOT NULL,
  `versionNumber` INT NOT NULL,
  `status` ENUM('draft', 'pending_approval', 'active', 'superseded', 'rejected') NOT NULL DEFAULT 'pending_approval',
  `softScoreTotal` INT NOT NULL DEFAULT 0,
  `softScoreBreakdown` JSON NULL,
  `hardViolations` INT NOT NULL DEFAULT 0,
  `createdById` VARCHAR(191) NULL,
  `approvedById` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `activatedAt` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  INDEX `ScheduleVersion_datasetVersionId_status_idx` (`datasetVersionId`, `status`),
  CONSTRAINT `ScheduleVersion_datasetVersionId_fkey` FOREIGN KEY (`datasetVersionId`) REFERENCES `DatasetVersion` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 10. Table: ScheduleAssignment
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `ScheduleAssignment`;
CREATE TABLE `ScheduleAssignment` (
  `id` VARCHAR(191) NOT NULL,
  `scheduleVersionId` VARCHAR(191) NOT NULL,
  `sessionExternalId` VARCHAR(191) NOT NULL,
  `day` VARCHAR(191) NOT NULL,
  `startPeriod` INT NOT NULL,
  `roomExternalId` VARCHAR(191) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ScheduleAssignment_scheduleVersionId_sessionExternalId_key` (`scheduleVersionId`, `sessionExternalId`),
  CONSTRAINT `ScheduleAssignment_scheduleVersionId_fkey` FOREIGN KEY (`scheduleVersionId`) REFERENCES `ScheduleVersion` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 11. Table: BookingRequest
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `BookingRequest`;
CREATE TABLE `BookingRequest` (
  `id` VARCHAR(191) NOT NULL,
  `datasetVersionId` VARCHAR(191) NOT NULL,
  `externalId` VARCHAR(191) NOT NULL,
  `submittedAt` DATETIME(3) NOT NULL,
  `requester` VARCHAR(191) NOT NULL,
  `role` ENUM('admin', 'department_coordinator', 'faculty', 'club') NOT NULL,
  `requestedCategory` VARCHAR(191) NOT NULL,
  `effectiveCategory` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `attendance` INT NOT NULL,
  `durationPeriods` INT NOT NULL,
  `windows` JSON NOT NULL,
  `roomTypes` JSON NOT NULL,
  `needs` JSON NOT NULL,
  `requestedRoom` VARCHAR(191) NULL,
  `mandatoryForGroups` JSON NOT NULL,
  `seriesId` VARCHAR(191) NULL,
  `rawText` TEXT NULL,
  `isCancelled` BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (`id`),
  UNIQUE KEY `BookingRequest_datasetVersionId_externalId_key` (`datasetVersionId`, `externalId`),
  CONSTRAINT `BookingRequest_datasetVersionId_fkey` FOREIGN KEY (`datasetVersionId`) REFERENCES `DatasetVersion` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 12. Table: BookingDecision
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `BookingDecision`;
CREATE TABLE `BookingDecision` (
  `id` VARCHAR(191) NOT NULL,
  `scheduleVersionId` VARCHAR(191) NOT NULL,
  `requestId` VARCHAR(191) NOT NULL,
  `status` ENUM('approved', 'alternative_offered', 'rejected') NOT NULL,
  `day` VARCHAR(191) NULL,
  `startPeriod` INT NULL,
  `endPeriod` INT NULL,
  `roomExternalId` VARCHAR(191) NULL,
  `reason` TEXT NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `BookingDecision_scheduleVersionId_requestId_key` (`scheduleVersionId`, `requestId`),
  CONSTRAINT `BookingDecision_scheduleVersionId_fkey` FOREIGN KEY (`scheduleVersionId`) REFERENCES `ScheduleVersion` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `BookingDecision_requestId_fkey` FOREIGN KEY (`requestId`) REFERENCES `BookingRequest` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 13. Table: AiConversation (Multi-Turn Workflow Memory)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `AiConversation`;
CREATE TABLE `AiConversation` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `workflowType` VARCHAR(191) NOT NULL,
  `currentDraft` JSON NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `AiConversation_userId_workflowType_idx` (`userId`, `workflowType`),
  CONSTRAINT `AiConversation_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 14. Table: AiMessage
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `AiMessage`;
CREATE TABLE `AiMessage` (
  `id` VARCHAR(191) NOT NULL,
  `conversationId` VARCHAR(191) NOT NULL,
  `sender` VARCHAR(191) NOT NULL,
  `message` TEXT NOT NULL,
  `rawAiResponse` JSON NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `AiMessage_conversationId_idx` (`conversationId`),
  CONSTRAINT `AiMessage_conversationId_fkey` FOREIGN KEY (`conversationId`) REFERENCES `AiConversation` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;


-- =====================================================================
-- SEED DATA INSERTION
-- =====================================================================

-- 1. Ingest Dataset Version (CIT Public Benchmark)
INSERT INTO `DatasetVersion` (`id`, `datasetId`, `contentHash`, `isCurrent`, `rawJson`, `createdAt`)
VALUES (
  'ds-cit-benchmark-2027',
  'cit-public-benchmark-v1',
  'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  TRUE,
  JSON_OBJECT(
    'priority_order', JSON_ARRAY('exam', 'regular_class', 'institute_event', 'guest_lecture', 'department_event', 'club_event'),
    'role_category_cap', JSON_OBJECT(
      'admin', 'institute_event',
      'department_coordinator', 'department_event',
      'faculty', 'guest_lecture',
      'club', 'club_event'
    )
  ),
  NOW()
);

-- 2. Seed Standard Demo Users (Bcrypt Passwords pre-calculated with 10 salt rounds)
-- Passwords:
-- admin@cit.edu        -> CitAdmin2027!
-- coord.cse@cit.edu    -> CitCoord2027!
-- faculty.f19@cit.edu  -> CitFaculty2027!
-- dramatics@cit.edu    -> CitClub2027!
INSERT INTO `User` (`id`, `email`, `passwordHash`, `name`, `role`, `department`, `facultyId`, `clubName`, `createdAt`)
VALUES
  ('usr-admin-01', 'admin@cit.edu', '$2b$10$mLE5aIMCnqYBbd468nDf4Olrht1bjg4IGo85BhKoILOUFFZlKEfK2', 'Prof. Dean Office (Admin)', 'admin', 'ACADEMIC_AFFAIRS', 'F37', NULL, NOW()),
  ('usr-coord-01', 'coord.cse@cit.edu', '$2b$10$jIIPxt9lBQidsPUOfKLIqeTrlGYnlLERBJcu7rqkCjiK1tmtXtxOO', 'Dr. CSE Coordinator', 'department_coordinator', 'CSE', 'F01', NULL, NOW()),
  ('usr-fac-19', 'faculty.f19@cit.edu', '$2b$10$jyetY6QCizZ8cJZevqXM1OWPlfOQqRckhY0YfsHfjbI6o7MPRZxHK', 'Dr. S. Rath (Faculty F19)', 'faculty', 'MATH', 'F19', NULL, NOW()),
  ('usr-club-01', 'dramatics@cit.edu', '$2b$10$Y.r/3VyHMxnyZ9Kut2fc0e8jdvMYSj4kBU9deQbeGZKxNQ9xz7YAC', 'Dramatics Society', 'club', NULL, NULL, 'Dramatics Society', NOW());

-- 3. Seed Campus Venues (Auditorium, Seminar Halls with Accessibility constraints, Labs, Lecture Halls)
INSERT INTO `Room` (`id`, `datasetVersionId`, `externalId`, `name`, `building`, `type`, `capacity`, `features`, `accessible`, `allowedUses`)
VALUES
  ('rm-aud', 'ds-cit-benchmark-2027', 'AUD', 'Campus Auditorium', 'Main Campus', 'auditorium', 500, JSON_ARRAY('projector', 'pa_system', 'stage'), TRUE, JSON_ARRAY('event', 'exam', 'lecture')),
  ('rm-sh1', 'ds-cit-benchmark-2027', 'SH-1', 'Seminar Hall 1', 'Main Block (Ground Floor)', 'seminar_hall', 80, JSON_ARRAY('projector', 'pa_system', 'accessible'), TRUE, JSON_ARRAY('event', 'lecture', 'tutorial')),
  ('rm-sh2', 'ds-cit-benchmark-2027', 'SH-2', 'Seminar Hall 2', 'Science Block (2nd Floor, No Elevator)', 'seminar_hall', 80, JSON_ARRAY('projector', 'pa_system'), FALSE, JSON_ARRAY('event', 'lecture', 'tutorial')),
  ('rm-l1', 'ds-cit-benchmark-2027', 'L1', 'Lecture Hall L1', 'Academic Block A', 'lecture_hall', 120, JSON_ARRAY('projector', 'ac'), TRUE, JSON_ARRAY('lecture', 'exam', 'event')),
  ('rm-l2', 'ds-cit-benchmark-2027', 'L2', 'Lecture Hall L2', 'Academic Block A', 'lecture_hall', 120, JSON_ARRAY('projector', 'ac'), TRUE, JSON_ARRAY('lecture', 'exam', 'event')),
  ('rm-lab-a', 'ds-cit-benchmark-2027', 'LAB-A', 'Computing Lab A', 'Computer Centre', 'lab_cs', 60, JSON_ARRAY('computers', 'projector', 'power_benches'), TRUE, JSON_ARRAY('lab', 'event')),
  ('rm-cr101', 'ds-cit-benchmark-2027', 'CR-101', 'Classroom 101', 'North Wing', 'classroom', 45, JSON_ARRAY('projector'), TRUE, JSON_ARRAY('lecture', 'tutorial'));

-- 4. Seed Faculty Members (Including F07 for WF02 schedule change testing)
INSERT INTO `Faculty` (`id`, `datasetVersionId`, `externalId`, `name`, `department`, `maxHoursPerDay`, `needsAccessible`, `unavailable`, `preferences`)
VALUES
  ('fac-f07', 'ds-cit-benchmark-2027', 'F07', 'Prof. A. K. Sharma (F07)', 'CSE', 4, FALSE, JSON_ARRAY(), JSON_ARRAY('morning')),
  ('fac-f19', 'ds-cit-benchmark-2027', 'F19', 'Dr. S. Rath (F19)', 'MATH', 4, FALSE, JSON_ARRAY(), JSON_ARRAY('afternoon')),
  ('fac-f01', 'ds-cit-benchmark-2027', 'F01', 'Dr. CSE Coordinator (F01)', 'CSE', 4, FALSE, JSON_ARRAY(), JSON_ARRAY());

-- 5. Seed Student Groups & Courses
INSERT INTO `StudentGroup` (`id`, `datasetVersionId`, `externalId`, `name`, `year`, `department`, `size`, `needsAccessible`)
VALUES
  ('grp-cse-3a', 'ds-cit-benchmark-2027', 'CSE-3A', 'B.Tech CSE 3rd Year Sec A', 3, 'CSE', 60, FALSE),
  ('grp-cse-3b', 'ds-cit-benchmark-2027', 'CSE-3B', 'B.Tech CSE 3rd Year Sec B', 3, 'CSE', 60, TRUE);

INSERT INTO `Course` (`id`, `datasetVersionId`, `externalId`, `name`, `department`, `year`, `lectureHours`, `tutorialHours`, `labBlocks`)
VALUES
  ('crs-cs301', 'ds-cit-benchmark-2027', 'CS301', 'Database Management Systems', 'CSE', 3, 3, 1, 1),
  ('crs-cs302', 'ds-cit-benchmark-2027', 'CS302', 'Operating Systems', 'CSE', 3, 3, 1, 1);

-- 6. Seed Academic Sessions for F07
INSERT INTO `Session` (`id`, `datasetVersionId`, `externalId`, `courseId`, `kind`, `groups`, `facultyId`, `size`, `duration`, `roomTypes`, `needsAccessible`, `basketSlot`, `fixedSlot`)
VALUES
  ('sess-cs301-l1', 'ds-cit-benchmark-2027', 'CS301-L1', 'crs-cs301', 'lecture', JSON_ARRAY('CSE-3A'), 'F07', 60, 1, JSON_ARRAY('lecture_hall', 'classroom'), FALSE, NULL, NULL),
  ('sess-cs302-l1', 'ds-cit-benchmark-2027', 'CS302-L1', 'crs-cs302', 'lecture', JSON_ARRAY('CSE-3B'), 'F07', 60, 1, JSON_ARRAY('lecture_hall', 'classroom'), FALSE, NULL, NULL);

-- 7. Seed Active Schedule Version (Version 1) & Assignments
INSERT INTO `ScheduleVersion` (`id`, `datasetVersionId`, `versionNumber`, `status`, `softScoreTotal`, `hardViolations`, `createdById`, `approvedById`, `createdAt`, `activatedAt`)
VALUES (
  'sched-active-v1',
  'ds-cit-benchmark-2027',
  1,
  'active',
  315,
  0,
  'usr-admin-01',
  'usr-admin-01',
  NOW(),
  NOW()
);

-- Active Monday Schedule Assignments for F07 (Used to test WF02 Disruption simulation)
INSERT INTO `ScheduleAssignment` (`id`, `scheduleVersionId`, `sessionExternalId`, `day`, `startPeriod`, `roomExternalId`)
VALUES
  ('asgn-01', 'sched-active-v1', 'CS301-L1', 'MON', 3, 'L1'),  -- Period 3 = 10:00 AM
  ('asgn-02', 'sched-active-v1', 'CS302-L1', 'MON', 4, 'L2');  -- Period 4 = 11:00 AM

-- 8. Seed Authoritative Booking Requests (Used for WF03 Decision Explainer Testing)
INSERT INTO `BookingRequest` (`id`, `datasetVersionId`, `externalId`, `submittedAt`, `requester`, `role`, `requestedCategory`, `effectiveCategory`, `title`, `attendance`, `durationPeriods`, `windows`, `roomTypes`, `needs`, `requestedRoom`, `mandatoryForGroups`, `seriesId`, `rawText`, `isCancelled`)
VALUES
  -- BR-09: Request exceeds maximum campus venue capacity (500 seats)
  ('brq-09', 'ds-cit-benchmark-2027', 'BR-09', '2026-10-15 10:00:00', 'Farewell Committee', 'club', 'club_event', 'club_event', 'Annual Cultural Farewell Dinner', 600, 3, JSON_ARRAY(JSON_OBJECT('day', 'MON', 'from_period', 10, 'to_period', 12)), JSON_ARRAY('auditorium'), JSON_ARRAY('projector', 'pa_system', 'stage'), 'AUD', JSON_ARRAY(), NULL, 'Need auditorium for 600 people farewell event', FALSE),

  -- BR-07: Requested SH-2 which is on upper floor without elevator, but needs accessibility
  ('brq-07', 'ds-cit-benchmark-2027', 'BR-07', '2026-10-15 11:00:00', 'Dramatics Society', 'club', 'club_event', 'club_event', 'Inter-College Drama Rehearsal', 75, 2, JSON_ARRAY(JSON_OBJECT('day', 'FRI', 'from_period', 10, 'to_period', 11)), JSON_ARRAY('seminar_hall'), JSON_ARRAY('accessible', 'pa_system'), 'SH-2', JSON_ARRAY(), NULL, 'Wheelchair accessible seminar hall required for Friday 6 to 8 pm', FALSE),

  -- BR-01: Approved booking
  ('brq-01', 'ds-cit-benchmark-2027', 'BR-01', '2026-10-14 09:00:00', 'CSE Department', 'department_coordinator', 'department_event', 'department_event', 'AI & Machine Learning Symposium Keynote', 75, 2, JSON_ARRAY(JSON_OBJECT('day', 'FRI', 'from_period', 10, 'to_period', 11)), JSON_ARRAY('seminar_hall'), JSON_ARRAY('projector', 'pa_system'), 'SH-1', JSON_ARRAY(), NULL, 'Keynote session for AI symposium in SH-1', FALSE);

-- 9. Seed Authoritative Booking Decisions in MySQL (Tested by WF03)
INSERT INTO `BookingDecision` (`id`, `scheduleVersionId`, `requestId`, `status`, `day`, `startPeriod`, `endPeriod`, `roomExternalId`, `reason`)
VALUES
  -- BR-09 Decision: Rejected because 600 exceeds campus max capacity (500)
  ('dec-br-09', 'sched-active-v1', 'brq-09', 'rejected', NULL, NULL, NULL, NULL, 'CAPACITY_EXCEEDED: Requested attendance (600) exceeds maximum available campus venue capacity (Auditorium max is 500 seats).'),

  -- BR-07 Decision: Alternative offered in SH-1 (Wheelchair accessible ground floor)
  ('dec-br-07', 'sched-active-v1', 'brq-07', 'alternative_offered', 'FRI', 10, 11, 'SH-1', 'VENUE_OCCUPIED_BY_HIGHER_PRIORITY: Preferred venue SH-2 is on upper floor without elevator access. Ground-floor wheelchair accessible venue SH-1 has been allocated.'),

  -- BR-01 Decision: Approved in SH-1
  ('dec-br-01', 'sched-active-v1', 'brq-01', 'approved', 'FRI', 10, 11, 'SH-1', 'ALLOCATED_PRIMARY: Priority category department_event and room capacity fully satisfied without timetable collisions.');

-- 10. Seed Demo Conversation Memory (For immediate multi-turn testing in Postman)
INSERT INTO `AiConversation` (`id`, `userId`, `workflowType`, `currentDraft`, `createdAt`, `updatedAt`)
VALUES (
  'conv-demo-multiturn-01',
  'usr-coord-01',
  'booking_intake',
  JSON_OBJECT(
    'intent', 'create_booking',
    'event_type', 'department_event',
    'venue', 'SEMINAR HALL',
    'date', '2026-11-05',
    'start_time', '18:00',
    'end_time', '20:00',
    'purpose', 'Guest Lecture on Distributed Systems',
    'expected_attendance', 75,
    'accessibility_required', FALSE,
    'mandatory_groups', JSON_ARRAY('CSE-3A'),
    'requires_confirmation', FALSE
  ),
  NOW(),
  NOW()
);

INSERT INTO `AiMessage` (`id`, `conversationId`, `sender`, `message`, `rawAiResponse`, `createdAt`)
VALUES
  ('msg-01', 'conv-demo-multiturn-01', 'user', 'Need seminar hall on 5th Nov from 6 to 8 PM for 75 students for guest lecture', NULL, NOW()),
  ('msg-02', 'conv-demo-multiturn-01', 'assistant', 'Parsed request: Seminar Hall on 2026-11-05 from 18:00 to 20:00 for 75 attendees. Do you require any equipment or wheelchair accessibility?', NULL, NOW());

-- =====================================================================
-- Verification Queries (Optional quick checks after execution)
-- =====================================================================
-- SELECT id, email, role FROM User;
-- SELECT externalId, name, capacity, accessible FROM Room;
-- SELECT r.externalId, d.status, d.roomExternalId, d.reason FROM BookingRequest r JOIN BookingDecision d ON r.id = d.requestId;
-- SELECT id, userId, workflowType, JSON_PRETTY(currentDraft) FROM AiConversation;

