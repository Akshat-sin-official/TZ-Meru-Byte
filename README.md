# CIT CampusOS — Autonomous Campus Scheduling & Venue Management Platform

**Chilika Institute of Technology (CIT) — Crunch Week Hackathon**

CIT CampusOS is an enterprise-grade academic operations platform built for 1,000+ students, 40 faculty members, and 27 campus venues. It resolves the semester's peak operational challenges during Week 7 (regular classes, midsem exams, and Spectra Week fest events) with **zero hard constraint clashes**, deterministic priority allocation, continuous disruption repair, and an interactive NLP Copilot.

---

## Architecture Overview

```
                                      +---------------------------------------------+
                                      |          CIT CampusOS React 18 UI           |
                                      |   (Sidebar Layout, Bento KPIs, Copilot)     |
                                      +----------------------+----------------------+
                                                             | HTTP / REST (JWT)
                                                             v
                                      +---------------------------------------------+
                                      |         Node.js Express API Gateway         |
                                      |      (Prisma ORM, Auth, Audit Logs)         |
                                      +----------------------+----------------------+
                                                             |
                                      +----------------------+----------------------+
                                      |                                             |
                                      v                                             v
                      +-------------------------------+             +-------------------------------+
                      |   MySQL Relational Database   |             |   Python CP-SAT Microservice  |
                      |   (cit_campus_os on 3306)     |             |   (FastAPI + Google OR-Tools) |
                      +-------------------------------+             +-------------------------------+
```

---

## Demo Accounts (Section 4 & 7)

Judges can log in with any of the 4 designated stakeholder accounts, or use the **Quick Demo Switcher** directly in the application sidebar:

| Role | Email | Password | Responsibilities & Capabilities |
| :--- | :--- | :--- | :--- |
| **Admin (Dean's Office)** | `admin@cit.edu` | `CitAdmin2027!` | Generates master timetable, approves schedule proposals, runs disruption repairs, resets dataset. |
| **Department Coordinator** | `coord.cse@cit.edu` | `CitCoord2027!` | Coordinates CSE cohorts (CSE-1, 2, 3), audits faculty workloads, tests reschedule proposals. |
| **Faculty Member** | `faculty.f19@cit.edu` | `CitFaculty2027!` | Dr. S. Rath: personal schedule, daily teaching load cap meter (≤ 4h/day), exam invigilation duty. |
| **Club Representative** | `dramatics@cit.edu` | `CitClub2027!` | Dramatics Society: submits venue requests, tracks Spectra Week allocations, uses CIT Copilot. |

> **Clean Baseline Reset**: When logged in as Admin, click the **Reset Data** button in the top navigation bar at any time to instantly restore the database to the pristine `cit_public.json` state.

---

## Key Capabilities & Problem Statement Compliance

1. **Master Timetable Generation (PS #1)**: Discrete CP-SAT solver schedules all 189 sessions across 27 venues with **0 hard violations** (H1–H14).
2. **Midsem Examination Seating (PS #2)**: Schedules all 41 course exams with **strict half-capacity venue enforcement (E1)** and max 1 exam per student/day (E2).
3. **Spectra Week Venue Allocation (PS #4)**: Allocates fest bookings in priority order with role category caps, achieving a **score of 66.0 / 70.0 with 0 priority inversions** (verified on `validator.py`).
4. **Continuous Operations & Disruption Repair (PS #5)**: 2-stage CP-SAT stability optimization (100× time penalty + 10× room penalty) repairing faculty leaves or room closures with **only 15 moved sessions** (3 time changes, 12 room-only).
5. **Interactive CIT Copilot (PS #3, #7, #8)**:
   - Understands plain English and Hinglish (e.g. *"seminar hall kal shaam 6 baje, 100 log, mic chahiye"*).
   - Detects room accessibility conflicts (e.g. detects `SH-2` lacks elevator access and automatically recommends `SH-1`).
   - Explains decisions (e.g. explains why BR-09 was rejected due to 1,200 attendance exceeding Auditorium capacity).
   - Translates faculty unavailability into formal disruption proposals.
6. **Official Validator Parity (PS #9)**: Exported `exports/schedule.json` and `exports/schedule_after.json` pass the official `validator.py` with 0 hard violations.

---

## Tech Stack (THIRD_PARTY.md)

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React, Radix UI Primitives, Sonner.
- **Backend**: Node.js, Express, TypeScript, Prisma ORM, JWT, Bcrypt.
- **Database**: MySQL 8.0 (`cit_campus_os`).
- **Optimization**: Python 3.10+, Google OR-Tools (CP-SAT), FastAPI, Uvicorn.

---

## Setup & Local Installation

### Prerequisites
- Node.js 18+ and npm
- Python 3.8+ with pip
- MySQL 8.0+ running on port `3306`

### 1. Database Setup
```bash
# Ensure MySQL is running and create database
mysql -u root -e "CREATE DATABASE IF NOT EXISTS cit_campus_os;"
```

### 2. Backend Gateway Setup
```bash
cd server
npm install
npx prisma db push
npm run seed
npm run dev
# Backend starts on http://localhost:5000
```

### 3. Python Optimization Microservice Setup
```bash
cd optimizer
pip install -r requirements.txt
python -m uvicorn main:app --port 8001
# Optimizer listening on http://127.0.0.1:8001
```

### 4. Frontend Web App Setup
```bash
cd client
npm install
npm run dev
# Frontend accessible at http://localhost:5173
```

---

## Running the Official Validator

Verify the official benchmark outputs at any time:

```bash
# Verify baseline schedule.json
python "docs/PS/CrunchWeek_StarterPack (1)/CrunchWeek_StarterPack/validator.py" \
  --data "docs/PS/CrunchWeek_StarterPack (1)/CrunchWeek_StarterPack/data/cit_public.json" \
  --schedule exports/schedule.json

# Verify disruption schedule_after.json
python "docs/PS/CrunchWeek_StarterPack (1)/CrunchWeek_StarterPack/validator.py" \
  --data "docs/PS/CrunchWeek_StarterPack (1)/CrunchWeek_StarterPack/data/cit_public.json" \
  --schedule exports/schedule_after.json \
  --disruption "docs/PS/CrunchWeek_StarterPack (1)/CrunchWeek_StarterPack/examples/sample_disruption.json" \
  --baseline exports/schedule.json
```

**Validator Benchmark Results**:
- `Hard violations`: **0**
- `Spectra Week Score`: **66.0 / 70** (22 approved, 0 priority inversions)
- `Disruption Stability`: **15 sessions moved** (3 time changes, 12 room-only)

---

## Known Limitations

- Real-time optimization is computationally capped at 60 seconds per solve invocation to maintain interactive web performance.
- Spectra Week venue allocations require an active master timetable baseline before fest week overrides can be computed.

