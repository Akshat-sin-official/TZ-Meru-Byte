# CAMPORA (Campora) — Engineering Specification & Technical Design
## Crunch Week Hackathon Complete Compliance & Delivery Blueprint

---

### Executive Overview

CAMPORA (Campora) is an AI-assisted campus operations and scheduling platform for Chilika Institute of Technology. Following a rigorous independent audit in `docs/verdict.md`, this specification establishes the authoritative engineering blueprint to address every identified gap, align the platform with the official Crunch Week Problem Statement and starter-pack validator, and deliver a competition-winning hackathon submission.

#### Official Baseline Verification Status
The official `validator.py` was executed directly against our generated outputs with the following verified results:
* **Master Timetable (`exports/schedule.json`)**: **0 Hard Violations**, Soft Score: 290 ($S1=0, S2=50, S3=48, S4=192, S5=0, S6=0$).
* **Spectra Venue Bookings**: **Score: 66.0** (22 approved, 0 alternatives, 3 rejected, 0 session overrides, 0 priority inversions).
* **Midsem Examinations**: **0 Soft Penalty** (no exam collisions, no same-day student cohort overload).
* **Disruption Recovery (`exports/schedule_after.json`)**: **0 Hard Violations**, Soft Score: 325, **Stability: 93 sessions moved** (68 time, 25 room only) with full constraint satisfaction under `sample_disruption.json`.

---

### 1. Requirements Compliance Matrix (PS §2 & Verdict Mapping)

| # | PS Requirement | Starter Pack Constraint / Rule | App Architecture & Implementation | Status |
|---|---|---|---|---|
| **REQ-1** | Weekly timetable without clashes | Official **H1–H14** constraints, **P1–P9** teaching (08:00–18:00), Lunch 13:00–14:00 (between P5 and P6), 3h labs at P2/P6 | Python CP-SAT solver (`timetable_solver.py`), MySQL versioned schedule table, Express REST API | ✅ **Verified (0 Hard Violations)** |
| **REQ-2** | Midsem exam scheduling | 6 days (Mon–Sat), AM (09:30–11:30) / PM (14:00–16:00), 50% room capacity, multi-room allocation, 0 cohort collisions | Exam CP-SAT solver (`exam_solver.py`), interactive reschedule modal with pre-flight checks | ✅ **Operational & Tested** |
| **REQ-3** | Plain English/Hinglish requests | Conversational venue requests via Web Copilot and WhatsApp, editable before submission | Gemini 2.5 Flash copilot + Twilio-compatible WhatsApp webhook engine with structured confirmation | ✅ **Operational** |
| **REQ-4** | Transparent venue booking | Priority hierarchy: Exam > Regular > Institute > Guest > Dept > Club; Role category caps, accessible rooms, feature matching | Priority queue + constraint booking engine (`booking_engine.py`) with explicit rejection reasons | ✅ **Operational (Score: 66.0)** |
| **REQ-5** | Disruption recovery with minimal movement | Support 5 disruption types: `faculty_unavailable`, `room_unavailable`, `add_faculty`, `add_session`, `remove_session` | Minimal-movement CP-SAT solver (`disruption_solver.py`), pending approval proposal workflow | 🔶 **Expand change types** |
| **REQ-6** | Role-scoped visibility & analytics | 4 Personas: Admin, Dept Coordinator, Faculty, Club Rep. Timetables, approvals, room utilization | JWT Auth with database-enforced RBAC, scoped queries, interactive utilization view | ✅ **Operational** |
| **REQ-7** | Faculty AI assistant | Unavailability declaration, extra session requests, timetable queries via natural language | Gemini Assistant tools integrated into backend routes (`/api/assistant/chat`) | ✅ **Operational** |
| **REQ-8** | Explainable scheduling decisions | Deterministic rejection reasons, candidate slot inspection, soft-penalty trade-offs | Constraint evaluation breakdown endpoint + UI candidate reasoning inspector | 🔶 **P1 Enhancement** |
| **REQ-9** | Admin dataset import & JSON exports | Ingest `cit_public.json`, export standard `schedule.json` and `schedule_after.json`, run `validator.py` | Dedicated Admin Data Hub UI, `/api/exports/*` endpoints, server-side validator runner | 🔶 **Expose in UI** |
| **REQ-10** | Manual slot movement by authorized roles | Drag-and-drop & manual slot relocation with live pre-flight constraint validation | `POST /api/schedules/validate-move` + `POST /api/schedules/move-slot` with audit logging | ✅ **Operational** |

---

### 2. Time Model & Constraint Architecture

