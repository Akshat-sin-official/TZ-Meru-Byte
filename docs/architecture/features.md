# CAMPORA (CIT CampusOS) — Features & Capabilities Directory
**Product Name:** CAMPORA (CIT CampusOS)  
**Engineering Team:** MERUBYTE  
**Campus:** Chilika Institute of Technology (CIT)  
**Architecture:** 3-Tier Distributed System (React + Vite, Node.js + Express + Prisma ORM, Python FastAPI + Google OR-Tools CP-SAT)

---

## Executive Summary

CAMPORA is an enterprise-grade AI-assisted campus scheduling and operations authority built for Chilika Institute of Technology's Crunch Week. The platform unites academic master timetabling, midsem examination planning, fest venue allocations, emergency disruption recovery, WhatsApp conversational bot interfaces, and context-aware LLM copilots under a single deterministic constraint framework.

---

## 1. System Architecture & Foundation

### 1.1 High-Performance Multi-Service Architecture
- **Web Client (Frontend)**: React 18 with TypeScript, Vite build toolchain, Tailwind CSS, Radix UI primitives, Lucide icons, and Sonner notifications.
- **API Gateway & Workflow Authority (Backend)**: Node.js with TypeScript and Express, handling authentication, business logic, transactions, state machines, and audit logging.
- **Database & Persistence**: MySQL database managed through Prisma ORM with type-safe schemas, foreign-key integrity, and migrations.
- **Constraint Optimization Microservice (Solver)**: Python 3.11 with FastAPI and Google OR-Tools CP-SAT, executing constraint programming for master scheduling, examinations, disruptions, and venue allocations.
- **AI / LLM Integration**: Google Gemini 2.5 Flash API for natural language understanding, Hinglish query translation, and reasoning explanations.

### 1.2 Separation of Concerns Principle
- **Deterministic Core**: Application business rules, timetable validations, priority hierarchies, and room assignments are strictly computed by deterministic CP-SAT solvers and validators.
- **Cognitive Layer**: Large Language Models interpret user intent, parse conversational inputs, and explain solver decisions without being granted unilateral state mutation powers.

### 1.3 State Management & Data Pipeline
- Official benchmark dataset integration (`cit_public.json`): 27 physical campus rooms, 40 faculty members, 14 student cohorts, 62 courses, 189 teaching sessions, 41 midsem exams, and 25 Spectra fest venue requests.
- Versioned schedule schemas (`ScheduleVersion`, `DatasetVersion`, `Assignment`, `AuditLog`, `Notification`).
- One-click database restoration to pristine baseline for evaluator demonstrations.

---

## 2. Role-Based Access Control (RBAC) & Multi-Persona System

### 2.1 Four Discrete Operational Roles
1. **Administrator (`admin@cit.edu`)**:
   - Master scheduling authority, auto-schedule execution, proposal review & approval, disruption management, WhatsApp bot configuration, and system reset.
2. **Department Coordinator (`coord.cse@cit.edu`)**:
   - Department-scoped timetable views, cohort load analysis, disruption impact monitoring, and room utilization oversight.
3. **Faculty Member (`faculty.f19@cit.edu`)**:
   - Personal teaching schedule, leave/unavailability declaration, conflict-free shift proposals, and exam invigilation duties.
4. **Club Representative (`dramatics@cit.edu`)**:
   - Fest venue booking submissions, allocation status monitoring, and room availability inspection (restricted from academic timetables).

### 2.2 Role-Aware Dashboards & UI Gating
- Dynamic routing via `RoleDashboardRouter` presenting persona-tailored metrics, alerts, and operational widgets.
- Strict UI access gating: Administrative functions (Auto-Schedule, WhatsApp Gateway, System Reset, Proposal Approvals) are concealed from non-admin accounts.
- Data filtering: Faculty accounts view only sessions they teach; Coordinators view only departmental cohorts; Club Reps are scoped strictly to event bookings.
- Instant Demo Role Switcher: One-click persona switching located in the bottom sidebar and collapsed avatar popover.

---

## 3. Academic Timetable & CP-SAT Constraint Scheduling

### 3.1 Hard Constraint Guarantee (0 Violations)
- **H1 (Room Exclusivity)**: No two sessions share the same room at the same time on the same day.
- **H2 (Faculty Exclusivity)**: No instructor is scheduled in multiple rooms simultaneously.
- **H3 (Cohort Exclusivity)**: No student cohort has overlapping teaching sessions.
- **H4 (Room Capacity)**: Class enrollment never exceeds the certified capacity of the assigned room.
- **H5 (Multi-Period Contiguity)**: Multi-hour labs (up to 3 continuous periods) are scheduled contiguously without breaks or room changes.
- **H6 (Daily Student Workload)**: No cohort exceeds the maximum threshold of 6 contact hours per day.
- **H7 (Continuous Teaching Cap)**: Students and faculty are limited to a maximum of 2 consecutive hours without an intervening break.
- **H8 (Lunch Break Preservation)**: Period 4 (12:45 PM – 1:45 PM) is protected across all cohorts.
- **H9 (Departmental Room Affinity)**: Core departmental courses are assigned to designated departmental facilities.
- **H10 (Faculty Workload Limits)**: Total weekly faculty teaching hours adhere to institutional caps.

