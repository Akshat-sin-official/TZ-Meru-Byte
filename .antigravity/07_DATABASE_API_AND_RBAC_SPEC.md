# 07 — Database Schema, API Contracts & RBAC Specification

> **Status:** Canonical Specification  
> **ORM:** Prisma with MySQL 8.0  
> **Auth:** JWT with Argon2id hashing & Server-Side 4-Role RBAC

---

## 1. Definitive Prisma Schema (`prisma/schema.prisma`)

```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  admin
  department_coordinator
  faculty
  club
}

enum ScheduleStatus {
  draft
  pending_approval
  active
  superseded
  rejected
}

enum BookingDecisionStatus {
  approved
  alternative_offered
  rejected
}

enum JobStatus {
  queued
  running
  succeeded
  failed
  timeout
}

// ── Authentication & RBAC ───────────────────────────────────────────
model User {
  id           String   @id @default(uuid())
  email        String   @unique
  passwordHash String
  name         String
  role         Role
  department   String?
  facultyId    String?  @unique
  clubName     String?
  createdAt    DateTime @default(now())

  auditLogs    AuditLog[]
  notifications Notification[]
}

// ── Dataset Management (Immutable Versions) ──────────────────────────
model DatasetVersion {
  id          String   @id @default(uuid())
  datasetId   String   // e.g. "cit-public-v1"
  contentHash String   @unique
  isCurrent   Boolean  @default(false)
  rawJson     Json
  createdAt   DateTime @default(now())

  rooms             Room[]
  faculty           Faculty[]
  studentGroups     StudentGroup[]
  courses           Course[]
  sessions          Session[]
  bookingRequests   BookingRequest[]
  midsemExams       MidsemExam[]
  schedules         ScheduleVersion[]
  disruptionJobs    DisruptionJob[]
}

// ── Campus Entities ──────────────────────────────────────────────────
model Room {
  id               String   @id @default(uuid())
  datasetVersionId String
  externalId       String   // e.g. "AUD", "LH-1"
  name             String
  building         String
  type             String
  capacity         Int
  features         Json     // ["projector", "pa_system", ...]
  accessible       Boolean
  allowedUses      Json     // ["lecture", "tutorial", "lab", "exam", "event"]

  datasetVersion   DatasetVersion @relation(fields: [datasetVersionId], references: [id], onDelete: Cascade)
  unavailability   RoomUnavailability[]

  @@unique([datasetVersionId, externalId])
}

model RoomUnavailability {
  id       String @id @default(uuid())
  roomId   String
  day      String
  periods  Json   // [1, 2, 3]
  reason   String?

  room     Room   @relation(fields: [roomId], references: [id], onDelete: Cascade)
}

model Faculty {
  id               String   @id @default(uuid())
  datasetVersionId String
  externalId       String   // e.g. "F01"
  name             String
  department       String
  maxHoursPerDay   Int      @default(4)
  needsAccessible  Boolean  @default(false)
  unavailable      Json     // [{"day": "WED", "periods": [6,7,8,9], "reason": "..."}]
  preferences      Json     // [{"type": "avoid", "days": ["MON"], "periods": [1]}]

  datasetVersion   DatasetVersion @relation(fields: [datasetVersionId], references: [id], onDelete: Cascade)

  @@unique([datasetVersionId, externalId])
}

model StudentGroup {
  id               String   @id @default(uuid())
  datasetVersionId String
  externalId       String   // e.g. "CSE-2", "Y1-A"
  name             String
  year             Int
  department       String
  size             Int
  needsAccessible  Boolean  @default(false)

  datasetVersion   DatasetVersion @relation(fields: [datasetVersionId], references: [id], onDelete: Cascade)

  @@unique([datasetVersionId, externalId])
}

model Course {
  id               String   @id @default(uuid())
  datasetVersionId String
  externalId       String   // e.g. "CS201"
  name             String
  department       String
  year             Int
  lectureHours     Int
  tutorialHours    Int
  labBlocks        Int

  datasetVersion   DatasetVersion @relation(fields: [datasetVersionId], references: [id], onDelete: Cascade)

  @@unique([datasetVersionId, externalId])
}

model Session {
  id               String   @id @default(uuid())
  datasetVersionId String
  externalId       String   // e.g. "CS201-L1"
  courseId         String
  kind             String   // lecture, tutorial, lab
  groups           Json     // ["CSE-2"]
  facultyId        String
  size             Int
  duration         Int
  roomTypes        Json     // ["classroom", "lecture_hall"]
  needsAccessible  Boolean  @default(false)
  basketSlot       String?  // e.g. "OEB-1"
  fixedSlot        Json?    // {"day": "THU", "start_period": 6}

  datasetVersion   DatasetVersion @relation(fields: [datasetVersionId], references: [id], onDelete: Cascade)

  @@unique([datasetVersionId, externalId])
}

// ── Schedule Versions & Commitments ──────────────────────────────────
model ScheduleVersion {
  id               String         @id @default(uuid())
  datasetVersionId String
  versionNumber    Int
  status           ScheduleStatus @default(pending_approval)
  softScoreTotal   Int            @default(0)
  softScoreBreakdown Json?
  hardViolations   Int            @default(0)
  createdById      String?
  approvedById     String?
  createdAt        DateTime       @default(now())
  activatedAt      DateTime?

  datasetVersion   DatasetVersion @relation(fields: [datasetVersionId], references: [id], onDelete: Cascade)
  assignments      ScheduleAssignment[]
  bookingDecisions BookingDecision[]
  sessionOverrides SessionOverride[]
  examAllocations  ExamAllocation[]

  @@index([datasetVersionId, status])
}

model ScheduleAssignment {
  id                String   @id @default(uuid())
  scheduleVersionId String
  sessionExternalId String
  day               String   // MON, TUE, WED, THU, FRI
  startPeriod       Int      // 1 to 9
  roomExternalId    String

  scheduleVersion   ScheduleVersion @relation(fields: [scheduleVersionId], references: [id], onDelete: Cascade)

  @@unique([scheduleVersionId, sessionExternalId])
}

// ── Midsem Exams ────────────────────────────────────────────────────
model MidsemExam {
  id               String   @id @default(uuid())
  datasetVersionId String
  externalId       String   // e.g. "EX-CS201"
  courseIds        Json     // ["CS201"]
  groups           Json     // ["CSE-2"]
  size             Int
  durationHours    Int

  datasetVersion   DatasetVersion @relation(fields: [datasetVersionId], references: [id], onDelete: Cascade)

  @@unique([datasetVersionId, externalId])
}

model ExamAllocation {
  id                String   @id @default(uuid())
  scheduleVersionId String
  examExternalId    String
  day               String   // MON, TUE, WED, THU, FRI, SAT
  session           String   // AM, PM
  rooms             Json     // ["AUD", "LH-1"]

  scheduleVersion   ScheduleVersion @relation(fields: [scheduleVersionId], references: [id], onDelete: Cascade)

  @@unique([scheduleVersionId, examExternalId])
}

// ── Spectra Week Bookings ───────────────────────────────────────────
model BookingRequest {
  id                String   @id @default(uuid())
  datasetVersionId  String
  externalId        String   // e.g. "BR-01"
  submittedAt       DateTime
  requester         String
  role              Role
  requestedCategory String
  effectiveCategory String
  title             String
  attendance        Int
  durationPeriods   Int
  windows           Json
  roomTypes         Json
  needs             Json
  requestedRoom     String?
  mandatoryForGroups Json
  seriesId          String?
  rawText           String?  @db.Text
  isCancelled       Boolean  @default(false)

  datasetVersion    DatasetVersion @relation(fields: [datasetVersionId], references: [id], onDelete: Cascade)
  decisions         BookingDecision[]

  @@unique([datasetVersionId, externalId])
}

model BookingDecision {
  id                String                @id @default(uuid())
  scheduleVersionId String
  requestId         String
  status            BookingDecisionStatus
  day               String?
  startPeriod       Int?
  endPeriod         Int?
  roomExternalId    String?
  reason            String                @db.Text

  scheduleVersion   ScheduleVersion       @relation(fields: [scheduleVersionId], references: [id], onDelete: Cascade)
  request           BookingRequest        @relation(fields: [requestId], references: [id], onDelete: Cascade)

  @@unique([scheduleVersionId, requestId])
}

model SessionOverride {
  id                String   @id @default(uuid())
  scheduleVersionId String
  sessionExternalId String
  day               String
  startPeriod       Int
  roomExternalId    String
  displacedByReqId  String

  scheduleVersion   ScheduleVersion @relation(fields: [scheduleVersionId], references: [id], onDelete: Cascade)

  @@unique([scheduleVersionId, sessionExternalId])
}

// ── Disruption Jobs & Audit ─────────────────────────────────────────
model DisruptionJob {
  id               String    @id @default(uuid())
  datasetVersionId String
  baseScheduleId   String
  status           JobStatus @default(queued)
  changesJson      Json
  resultProposalId String?
  sessionsMoved    Int?
  timeChanged      Int?
  roomOnlyChanged  Int?
  createdAt        DateTime  @default(now())

  datasetVersion   DatasetVersion @relation(fields: [datasetVersionId], references: [id], onDelete: Cascade)
}

model AuditLog {
  id         String   @id @default(uuid())
  userId     String?
  action     String   // e.g. "APPROVE_SCHEDULE", "DISRUPT_REPAIR", "ADMIN_RESET"
  entityType String
  entityId   String?
  details    Json?
  timestamp  DateTime @default(now())

  user       User?    @relation(fields: [userId], references: [id], onDelete: SetNull)
}

model Notification {
  id        String   @id @default(uuid())
  userId    String
  title     String
  message   String   @db.Text
  read      Boolean  @default(false)
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

---

## 2. Definitive REST API Endpoints

### 2.1 Authentication & Profile
- `POST /api/auth/login` → `{ email, password }` $\to$ Returns JWT cookie/bearer token and user role.
- `GET /api/auth/me` $\to$ Returns active session user context and permissions.
- `POST /api/auth/logout` $\to$ Invalidates token.

### 2.2 Dataset Management & Demo Reset
- `GET /api/datasets/current` $\to$ Summary of active dataset (`cit-public-v1`).
- `POST /api/datasets/import` $\to$ Accepts JSON/CSV dataset upload; runs pre-flight schema check; stores as new `DatasetVersion`. (Admin only).
- `POST /api/datasets/reset-demo` $\to$ **Mandatory Demo Reset:** Flushes transient data; reloads pristine `cit_public.json`; seeds the 4 standard demo accounts; verifies `schedule.json` exists. Completes in $< 10$ seconds.

### 2.3 Weekly Timetable Operations
- `GET /api/schedules/active` $\to$ Returns current active timetable assignments, soft score breakdown, and room utilization.
- `POST /api/schedules/generate` $\to$ Dispatches background CP-SAT solver job; returns `{ "job_id": "...", "status": "queued" }`. (Admin only).
- `GET /api/schedules/jobs/:job_id` $\to$ Polling endpoint returning job status, elapsed time, and proposed schedule ID.
- `POST /api/schedules/proposals/:id/approve` $\to$ Server checks optimistic concurrency lock (`base_version_id`), enforces no-self-approval, and activates proposal.
- `POST /api/schedules/validate-move` $\to$ **Drag & Drop Helper:** Accepts `{ session_id, target_day, target_period, target_room }`; runs Canonical Validator; returns `{ valid: boolean, violations: [], soft_delta: number }`.

### 2.4 Midsem Examination Operations
- `GET /api/exams/active` $\to$ Returns active midsem exam schedule (Day, Session AM/PM, Rooms, half-capacity count).
- `POST /api/exams/generate` $\to$ Triggers CP-SAT exam solver.
- `POST /api/exams/proposals/:id/approve` $\to$ Publishes exam schedule.

### 2.5 Spectra Week Bookings & AI Copilot
- `GET /api/bookings` $\to$ Lists all 25 requests with effective category, decision, and room assignment.
- `POST /api/bookings/requests` $\to$ Submit a new booking request.
- `POST /api/assistant/parse-booking` $\to$ AI NLU endpoint parsing plain-language/Hinglish text to structured extraction JSON schema with temporal slots P1–P13.
- `POST /api/assistant/explain-decision` $\to$ Explains booking rejection or session override based on deterministic reason codes.

### 2.6 Disruption & Rescheduling Engine
- `POST /api/disruptions/submit` $\to$ Uploads a disruption file (e.g. `sample_disruption.json`); triggers 2-stage CP-SAT repair.
- `GET /api/disruptions/jobs/:id` $\to$ Status polling.
- `GET /api/disruptions/proposals/:id/diff` $\to$ Returns full session-by-session diff, sessions moved, and stability score.
- `POST /api/disruptions/proposals/:id/approve` $\to$ Admin approves repair and activates new `ScheduleVersion`.

### 2.7 Export & Submission Pipeline
- `GET /api/exports/schedule.json` $\to$ Streams official submission JSON file generated from persisted database state.
- `GET /api/exports/schedule_after.json` $\to$ Streams disrupted schedule JSON file.
- `POST /api/exports/verify` $\to$ Executes official `validator.py` as an independent subprocess; returns verification status.

---

## 3. Four-Role RBAC Capability Matrix

| System Action | Admin | Coordinator | Faculty | Club |
|---|:---:|:---:|:---:|:---:|
| View Timetable & Room Occupancy | ✅ | ✅ | ✅ | ✅ |
| View Spectra Booking Calendar | ✅ | ✅ | ✅ | ✅ |
| Submit Club Booking Request | ❌ | ❌ | ❌ | ✅ |
| Submit Faculty Guest Lecture Booking | ❌ | ❌ | ✅ | ❌ |
| Submit Department Event Booking | ❌ | ✅ | ❌ | ❌ |
| Use AI Copilot Assistant | ✅ | ✅ | ✅ | ✅ |
| Drag & Drop Preview (Non-persistent) | ✅ | ✅ | ✅ | ❌ |
| Trigger Solver Optimization Jobs | ✅ | ❌ | ❌ | ❌ |
| Approve Timetable / Exam Proposals | ✅ | ❌ | ❌ | ❌ |
| Displace Regular Session for Spectra | ✅ | ❌ | ❌ | ❌ |
| Submit Disruption File & Trigger Repair | ✅ | ❌ | ❌ | ❌ |
| Activate Disrupted Schedule Proposal | ✅ | ❌ | ❌ | ❌ |
| Admin Demo Data Reset | ✅ | ❌ | ❌ | ❌ |
| View System Audit Logs | ✅ | ❌ | ❌ | ❌ |

---

## 4. Pre-Seeded Hackathon Demo Accounts

| Role | Email | Password | Context / Persona |
|---|---|---|---|
| **Admin** | `admin@cit.edu` | `CitAdmin2027!` | Dean / Scheduling Chair (Faculty F37) |
| **Department Coordinator** | `coord.cse@cit.edu` | `CitCoord2027!` | CSE Department Coordinator (Faculty F01) |
| **Faculty** | `faculty.f19@cit.edu` | `CitFaculty2027!` | Dr. S. Rath (Faculty F19 - Mathematics) |
| **Club Representative** | `dramatics@cit.edu` | `CitClub2027!` | Dramatics Society Lead (Spectra Week) |