```mermaid
flowchart LR
    subgraph DaySchedule["Official Campora Daily Time Model"]
        direction LR
        P1["P1<br/>08:00-09:00"] --> P2["P2 (Lab Start)<br/>09:00-10:00"]
        P2 --> P3["P3<br/>10:00-11:00"]
        P3 --> P4["P4<br/>11:00-12:00"]
        P4 --> P5["P5<br/>12:00-13:00"]
        P5 --> LUNCH["LUNCH BREAK<br/>13:00 - 14:00<br/>(No Classes)"]
        LUNCH --> P6["P6 (Lab Start)<br/>14:00-15:00"]
        P6 --> P7["P7<br/>15:00-16:00"]
        P7 --> P8["P8<br/>16:00-17:00"]
        P8 --> P9["P9 (Last Teaching)<br/>17:00-18:00"]
        P9 --> EVENTS["P10 - P13<br/>18:00 - 22:00<br/>(Events Only)"]
    end
```

#### Official Hard Constraints (H1–H14)
* **H1**: Every session scheduled exactly once with valid day, start period, and room.
* **H2**: No faculty double-booking.
* **H3**: No student group double-booking (except within shared elective baskets).
* **H4**: No room double-booking.
* **H5**: Room capacity $\ge$ session student count.
* **H6**: Room type matches session requirements (e.g., `computer_lab`, `seminar_hall`, `lecture_hall`).
* **H7**: Faculty unavailability respected.
* **H8**: Room unavailability respected.
* **H9**: Valid teaching periods (P1–P9), sessions cannot cross lunch (13:00–14:00), 3-hour labs start **only** at P2 or P6.
* **H10**: Accessibility requirement respected (ground floor or elevator-equipped rooms).
* **H11**: Elective basket synchronization (all sessions in basket share day and start period).
* **H12**: Faculty daily teaching hour cap respected ($\le \text{max\_hours\_per\_day}$, default 4 hours).
* **H13**: Spectra venue booking rules respected.
* **H14**: Fixed-slot sessions remain locked at designated day and period.

#### Official Soft Constraints (S1–S6)
* **S1**: Faculty time preferences (penalty 2 per period for avoided periods).
* **S2**: Student group idle gap periods (penalty 1 per idle hour).
* **S3**: Student group daily load $>6$ hours (penalty 3 per excess hour).
* **S4**: Repeated lectures of the same course for a group on the same day (penalty 3 per repeat).
* **S5**: Low room utilization ($<40\%$ capacity used, penalty 1).
* **S6**: Scheduling in Period 9 (penalty 1 per session).

---

### 3. Detailed Technical Design Across Tiers

```mermaid
graph TD
    UI[Frontend: React 18 + Vite + Tailwind] -->|REST / JWT| API[Backend: Node.js + Express + Prisma]
    API -->|Async Optimization Requests| OPT[Python Optimizer: FastAPI + OR-Tools CP-SAT]
    API -->|Relational Persistence| DB[(MySQL 8.0: cit_campus_os)]
    API -->|Natural Language Intent| AI[Google Gemini 2.5 Flash]
    API -->|Bi-directional Messaging| WA[WhatsApp Cloud / Twilio Webhook]
    API -->|Official Verification| VAL[Python validator.py CLI / Subprocess]
```

#### 3.1 Optimizer Tier (`optimizer/`)
* **`timetable_solver.py`**: CP-SAT formulation strictly enforcing H1–H14 and optimizing S1–S6.
* **`exam_solver.py`**: Midsem scheduling across Mon–Sat AM/PM slots enforcing 50% capacity, multi-room bin packing, zero student cohort clashes.
* **`booking_engine.py`**: Evaluates 25 requests against priority tiers, role category caps, required features, and room availability.
* **`disruption_solver.py`**: Minimum-movement repair supporting all 5 change types (`faculty_unavailable`, `room_unavailable`, `add_faculty`, `add_session`, `remove_session`).
* **`canonical_validator.py`**: Server-side wrapper executing official `validator.py` logic and producing JSON verification reports.

#### 3.2 Backend Service Tier (`server/`)
* **Notification & Audit Engine (`utils/notifications.ts`)**: Safe foreign-key resolution (`getSafeUserId`), immutable audit logs, real-time in-app user notifications.
* **Validation Endpoint (`routes/datasets.ts` / `routes/exports.ts`)**:
  * `POST /api/datasets/import`: Upload and parse `cit_public.json`.
  * `POST /api/disruptions/upload`: Upload JSON change files and trigger simulated repair.
  * `GET /api/exports/validate`: Run `validator.py` on the active schedule and return the certificate.
