# CIT CampusOS — Technical Documentation & Problem Statement Compliance Report

**Product:** CIT CampusOS (Chilika Institute of Technology Campus Operations Platform)  
**Team:** Meru Byte  
**Live Production URL:** [https://cit.saubhagyalabs.tech/](https://cit.saubhagyalabs.tech/)  
**Public Repository:** [https://github.com/Akshat-sin-official/TZ-Meru-Byte](https://github.com/Akshat-sin-official/TZ-Meru-Byte)  
**Official Validator Verdict:** **0 Hard Violations (Verified)** | **66.0 / 70.0 Spectra Score** | **15 Minimum Disruption Moves**

---

## 1. System Architecture

CIT CampusOS is engineered as a three-tier, high-reliability architecture that cleanly separates mathematical constraint optimization, transaction orchestration, and user interaction.

```
                                  [ User / Evaluator Browser ]
                                               │
                                 HTTPS (cit.saubhagyalabs.tech)
                                               │
                                       ┌───────▼───────┐
                                       │ Caddy Server  │ (Reverse Proxy & Auto SSL)
                                       └───────┬───────┘
                                               │
                       ┌───────────────────────┼─────────────────────────┐
                       │ /                     │ /api                    │ /wa
                       ▼                       ▼                         ▼
             ┌──────────────────┐    ┌──────────────────┐      ┌──────────────────┐
             │  React 18 + Vite │    │  Node.js Server  │      │  Evolution-Go    │
             │  (Frontend UI)   │    │  (Express/Prisma)│      │  WhatsApp Gateway│
             └──────────────────┘    └─────────┬────────┘      └─────────┬────────┘
                                               │                         │
                                    ┌──────────┴──────────┐              │
                                    ▼                     ▼              │
                           ┌─────────────────┐   ┌─────────────────┐     │
                           │ MySQL 8.0 DB    │   │ Python CP-SAT   │     │
                           │ cit_campus_os   │   │ Solver (ortools)│     │
                           └─────────────────┘   └─────────────────┘     │
                                                                         │
                                                               ┌─────────▼────────┐
                                                               │ PostgreSQL 15 DB │
                                                               │ evogo_users/auth │
                                                               └──────────────────┘
```

1. **Frontend Presentation Layer (`client/`):** React 18, TypeScript, TailwindCSS, Vite. Built with standard institutional layout (Sidebar navigation, Bento stat cards, multi-day grid filters, conflict callouts, and real-time toast feedback).
2. **Application & Business Logic Layer (`server/`):** Node.js, Express, Prisma ORM, JWT Authentication with role-based access control (`admin`, `department_coordinator`, `faculty`, `club`).
3. **Discrete Optimization Engine (`optimizer/`):** Python 3.11 FastAPI microservice wrapping **Google OR-Tools CP-SAT**. Evaluates discrete constraints and ensures zero hard clashes.
4. **WhatsApp Automation Gateway (`evolution-go`):** Production Go-compiled gateway managing WhatsApp Web pairing and automated notifications.

---

## 2. Problem Statement Mapping & Compliance Matrix

| PS Section | Requirement Description | Implementation in CIT CampusOS | Verification / Status |
| :--- | :--- | :--- | :--- |
| **Section 1 (Core)** | **Academic Timetable (189 Sessions)**<br>Zero hard violations across rooms, faculty, student groups, elective baskets (`OEB-1`), and fixed slots. | `optimizer/timetable_solver.py`<br>CP-SAT formulation enforcing H1–H10 constraints. | **100% Compliant**<br>`exports/schedule.json` verified with `validator.py`: **0 hard violations**, soft score 315. |
| **Section 2 #1** | **Spectra Week Venue Allocation (25 Requests)**<br>Handle requests, role category capping, time windows, and equipment needs. | `optimizer/booking_engine.py`<br>Priority-ordered booking engine with ties broken by `submitted_at`. | **100% Compliant**<br>Score: **66.0 / 70.0**, 0 priority inversions. |
| **Section 2 #2** | **Midsem Exam Seating (41 Exams)**<br>50% seating capacity reduction, shared room splits, and period blocks. | `optimizer/exam_solver.py`<br>Allocates 41 midsem exams across AM/PM slots (Mon–Sat). | **100% Compliant**<br>Fully exported in `schedule.json` and `/api/exports/exam_schedule.json`. |
| **Section 2 #3** | **Natural Language Booking Extraction**<br>Extract attendance, time windows, room types, and equipment from unstructured text. | `server/src/routes/assistant.ts`<br>Dual-Engine: Google Gemini `gemini-3.5-flash-lite` + deterministic regex parser. | **100% Compliant**<br>Tested on English & Hinglish prompts from `sample_requests.md`. |
| **Section 2 #4** | **Disruption Recovery (Unplanned Events)**<br>Faculty absence, room maintenance, session additions/removals with minimum moved sessions. | `optimizer/disruption_solver.py`<br>Bi-objective CP-SAT: Hard constraints primary, session displacement minimization secondary. | **100% Compliant**<br>`exports/schedule_after.json` verified: **Exactly 15 moved sessions**, 0 hard violations. |
| **Section 2 #5** | **Custom Change File Upload**<br>Allow evaluators to upload disruption JSON and solve live. | `client/src/pages/campus/DisruptionsView.tsx`<br>"Upload Change File" modal with JSON syntax validation. | **100% Compliant**<br>POST `/api/disruptions/submit`. |
| **Section 2 #6** | **Drag & Drop Schedule Move with Validation**<br>Allow manual slot rescheduling with live validation before committing. | `client/src/pages/campus/TimetableDashboard.tsx`<br>Pre-flight validation checks all H1–H10 rules before user commits change. | **100% Compliant**<br>POST `/api/schedules/validate-move` & `/api/schedules/apply-move`. |
| **Section 2 #7** | **Interactive Assistant Proposals**<br>AI suggests solutions for faculty absence with human approval. | `client/src/components/campus/AICopilotDrawer.tsx`<br>Renders structured proposal cards with one-click approval. | **100% Compliant**<br>Interactive Copilot drawer. |
| **Section 2 #8** | **Decision Explainability**<br>Plain-language explanation of why bookings were rejected or why slots were chosen. | `server/src/routes/assistant.ts`<br>Explains BR-09 capacity ceiling (1,200 > 400), BR-07 priority displacement, etc. | **100% Compliant**<br>Prompt buttons included in Copilot. |
| **Section 2 #9** | **Dataset Ingestion & Reset**<br>Support custom dataset upload and pristine demo reset. | `server/src/routes/datasets.ts`<br>POST `/api/datasets/reset-demo` and POST `/api/datasets/upload`. | **100% Compliant**<br>Header button restores full clean dataset in ~1.5s. |
| **Section 6** | **AI Safety & Constraint Boundaries**<br>LLM must propose, solver must dispose. No unvalidated writes. | Architecture enforces strict boundary: Gemini proposes parameters, CP-SAT validates and executes. | **100% Compliant**<br>Documented in `AI_USAGE.md`. |
| **Section 7** | **Mandatory Submission Deliverables**<br>`README.md`, `AI_USAGE.md`, `THIRD_PARTY.md`, `.env.example`, `exports/`. | All files present at repository root and committed before deadline. | **100% Compliant** |

---

## 3. Official Validator Verification Results

### Baseline Schedule (`exports/schedule.json`)
```bash
python validator.py --data docs/PS/CrunchWeek_StarterPack\ \(1\)/CrunchWeek_StarterPack/data/cit_public.json \
                    --schedule exports/schedule.json
```
**Output:**
```
======================================================================
  CIT Timetable & Fest Schedule Validator
======================================================================
Loaded dataset 'cit-public-v1': 27 rooms, 40 faculty, 189 sessions, 25 requests, 41 exams

--- Checking Hard Constraints (Timetable) ---
  H1 Session existence & completeness: PASS (189/189 scheduled)
  H2 Room capacity & suitability:       PASS (0 violations)
  H3 Room double-booking:               PASS (0 violations)
  H4 Faculty double-booking:            PASS (0 violations)
  H5 Faculty availability:              PASS (0 violations)
  H6 Faculty max daily hours:           PASS (0 violations)
  H7 Student group double-booking:      PASS (0 violations)
  H8 Accessibility:                     PASS (0 violations)
  H9 Lab block constraints:             PASS (0 violations)
  H10 Elective baskets & fixed slots:   PASS (0 violations)

TOTAL HARD VIOLATIONS: 0

--- Checking Soft Constraints (Timetable) ---
  Total soft score: 315.0

--- Checking Fest Bookings (Spectra Week) ---
  Total booking score: 66.0 / 70.0
  Priority inversions: 0

--- Checking Midsem Exams ---
  Exams scheduled: 41 / 41 (100.0%)
  Exam hard violations: 0
======================================================================
VERDICT: VALID TIMETABLE & FEST SCHEDULE (Zero Hard Violations)
======================================================================
```

### Disruption Repaired Schedule (`exports/schedule_after.json`)
```bash
python validator.py --data docs/PS/CrunchWeek_StarterPack\ \(1\)/CrunchWeek_StarterPack/data/cit_public.json \
                    --schedule exports/schedule_after.json \
                    --disruption docs/PS/CrunchWeek_StarterPack\ \(1\)/CrunchWeek_StarterPack/examples/sample_disruption.json \
                    --baseline exports/schedule.json
```
**Output:**
```
TOTAL HARD VIOLATIONS: 0
SESSIONS MOVED FROM BASELINE: 15 (Minimum Disruption Achieved)
VERDICT: VALID REPAIRED SCHEDULE
```

---

## 4. Evaluator Demo Credentials & Live Testing Guide

Evaluators can access the live instance directly at **[https://cit.saubhagyalabs.tech/](https://cit.saubhagyalabs.tech/)**.

### Demo User Accounts (1-Click or Manual Sign In):
- **Admin (Dean of Academic Affairs)**: `admin@cit.edu` / `CitAdmin2027!`  
  *Access: Full system control, dataset reseeding, schedule activation, disruption commitment, official validator verification.*
- **Department Coordinator (CSE)**: `coord.cse@cit.edu` / `CitCoord2027!`  
  *Access: Departmental timetable view, section schedule management, room utilization audit.*
- **Faculty Member (Dr. S. Rath - F19)**: `faculty.f19@cit.edu` / `CitFaculty2027!`  
  *Access: Personal weekly timetable, preference conflict viewing, leave request tracking.*
- **Student Club Lead (Dramatics Society)**: `dramatics@cit.edu` / `CitClub2027!`  
  *Access: Spectra booking portal, request submission, venue availability, status explanations.*

---

## 5. Summary of What Was Implemented vs What's Left

### What Was Built & Fully Implemented:
1. **Academic Timetable Optimizer**: 100% hard-violation free solver with elective basket synchronization and lab placement.
2. **Midsem Exam Allocator**: 41 exams with half-capacity spacing and multi-room splits.
3. **Spectra Week Booking Engine**: Complete category capping, window matching, and tie-breaking.
4. **Disruption Repair Engine**: Minimum movement re-solver for unplanned changes.
5. **Interactive AI Copilot**: Google Gemini dual-engine supporting English, Hindi, and Hinglish.
6. **Pre-Flight Drag & Drop Validation**: Real-time rule checking with manual move commitment.
7. **Official Validator Integration**: One-click verification directly from the UI header.
8. **WhatsApp Alert Gateway**: Evolution-Go integration for automated schedule change broadcasts.
9. **Full Cloud Deployment**: DigitalOcean Droplet + Caddy reverse proxy + Auto SSL.

### Enhancements Identified for Post-Hackathon Roadmap:
- **Bulk CSV Export**: While JSON exports match 100% of the problem statement specification (`schedule.json`, `schedule_after.json`, `exam_schedule.json`, `spectra_allocations.json`), adding secondary downloadable CSV spreadsheets for faculty could be added in a future release.
- **Biometric / SMS Push Notification**: Extending the WhatsApp messaging engine to include SMS / Web Push fallback.
