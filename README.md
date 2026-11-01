<div align="center">

<img src="client/public/logo.png" alt="CAMPORA logo" width="130" />

# CAMPORA
### by MERUBYTE
**Autonomous Campus Scheduling, Disruption Recovery & Venue Orchestration Platform**  
*Built for Chilika Institute of Technology (CIT) · Crunch Week Hackathon*

[![Live Application](https://img.shields.io/badge/Live_Application-cit.saubhagyalabs.tech-2563EB?style=for-the-badge)](https://cit.saubhagyalabs.tech/)
[![Official Validator](https://img.shields.io/badge/Official_Validator-0_Hard_Violations-15803D?style=for-the-badge)](https://cit.saubhagyalabs.tech/api/exports/verify)
[![Soft Penalty](https://img.shields.io/badge/Soft_Penalty-274_Optimized-059669?style=for-the-badge)](https://cit.saubhagyalabs.tech/api/exports/verify)
[![Disruption Minimal Shift](https://img.shields.io/badge/Disruption_Shift-11_Moved_Sessions-6366F1?style=for-the-badge)](https://cit.saubhagyalabs.tech/api/exports/schedule_after.json)
[![WhatsApp Bot](https://img.shields.io/badge/WhatsApp_Copilot-+91_7985013913-22C55E?style=for-the-badge)](https://wa.me/917985013913)

**[🌐 Open Live Platform](https://cit.saubhagyalabs.tech/)** ·
**[🎬 Video Demo Script](docs/guides/PRESENTATION_VIDEO_SCRIPT.md)** ·
**[🤖 AI Declaration](docs/declarations/AI_USAGE.md)** ·
**[📜 Third-Party Disclosures](docs/declarations/THIRD_PARTY.md)** ·
**[📂 Full Documentation Index](#-documentation-and-scripts-directory)**

</div>

---

## 🧭 Executive Summary

CAMPORA solves the NP-hard challenge of university operations during CIT's **Crunch Week (Week 7)** by coupling **Google OR-Tools CP-SAT discrete optimization** with a **Gemini-powered Natural Language & WhatsApp Copilot**.

> **Core Tenet:** *AI interprets intent and explains decisions; deterministic CP-SAT constraints govern every assignment.*

```mermaid
graph LR
    subgraph INTAKE["1. Dual-Channel Intake"]
        A1["Web UI / Dashboard"] 
        A2["WhatsApp Bot (+91 7985013913)"]
        A3["Disruption Change Files"]
    end

    subgraph ENGINE["2. Campora Core Engine"]
        B1["Gemini Intent & Equipment Parser"]
        B2["CP-SAT Discrete Optimizer (H1-H10)"]
        B3["Stability Solver (Minimal Shift)"]
        B4["6-Tier Priority Adjudicator"]
    end

    subgraph OUTPUT["3. Deterministic Governance"]
        C1["Clash-Free Master Timetable"]
        C2["50% Cap Midsem Exam Seating"]
        C3["Admin Approval & One-Click Commit"]
        C4["Official schedule.json Export"]
    end

    A1 --> B1 & B2
    A2 --> B1
    A3 --> B3
    B1 --> B2 & B4
    B2 --> C1 & C2
    B3 --> C3
    B4 --> C1
    C1 --> C4
    C3 --> C1

    classDef blue fill:#2563EB,stroke:#1D4ED8,color:#fff;
    classDef teal fill:#0D9488,stroke:#0F766E,color:#fff;
    classDef purple fill:#7C3AED,stroke:#6D28D9,color:#fff;
    class A1,A2,A3 blue;
    class B1,B2,B3,B4 teal;
    class C1,C2,C3,C4 purple;
```

---

## 📊 Canonical Benchmark Results

Evaluated directly with the hackathon starter pack's official `validator.py`:

| Evaluation Metric | Canonical Benchmark | Campora Verified Result | Status |
| :--- | :---: | :---: | :---: |
| **Hard Constraint Violations (H1–H10)** | `0` | **0** | Pass ✅ |
| **Weekly Regular Sessions Scheduled** | `189` | **189 / 189 (100%)** | Pass ✅ |
| **Weekly Teaching Hours** | `243` | **243 hrs** | Pass ✅ |
| **Soft Penalty Score (S1–S6)** | Lower is better | **274** *(S1:0, S2:49, S3:60, S4:165, S5:0, S6:0)* | Pass ✅ |
| **Spectra Week Bookings Adjudicated** | `25` | **25 / 25 Evaluated** (66.0 / 70.0 Score) | Pass ✅ |
| **Midsem Course Examinations** | `41` | **41 Scheduled** (50% Room Anti-Cheating Split) | Pass ✅ |
| **Disruption Recovery (sample_disruption)** | Minimal Moves | **Only 11 Sessions Moved** (2 time, 9 room-only) | Pass ✅ |
| **Solver Generation Latency** | Fast Response | **< 0.2 seconds** *(Warm-start CP-SAT)* | Pass ✅ |

---

## 🏛️ System Architecture

```mermaid
flowchart TD
    subgraph CLIENT["Frontend Layer (React 18 + Vite + Tailwind CSS)"]
        UI1["Timetable Multi-Grid (Cohort / Faculty / Room)"]
        UI2["Spectra Priority Adjudicator & Explainability"]
        UI3["Disruption Stability Diff & Commit Modal"]
        UI4["AI Assistant Chat Interface"]
    end

    subgraph GATEWAY["API & Orchestration Layer (Node.js + Express + Prisma)"]
        GW1["JWT Authentication & RBAC Guard"]
        GW2["Approval & Delegation Controller"]
        GW3["WhatsApp Webhook Controller"]
        GW4["Export & Official Validator Service"]
    end

    subgraph OPTIMIZER["Optimization Microservice (Python FastAPI + OR-Tools)"]
        CP1["timetable_solver.py (CP-SAT Regular Sessions)"]
        CP2["disruption_solver.py (Stability Minimizer)"]
        CP3["exam_solver.py (50% Split Seating)"]
        CP4["canonical_validator.py (H1-H10 & S1-S6 Checker)"]
    end

    subgraph INTEGRATIONS["External & Gateway Services"]
        WA["Evolution-Go WhatsApp Gateway (:8080)"]
        AI["Google Gemini 2.5 Flash / Pro API"]
        DB[("MySQL 8.0 Primary Storage")]
    end

    CLIENT <-->|REST API + Bearer Token| GATEWAY
    GATEWAY <-->|Internal HTTP /:8001| OPTIMIZER
    GATEWAY <-->|Prisma ORM| DB
    GATEWAY <-->|Webhooks| WA
    GATEWAY <-->|Generative SDK| AI
```

---

## 🔄 Core Workflows & Logic

### 1. Dual-Channel Intake & Approval Hierarchy
*Admin changes commit immediately; subordinates route requests to their manager.*

```mermaid
sequenceDiagram
    autonumber
    actor User as Subordinate (Faculty / Club)
    actor Admin as Admin / Operations Head
    participant Sys as Campora API Gateway
    participant AI as Gemini & CP-SAT Engine
    participant WA as WhatsApp Bot (+91 7985013913)

    alt Web UI Submission
        User->>Sys: Submit plain English or Hinglish venue request
    else WhatsApp Intake
        User->>WA: Text: "Kal Seminar Hall chahiye 2 ghante ke liye"
        WA->>Sys: Forward Inbound Webhook
    end

    Sys->>AI: Parse Intent, Equipments & Attendees
    AI-->>Sys: Structured Booking Proposal (Capacity checked)
    
    alt User is Admin
        Sys->>Sys: Auto-validate constraints & Commit directly
        Sys-->>User: Booking Confirmed (Zero Pending State)
    else User is Subordinate
        Sys->>Sys: Stage in 'pending_approval' & Route to Manager
        Sys-->>Admin: Dispatch In-App Notification & Review Diff
        Admin->>Sys: Approve / Suggest Alternative
        Sys->>Sys: Commit to Live Timetable
        Sys-->>User: Notify Approval & Slot Allocation
    end
```

---

### 2. Disruption Recovery (Minimal-Movement Stability)
*When faculty falls sick or a room leaks, preserve campus routine with minimum disruption.*

```mermaid
flowchart TD
    D1["Incoming Disruption Event<br/>(e.g., F07 absent Mon, CR-102 flooded)"] --> D2["Load Baseline Schedule Version"]
    D2 --> D3["Filter Hard Constraints (H1, H2, H3, H4, H11, H12)"]
    D3 --> D4["CP-SAT Stability Objective:<br/>Minimize: 100 × ΔTime + 10 × ΔRoom"]
    D4 --> D5["Warm-Start Hint Injection from Baseline"]
    D5 --> D6{"Feasible Solution Found?"}
    D6 -- Yes --> D7["Generate Minimal-Shift Diff<br/>(Only 11 of 189 sessions moved)"]
    D6 -- No --> D8["Explain Infeasible Constraint Conflict"]
    D7 --> D9["Admin Reviews Diff Table"]
    D9 --> D10["Click 'Commit Timetable Changes'"]
    D10 --> D11["New Live Schedule Version Activated"]
```

---

### 3. Spectra Week 6-Tier Priority Adjudication
*Deterministic conflict resolution under heavy demand.*

```mermaid
graph TD
    P1["Tier 1: Academic Examinations (Weight: 100)"] --> P2["Tier 2: Department Academic Events (Weight: 80)"]
    P2 --> P3["Tier 3: Student Fest Flagship Programs (Weight: 60)"]
    P3 --> P4["Tier 4: Club Activities & Workshops (Weight: 40)"]
    P4 --> P5["Tier 5: Study Sessions & Informal Gatherings (Weight: 20)"]
    P5 --> P6["Tier 6: External Bookings & Rentals (Weight: 10)"]

    classDef t1 fill:#EF4444,stroke:#B91C1C,color:#fff;
    classDef t2 fill:#F97316,stroke:#C2410C,color:#fff;
    classDef t3 fill:#F59E0B,stroke:#D97706,color:#fff;
    classDef t4 fill:#10B981,stroke:#047857,color:#fff;
    classDef t5 fill:#3B82F6,stroke:#1D4ED8,color:#fff;
    classDef t6 fill:#6B7280,stroke:#374151,color:#fff;

    class P1 t1;
    class P2 t2;
    class P3 t3;
    class P4 t4;
    class P5 t5;
    class P6 t6;
```

---

## 👥 Role-Based Access Control (RBAC)

| Role | Default Account | Permissions & Workflow |
| :--- | :--- | :--- |
| **System Admin** | `admin@cit.ac.in`<br/>*(Pass: `admin123`)* | **Unrestricted Commit Authority**: Generates master schedule, approves/rejects all subordinate requests, applies disruptions directly without secondary approval, executes official validator. |
| **Academic Coordinator** | `f1@cit.ac.in`<br/>*(Pass: `faculty123`)* | **Department Operations**: Views department timetable, requests schedule moves, leaves, and venue bookings. Changes are routed to Admin for final commit. |
| **Club Representative** | `robotics@cit.ac.in`<br/>*(Pass: `club123`)* | **Venue Booking**: Submits natural language or WhatsApp booking requests for fest/workshops. Cannot modify academic sessions or approve disruptions. |

---

## 🚀 Quick Start Guide

### Option A: Run via Docker (Recommended)

```bash
# 1. Clone repository
git clone https://github.com/Akshat-sin-official/TZ-Meru-Byte.git
cd TZ-Meru-Byte

# 2. Launch full stack with Docker Compose
docker compose up -d

# 3. Seed canonical dataset
docker exec cit_server npm run seed

# 4. Access the platform
# Web Application: http://localhost:5173 (or https://cit.saubhagyalabs.tech)
# API Gateway:     http://localhost:5000
# Optimizer:       http://localhost:8001
```

### Option B: Local Windows Development via Scripts

All startup scripts are organized inside the [`scripts/`](scripts/) folder:

```cmd
:: Launch all services simultaneously in dedicated terminal windows
scripts\start_all.bat
```

*Individual service launchers:*
- Frontend: `scripts\run_client.bat`
- Backend API: `scripts\run_server.bat`
- Optimizer: `scripts\run_optimizer.bat`

---

## 📂 Documentation and Scripts Directory

All detailed technical specifications, logs, and executable utilities have been organized into dedicated directories:

| Directory / File | Description | Redirect Link |
| :--- | :--- | :--- |
| 🎬 **Presentation Video Script** | Complete word-for-word 5-minute demo script and screen walkthrough | [docs/guides/PRESENTATION_VIDEO_SCRIPT.md](docs/guides/PRESENTATION_VIDEO_SCRIPT.md) |
| 🤖 **AI Usage Declaration** | Mandatory hackathon declaration of AI models, prompts, and tooling | [docs/declarations/AI_USAGE.md](docs/declarations/AI_USAGE.md) |
| 📜 **Third-Party Disclosures** | Open-source libraries, licenses, and external dependencies | [docs/declarations/THIRD_PARTY.md](docs/declarations/THIRD_PARTY.md) |
| 🏗️ **Feature Architecture** | Detailed module breakdown and technical specifications | [docs/architecture/features.md](docs/architecture/features.md) |
| 🔍 **Audit & Verification Log** | Complete checklist of problems analyzed and solved | [docs/audit/PROBLEMS.md](docs/audit/PROBLEMS.md) |
| 👥 **Task Division** | Hackathon engineering division and execution log | [docs/audit/TASK_DIVISION.md](docs/audit/TASK_DIVISION.md) |
| 🛠️ **Internal Scripts** | Launchers, droplet deployment, and test harnesses | [`scripts/`](scripts/) |
| 📦 **Canonical Exports** | Official `schedule.json`, `schedule_after.json`, and reports | [`exports/`](exports/) |

---

<div align="center">
<b>Campora · Chilika Institute of Technology Operations Engine</b><br/>
Crafted with precision by <b>MERUBYTE</b> for Crunch Week 2026.
</div>
