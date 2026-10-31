<div align="center">

# 🏛️ CIT CampusOS
### Autonomous Campus Operations Platform for Chilika Institute of Technology
**Crunch Week Hackathon — Technical Submission & Benchmark Evaluation**

[![Live Demo](https://img.shields.io/badge/Live_Deployment-cit.saubhagyalabs.tech-8B2CF5?style=for-the-badge&logo=caddy&logoColor=white)](https://cit.saubhagyalabs.tech/)
[![Validator Status](https://img.shields.io/badge/Official_Validator-0_Hard_Violations-10B981?style=for-the-badge&logo=checkmarx&logoColor=white)](https://cit.saubhagyalabs.tech/api/exports/verify)
[![Spectra Score](https://img.shields.io/badge/Spectra_Score-66.0%20%2F%2070.0-F59E0B?style=for-the-badge)](https://cit.saubhagyalabs.tech/api/exports/spectra_allocations.json)
[![Disruption Recovery](https://img.shields.io/badge/Disruption_Stability-15_Moved_Sessions-3B82F6?style=for-the-badge)](https://cit.saubhagyalabs.tech/api/exports/schedule_after.json)

---

### [🌐 Access Live Production System](https://cit.saubhagyalabs.tech/) · [📄 Final Documentation](docs/FINAL_DOCUMENTATION.md) · [🤖 AI Usage Report](AI_USAGE.md) · [📦 Third Party Disclosures](THIRD_PARTY.md)

</div>

---

## 📌 Executive Summary

**Chilika Institute of Technology (CIT)** encounters severe operational complexity during **Week 7 (Crunch Week)**:
1. **Regular Academic Timetable**: 189 teaching sessions (243 contact hours) across 27 rooms, 40 faculty, and 14 student cohorts.
2. **Midsem Examinations**: 41 course exams with strict 50% room capacity caps and max 1 exam per student/day.
3. **Spectra Week Fest Allocations**: 25 competitive venue requests with strict role-category caps, priority rules, and non-overlapping timing windows.
4. **Unplanned Operational Disruptions**: Faculty medical leave, room closures, emergency maintenance requiring instant reschedule with **minimal student/faculty displacement**.

**CIT CampusOS** resolves these multi-objective scheduling problems using discrete mathematical optimization (**Google OR-Tools CP-SAT**) combined with an **institutional React dashboard**, an **AI Copilot** (English & Hinglish), and a **live WhatsApp notification gateway**.

---

## 🏆 Official Validator Benchmark Results

Evaluated directly against the official `validator.py` from the Hackathon Starter Pack:

```
======================================================================
  CIT Timetable & Fest Schedule Validator (validator.py)
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
  Total soft score: 315.0 (Optimized across S1 to S6)

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

### ⚡ Disruption Recovery Performance (`sample_disruption.json`)
- **Total Hard Violations**: **0**
- **Sessions Moved From Baseline**: **15** (3 time changes, 12 room-only reassigments)
- **Minimum Disruption Bound Achieved**: Successfully preserves institutional routine.

---

## 🔑 Demo Stakeholder Accounts (Problem Statement Section 4 & 7)

Judges and evaluators can log in immediately at **[cit.saubhagyalabs.tech](https://cit.saubhagyalabs.tech/)** using **1-Click Demo Buttons** or manual credentials:

| Stakeholder Role | Email | Password | Primary Actions & Capabilities |
| :--- | :--- | :--- | :--- |
| 🛡️ **Admin (Dean Academic)** | `admin@cit.edu` | `CitAdmin2027!` | Master timetable generation, approve schedule proposals, commit disruption repairs, one-click dataset reset. |
| 👥 **Coordinator (CSE Dept)** | `coord.cse@cit.edu` | `CitCoord2027!` | Audit cohort timetables (Y1-A, Y1-B, CSE-2, CSE-3), inspect elective baskets (`OEB-1`), room utilization. |
| 🎓 **Faculty (Dr. S. Rath)** | `faculty.f19@cit.edu` | `CitFaculty2027!` | Faculty `F19`: view personal weekly load, daily teaching cap (≤ 4h/day), exam invigilation duties. |
| ✨ **Club Lead (Dramatics)** | `dramatics@cit.edu` | `CitClub2027!` | Submit Spectra venue requests, check status reasons, interact with CIT Copilot for bookings. |

> 🔄 **Pristine Reset Feature**: The **"Reset Demo Data"** button in the header instantly restores the database and active schedule to the pristine `cit_public.json` state within 1.5 seconds.

---

## 🏛️ System Architecture

```
                                  [ Evaluator / User Browser ]
                                               │
                                 HTTPS (cit.saubhagyalabs.tech)
                                               │
                                       ┌───────▼───────┐
                                       │ Caddy Server  │ (Auto SSL / Reverse Proxy)
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

### Architectural Separation
1. **Frontend (`client/`)**: Institutional dashboard built with React 18, TypeScript, TailwindCSS, Lucide icons, and Radix UI primitives. Includes interactive multi-day timetable grid, drag-and-drop pre-flight validation, and Copilot drawer.
2. **Backend API Gateway (`server/`)**: Express.js + Prisma ORM on Node 20. Manages JWT sessions, role-based authorization, immutable audit logging, and transactional dataset re-seeding.
3. **Discrete Optimization Engine (`optimizer/`)**: Python 3.11 FastAPI microservice wrapping **Google OR-Tools CP-SAT**. Strictly separates mathematical logic from presentation.
4. **WhatsApp Automation Gateway (`evolution-go`)**: Lightweight compiled Go service paired with PostgreSQL for real-time room assignment and disruption alerts.

---

## 📋 Comprehensive Problem Statement Feature Matrix

| Requirement | Implementation in CIT CampusOS | Verification / Status |
| :--- | :--- | :--- |
| **H1–H10 Hard Constraints** | CP-SAT discrete variables for room suitability, teacher max daily hours (≤4h), group collisions, and 3-hour lab block bounds (P2 or P6). | **PASS (0 violations)** |
| **Elective Baskets (`OEB-1`)** | Synchronized parallel periods for OE301, OE302, and OE303 across Year 3 cohorts. | **PASS** |
| **Accessibility Enforcement** | Strict accessibility matching for mobility-impaired faculty/groups. Automatically identifies `SH-2` second-floor walk-up limitations and redirects to `SH-1`. | **PASS** |
| **Midsem Exam Seating** | Half-capacity room constraints, multi-room splits for large batches, and AM/PM calendar block scheduling. | **PASS (41/41 scheduled)** |
| **Spectra Week Category Caps** | Enforces `role_category_cap` (clubs cannot claim institute priority), breaking ties with submission timestamps. | **Score: 66.0 / 70.0** |
| **Disruption Recovery** | Bi-objective solver minimizing moved sessions when faculty take sudden leave or rooms undergo emergency repair. | **15 moved sessions** |
| **Drag & Drop Schedule Move** | Dragging a class triggers `/api/schedules/validate-move` pre-flight check before committing, showing exact constraint impacts. | **Interactive & Live** |
| **Plain-Language AI Copilot** | Dual-Engine: Google Gemini `gemini-3.5-flash-lite` + semantic regex parser. Handles English, Hindi, and Hinglish. | **Live & Multilingual** |
| **Custom Disruption Upload** | Evaluators can upload external JSON change files directly from the Disruption Dashboard. | **Interactive Modal** |
| **One-Click Official Verification** | "Verify Zero Clashes" navbar button executes the canonical validator on live data and renders the report. | **Interactive & Live** |

---

## 🤖 CIT Copilot & AI Capabilities (Problem Statement Section 2 & 6)

The CIT Copilot follows the strict **AI Safety Boundary** mandated by Section 6 of the Problem Statement:
> *"The LLM may propose, but only the deterministic code may dispose."*

- **Natural Language Parameter Extraction**: Converts messages like *"Need auditorium for 350 students on Friday evening with sound system for cultural night"* into structured JSON specifications (title, attendance, windows, equipment needs).
- **Hinglish Understanding**: Accurately processes colloquial Indian campus queries (e.g. *"Kal shaam 5 baje 40 bacchon ke liye robotics club meeting ke liye room chahiye projector ke saath"*).
- **Accessibility Conflict Detection**: When requested to book `SH-2` for a wheelchair-accessible session, Copilot detects the constraint violation and suggests `SH-1` (ground floor with ramp).
- **Decision Explainability**: Provides human-readable rationales (e.g. *"Booking BR-09 was rejected because request attendance (1,200) exceeds CIT's largest venue (Auditorium: 400 seats)"*).

---

## 📦 Export Deliverables & Verification Endpoints

The required JSON export deliverables are generated directly by the platform and can be downloaded from the live deployment:

| Deliverable | Description | Live Download Link |
| :--- | :--- | :--- |
| `schedule.json` | Master academic timetable, midsem exams, and Spectra fest allocations. | [Download JSON](https://cit.saubhagyalabs.tech/api/exports/schedule.json) |
| `schedule_after.json` | Repaired schedule after applying `sample_disruption.json`. | [Download JSON](https://cit.saubhagyalabs.tech/api/exports/schedule_after.json) |
| `exam_schedule.json` | Midsem seating arrangement with half-capacity rooms. | [Download JSON](https://cit.saubhagyalabs.tech/api/exports/exam_schedule.json) |
| `spectra_allocations.json`| Spectra Week booking decisions and session overrides. | [Download JSON](https://cit.saubhagyalabs.tech/api/exports/spectra_allocations.json) |

### Run Validator Locally:
```bash
# 1. Validate baseline schedule
python "docs/PS/CrunchWeek_StarterPack (1)/CrunchWeek_StarterPack/validator.py" \
  --data "docs/PS/CrunchWeek_StarterPack (1)/CrunchWeek_StarterPack/data/cit_public.json" \
  --schedule exports/schedule.json

# 2. Validate disruption recovery schedule
python "docs/PS/CrunchWeek_StarterPack (1)/CrunchWeek_StarterPack/validator.py" \
  --data "docs/PS/CrunchWeek_StarterPack (1)/CrunchWeek_StarterPack/data/cit_public.json" \
  --schedule exports/schedule_after.json \
  --disruption "docs/PS/CrunchWeek_StarterPack (1)/CrunchWeek_StarterPack/examples/sample_disruption.json" \
  --baseline exports/schedule.json
```

---

## 🚀 Local Development & Setup Instructions

### Prerequisites
- Node.js 18+ & npm
- Python 3.10+ & pip
- MySQL 8.0+ running on `localhost:3306`

### 1. Clone Repository & Setup Environment
```bash
git clone https://github.com/Akshat-sin-official/TZ-Meru-Byte.git
cd TZ-Meru-Byte
cp .env.example server/.env
```

### 2. Initialize Database & Backend
```bash
cd server
npm install
npx prisma db push
node dist/seed.js
npm run dev
# Server runs on http://localhost:5000
```

### 3. Start Python Optimizer
```bash
cd ../optimizer
pip install -r requirements.txt
uvicorn main:app --port 8001
# Optimizer runs on http://localhost:8001
```

### 4. Start React Frontend
```bash
cd ../client
npm install
npm run dev
# Client runs on http://localhost:5173
```

---

## 🛡️ Hackathon Submission Checklist (Section 7 Compliance)

- [x] **Zero Hard Violations on Timetable**: Verified by `validator.py`.
- [x] **Minimal Disruption Rescheduling**: Exactly 15 moved sessions.
- [x] **Spectra Booking Priority**: 0 priority inversions (score 66.0/70.0).
- [x] **Live Public Cloud Deployment**: Accessible at `https://cit.saubhagyalabs.tech/`.
- [x] **Export Files in Repository**: `exports/schedule.json` and `exports/schedule_after.json`.
- [x] **Mandatory Files**:
  - `README.md` (System architecture, setup instructions, demo credentials, validator proof).
  - `AI_USAGE.md` (Explicit prompts, tool logs, safety boundaries to avoid 10-mark penalty).
  - `THIRD_PARTY.md` (Open source libraries, packages, and solver disclosures).
  - `.env.example` (Template environment file without secrets).

---

<div align="center">
  <sub>Developed by Team Meru Byte for the Chilika Institute of Technology Crunch Week Hackathon.</sub>
</div>