* **Role-Based Access Control (`middleware/auth.ts`)**:
  * Strict database verification of token payload.
  * Coordinator operations scoped to user's assigned department.
  * Club representative restricted strictly to venue booking queries.

#### 3.3 Frontend Experience Tier (`client/`)
* **Timetable Dashboard (`pages/campus/TimetableDashboard.tsx`)**: Full P1–P9 grid view with Lunch banner between P5 and P6, P10–P13 evening events toggle, drag-and-drop slot moves with pre-flight check.
* **Exams Management (`pages/campus/ExamsView.tsx`)**: Multi-attribute search, 5-stage CP-SAT solver visualization modal, slot reschedule tool.
* **Data Hub & Official Validator View (`pages/campus/DataHubView.tsx`)**:
  * Upload `cit_public.json` or disruption files.
  * Real-time "Validation Certificate" badge showing 0 hard violations, soft penalty breakdown, and booking score.
  * Direct download buttons for `schedule.json`, `schedule_after.json`, and PDF reports.
* **Disruption Control Tower (`pages/campus/DisruptionsView.tsx`)**: Side-by-side what-if scenario comparison (current vs proposal metrics: moved sessions, affected groups, soft penalty delta) before Admin approval.

---

### 4. Implementation Task List

#### Phase 1: P0 — Critical Correctness & Validator Compliance
- [x] **Audit & Fix Foreign Key Constraints**: Secure `prisma.auditLog.create()` against invalid user IDs via `getSafeUserId` fallback.
- [x] **Verify Official Validator**: Run `validator.py` on `exports/schedule.json` (0 hard violations verified).
- [x] **Verify Disruption Validator**: Run `validator.py` on `exports/schedule_after.json` with `sample_disruption.json` (0 hard violations verified).
- [ ] **Data Hub & Validator UI**: Create frontend interface for dataset upload, disruption file upload, and one-click "Run Official Validator" with live certificate display.
- [ ] **Disruption Change Types Expansion**: Ensure `disruption_solver.py` explicitly handles `add_faculty`, `add_session`, and `remove_session` alongside availability changes.
- [ ] **Booking Engine Enhancements**: Ensure cancelled request (BR-24) is recorded with status `cancelled` in exports, and add explicit room feature matching.

#### Phase 2: P1 — Hackathon Differentiation & Transparency
- [ ] **Explainable Scheduling Modal**: UI dialog showing candidate slot evaluations for any session (blocking constraint or penalty score per slot).
- [ ] **Disruption Impact Diff Viewer**: Visual side-by-side timetable diff displaying moved sessions highlighted in amber/green with affected group tags.
- [ ] **Booking Decision Breakdown**: Detailed drawer in Spectra view showing why alternate rooms were picked or why a request was rejected.
- [ ] **WhatsApp State Persistence**: Store multi-turn conversation context in MySQL instead of memory to survive restarts.

#### Phase 3: P2 — Polish & Submission Artifacts
- [ ] **Validation Certificate in PDF**: Add official validator score badge and dataset hash directly to timetable PDF export.
- [ ] **ICS Calendar Export**: One-click download for faculty and student cohort schedules in standard `.ics` format.
- [ ] **Documentation Updates**: Refresh `features.md` and `README.md` to reflect the official H1–H14 constraints and exact benchmark metrics.

---

### 5. Verification & Acceptance Testing Protocol

To certify end-to-end correctness before final demonstration:
1. **Official Validator Execution**:
   ```bash
   python "docs/PS/CrunchWeek_StarterPack (1)/CrunchWeek_StarterPack/validator.py" --data "docs/PS/CrunchWeek_StarterPack (1)/CrunchWeek_StarterPack/data/cit_public.json" --schedule "exports/schedule.json"
   ```
   *Pass Criteria*: `Hard violations: 0`, `Soft penalty <= 300`, `Bookings score >= 65.0`.
2. **Disruption Recovery Validation**:
   ```bash
   python "docs/PS/CrunchWeek_StarterPack (1)/CrunchWeek_StarterPack/validator.py" --data "docs/PS/CrunchWeek_StarterPack (1)/CrunchWeek_StarterPack/data/cit_public.json" --baseline "exports/schedule.json" --disruption "docs/PS/CrunchWeek_StarterPack (1)/CrunchWeek_StarterPack/examples/sample_disruption.json" --schedule "exports/schedule_after.json"
   ```
   *Pass Criteria*: `Hard violations: 0`, `Stability: minimal sessions moved`.
3. **Full TypeScript Compilation**:
   ```powershell
   npm --prefix server run build
   npm --prefix client run build
   ```
   *Pass Criteria*: 0 type errors, 0 lint failures.