### 3.2 Timetable Visualization & Controls
- **Interactive Multi-View Grid**: Mon-Fri schedule display across 8 daily periods.
- **Multi-Dimensional Filters**: Filter timetable by Student Cohort, Faculty Member, Physical Room, Day of the Week, and Academic Calendar Date.
- **Class Type Differentiation**: Visual distinction between Lectures, Practical Labs, and Tutorials with room capacity indicators.
- **Interactive Slot Move Validator**: Real-time pre-flight validation of drag/drop slot shifts against all hard and soft constraints.
- **Batch CP-SAT Auto-Scheduler**: Solves the entire 189-session timetable in under 5 seconds with zero hard clashes.

---

## 4. Faculty Unavailability & Approval Workflow

### 4.1 Faculty Self-Service Unavailability Portal
- Self-service modal (`FacultyUnavailabilityModal`) accessible from the Faculty Timetable view.
- Faculty selects unavailable dates and period ranges with a mandatory justification.
- Live preview of affected classes and enrolled student cohorts.

### 4.2 Automated Conflict-Free Rescheduling Solver
- Specialized CP-SAT engine calculates relocation slots exclusively for disrupted classes.
- Relocations strictly maintain cohort contact hour balance, faculty gap limits, and room availability without perturbing unaffected campus sessions.
- Generates a new `ScheduleVersion` proposal flagged with `pending_approval`.

### 4.3 Administrative Approval & Separation of Duties
- Dedicated Admin Proposals Modal (`AdminProposalsModal`) accessible via the **Proposals** badge.
- Side-by-side diff comparison: Original slot vs. Proposed relocation slot.
- **Pre-Flight Re-Validation**: Automated secondary pass through the canonical validator before applying changes.
- **Separation of Duties Enforcement**: Backend prevents administrators from approving proposals they authored themselves.
- **Atomic Activation**: Supersedes former active schedule, commits new version, updates leave status to `approved`, and emits campus notifications.
- **Rejection & Rollback**: Clean rejection mechanism that discards the proposal and retains schedule stability.

---

## 5. Campus Disruption & Emergency Recovery Engine

### 5.1 Disruption Simulation & Modeling
- Preset crisis scenarios:
  1. **Faculty Sudden Sick Leave**: Unplanned medical absence requiring rapid substitute or rescheduling.
  2. **Room Facility Maintenance**: Unusable facility due to water leakage or electrical faults.
  3. **Severe Weather / Flood Lockdown**: Multiple ground-floor rooms unavailable due to heavy rain.

### 5.2 Minimal-Perturbation Recovery Algorithm
- CP-SAT Disruption Solver calculates minimal-displacement schedule adjustments.
- Retains up to 92%+ of existing session positions while resolving localized clashes.
- Visual diff interface displaying clash severity, relocated sessions, and new room allocations.
- One-click "Commit Recovery Plan" to push adjustments live into the active database.

---

## 6. Midsem Examination Scheduling Engine

### 6.1 Clash-Free Exam Timetabling
- Schedules 41 midsem course examinations across designated examination windows.
- Prevents multi-exam clashes for students enrolled in multiple concurrent courses.
- Enforces mandatory revision gaps between examinations for student cohorts.

### 6.2 Exam Hall Allocation & Invigilation
- Matches examination seat counts against certified room seating limits.
- Automated faculty invigilator assignments ensuring equitable supervisory workload.
- Dedicated Midsem Examination Schedule view with cohort-wise breakdown and PDF export.

---

## 7. Spectra 2026 Fest Venue Allocation Engine

### 7.1 Section 4 Priority Hierarchy Enforcement
- Concurrent event venue requests evaluated strictly against institutional precedence:
  $$\text{Exams} > \text{Regular Classes} > \text{Institute Events} > \text{Guest Lectures} > \text{Department Events} > \text{Club Events}$$
- Higher-priority institutional events preempt lower-priority club requests where space is constrained.

### 7.2 Strict Venue Capacity & Quota Management
- Mathematical rejection of over-capacity requests (e.g. BR-09 with 1,200 attendees against the campus maximum 500-seat Auditorium).
- Enforces category quota limits across venues to prevent club monopolization of premier facilities.
- CP-SAT Batch Booking Solver calculates optimal venue matching, outputting transparent explanations for approved and rejected applications.

---

## 8. AI Campus Copilot (Gemini 2.5 Flash)

### 8.1 Natural Language Campus Intelligence
- Slide-over AI Copilot drawer (`AICopilotDrawer`) accessible from any campus page.
- Context-aware retrieval over active timetable schedules, room bookings, and operational policies.
- Full bilingual comprehension: Handles queries in both English and Hinglish (e.g., *"Meri Wednesday ko koi class free hai?"*, *"Why was Dramatics Club booking rejected?"*).

### 8.2 Decision Transparency & Explanations
- Articulates exact mathematical reasons for solver decisions (venue capacity limits, priority preemption, timetable clashes).
- Role-aware prompt fencing: Prohibits unauthorized disclosure of administrative audit logs or coordinator-only data to students/clubs.

---

## 9. WhatsApp Bot & Gateway Integration

### 9.1 Two-Way Conversational WhatsApp Interface
- Twilio webhook compatibility for inbound and outbound campus messaging.
- In-memory conversation state machine supporting natural-language timetable queries and venue booking drafts.
- Multi-turn booking flow: User requests venue -> Bot drafts booking parameters and prompts for confirmation -> User replies "YES" / "CONFIRM" / "HAAN" to finalize.

### 9.2 Built-In Admin WhatsApp Simulator
- Interactive simulator on the Admin Dashboard (`WhatsAppBotSection`) allowing live evaluation without external webhooks.
- Multi-role simulation selector: Test bot behavior as Admin, Faculty, Coordinator, or Club Rep.
- Real-time display of incoming webhook payloads, extracted intents, and bot response payloads.

---

## 10. Real-Time Notification & Audit Engine

### 10.1 In-App Notification Center
- Header notification bell with live unread badge counter.
- Background polling syncing notifications across campus clients.
- Automated notification triggers:
  - Timetable auto-scheduled
  - Master schedule version activated
  - Manual slot move applied
  - Faculty unavailability proposal submitted / approved
  - Disruption recovery plan executed
  - Spectra fest venue allocations solved
  - Baseline demo data reset
- Filter unread items, individual mark-as-read, bulk mark-all-read, and relative timestamps (`"Just now"`, `"12m ago"`).

### 10.2 Immutable Audit Logging
- Dedicated `AuditLog` database table recording:
  - Performing User ID and Role
  - Action Category (e.g., `AUTO_SCHEDULE`, `ACTIVATE_SCHEDULE`, `DISRUPTION_RECOVERY`)
  - Target Entity Type & Entity ID
  - Comprehensive Metadata payload
- Safe user lookup (`getSafeUserId`) preventing foreign key constraint violations during demo sessions.

---

## 11. PDF Export & Document Generation

### 11.1 Pixel-Perfect Landscape PDF Reports
- Clean HTML-to-Canvas / Print rendering formatted for A4 landscape paper.
- Elimination of scrollbars, clipping, and UI artifacts (drawers, notifications, modal backdrops).
- Institutional header block: CIT Crest, Academic Term ("Autumn 2027"), Generation Timestamp, and Verification Signature.
- Timetable grids, Midsem Exam schedules, and Spectra Fest allocation reports exportable with 1-click.

---

## 12. Minimalist Monochrome Design System

### 12.1 Refined Aesthetic & Color Tokens
- Minimalist palette inspired by high-end design standards:
  - Primary Base: `#09090B` (Jet Black)
  - Secondary Charcoal: `#27272A` / `#3F3F46`
  - Neutral Background: `#FAF9F6` (Alabaster / Ivory)
  - Card & Surface: `#FFFFFF`
  - Hairline Borders: `#E5E7EB`
- High contrast, clutter-free typography utilizing Poppins and Inter font families.

### 12.2 Responsive Collapsible Sidebar
- Compact mode (64px width) featuring:
  - Centered 40px geometric icon buttons with 12px margin rhythm.
  - Floating Radix tooltips (`side="right" sideOffset={12}`) with active indicators.
  - Collapsed Popover Academic Calendar: Interactive date picker for instant day filtering without expanding the navigation rail.
  - Collapsed Avatar Popover: Quick demo role switcher (Admin / Coord / Faculty / Club) and sign-out.
  - Dedicated collapse / expand toggle buttons.

---

## 13. System Metrics & Validation Summary

| Metric | Measured Value | Standard / Requirement |
|---|---|---|
| **Hard Constraint Violations** | **0** | Strict 0 allowed |
| **Weekly Sessions Scheduled** | **189 / 189** | 100% of curriculum |
| **Solver Convergence Time** | **< 3.2s** | Real-time interactive response |
| **Spectra Requests Handled** | **25 / 25** | Prioritized allocation |
| **Midsem Exams Scheduled** | **41 / 41** | Clash-free |
| **Role Personas Supported** | **4** | Admin, Coord, Faculty, Club |
| **Supported Query Languages** | **English & Hinglish** | Natural conversational comprehension |
| **TypeScript / Build Errors** | **0** | Clean production build |
