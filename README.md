<div align="center">

<img src="client/public/logo.png" alt="CAMPORA logo" width="120" />

# CAMPORA
### by MERUBYTE
**Autonomous Campus Scheduling, Disruption Recovery & Venue Orchestration Platform**  
*Chilika Institute of Technology (CIT) · Tech Zephyr 4 Hackathon*

[![Production](https://img.shields.io/badge/Production-cit.saubhagyalabs.tech-0f172a?style=flat-square&logo=google-cloud&logoColor=white)](https://cit.saubhagyalabs.tech/)
[![Validator Status](https://img.shields.io/badge/Official%20Validator-0%20Hard%20Violations-059669?style=flat-square&logo=checkmarx&logoColor=white)](https://cit.saubhagyalabs.tech/api/exports/verify)
[![Soft Penalty](https://img.shields.io/badge/Soft%20Penalty-274%20Optimized-2563eb?style=flat-square)](https://cit.saubhagyalabs.tech/api/exports/verify)
[![Disruption Recovery](https://img.shields.io/badge/Disruption%20Shift-11%20Sessions%20Moved-4f46e5?style=flat-square)](https://cit.saubhagyalabs.tech/api/exports/schedule_after.json)
[![Gateway](https://img.shields.io/badge/Gateway-Evolution--Go-10b981?style=flat-square&logo=whatsapp&logoColor=white)](https://wa.me/917985013913)
[![Orchestration](https://img.shields.io/badge/Orchestrations-n8n%20Cloud-ea580c?style=flat-square&logo=n8n&logoColor=white)](https://techzephyr.app.n8n.cloud)
[![AI Engine](https://img.shields.io/badge/Copilot-Gemini%202.5-7c3aed?style=flat-square&logo=google-gemini&logoColor=white)](docs/architecture/features.md)

[Live Platform](https://cit.saubhagyalabs.tech/) · [Demo Walkthrough Script](docs/guides/PRESENTATION_VIDEO_SCRIPT.md) · [AI Declaration](docs/declarations/AI_USAGE.md) · [Third-Party Disclosures](docs/declarations/THIRD_PARTY.md) · [Documentation Index](#documentation-and-scripts-directory)

</div>

---

## Executive Overview

CAMPORA resolves complex university scheduling and resource allocation challenges for Chilika Institute of Technology during Week 7 (Crunch Week). It pairs **Google OR-Tools CP-SAT discrete optimization** with a **Gemini-powered Natural Language Copilot** integrated across web and **Evolution-Go WhatsApp** channels.

> **Design Axiom:** *AI models interpret intent and explain decisions; deterministic constraint solvers govern every schedule and booking commit.*

```mermaid
graph LR
    subgraph Intake["1. Inbound Requests"]
        I1["Web Application"]
        I2["Evolution-Go WhatsApp (+91 7985013913)"]
        I3["Disruption Events (JSON)"]
    end

    subgraph Core["2. Orchestration & Solving Engine"]
        C1["n8n & Gemini AI Parser"]
        C2["CP-SAT Timetable Solver (H1–H10)"]
        C3["CP-SAT Stability Engine (Minimal Moves)"]
        C4["6-Tier Priority Adjudicator"]
    end

    subgraph Operations["3. Operational Governance"]
        O1["Clash-Free Master Timetable"]
        O2["50% Cap Midsem Exam Seating"]
        O3["Admin Direct Commit / Subordinate Routing"]
        O4["Canonical schedule.json Export"]
    end

    I1 --> C1 & C2
    I2 --> C1
    I3 --> C3
    C1 --> C2 & C4
    C2 --> O1 & O2
    C3 --> O3
    C4 --> O1
    O1 --> O4
    O3 --> O1

    classDef darkBox fill:#1e293b,stroke:#334155,color:#f8fafc;
    classDef blueBox fill:#1e3a8a,stroke:#2563eb,color:#f8fafc;
    classDef emeraldBox fill:#064e3b,stroke:#059669,color:#f8fafc;
    class I1,I2,I3 darkBox;
    class C1,C2,C3,C4 blueBox;
    class O1,O2,O3,O4 emeraldBox;
```

---

## Canonical Benchmark Verification

Results validated directly against the official `validator.py` on the canonical `cit-public-v1` dataset:

| Criterion | Target Metric | Campora Evaluated Result | Outcome |
| :--- | :---: | :---: | :---: |
| **Hard Constraint Violations (H1–H10)** | `0` | **0** | Verified |
| **Weekly Regular Teaching Sessions** | `189` | **189 / 189 (100%)** | Verified |
| **Weekly Scheduled Teaching Hours** | `243` | **243 Hours** | Verified |
| **Soft Penalty Score (S1–S6)** | Minimized | **274** *(S1:0, S2:49, S3:60, S4:165, S5:0, S6:0)* | Verified |
| **Spectra Week Bookings Adjudicated** | `25` | **25 / 25 Evaluated** (Score: 66.0 / 70.0) | Verified |
| **Midsem Course Examinations** | `41` | **41 Scheduled** (50% Room Anti-Cheating Split) | Verified |
| **Disruption Recovery (Sample Disruption)** | Minimal Moves | **11 Sessions Moved** (2 time, 9 room-only) | Verified |
| **Disruption Solve Latency** | Instant Response | **0.07 Seconds** *(Warm-Start CP-SAT)* | Verified |
| **Timetable Generation Latency** | Instant Response | **0.11 Seconds** *(Warm-Start CP-SAT)* | Verified |

---

## System Architecture

```mermaid
flowchart TD
    subgraph UI["Frontend Presentation Layer (React 18, Vite, Tailwind CSS)"]
        direction TB
        V1["Multi-Perspective Timetable Grid (Cohort / Faculty / Room)"]
        V2["Spectra Priority Adjudicator & Explainability Modals"]
        V3["Disruption Stability Diff & Commit Controls"]
        V4["Interactive AI Assistant & Natural Language Booking Cards"]
    end

    subgraph API["Backend API Gateway (Node.js, Express, Prisma ORM)"]
        direction TB
        A1["JWT Auth & Role-Based Access Control (RBAC)"]
        A2["Approval Workflow & Delegation Controller"]
        A3["Evolution-Go Inbound Webhook Listener"]
        A4["Official schedule.json Exporter & Validator Runner"]
    end

    subgraph Solver["Discrete Optimization Microservice (Python FastAPI, OR-Tools)"]
        direction TB
        S1["timetable_solver.py: Regular Weekly Scheduling (H1-H10)"]
        S2["disruption_solver.py: Minimal-Shift Stability Optimizer"]
        S3["exam_solver.py: Synchronized 50% Capacity Split Seating"]
        S4["canonical_validator.py: Deterministic Ground-Truth Verifier"]
    end

    subgraph Integrations["Integration & Auxiliary Services"]
        direction TB
        W1["Evolution-Go Gateway (:8080, WhatsApp Protocol Engine)"]
        W2["n8n Cloud Workflows (Gemini 2.5 Structured NLP Pipelines)"]
        W3[("MySQL 8.0 Primary Relational Database")]
    end

    UI <-->|REST API + Bearer Token| API
    API <-->|Internal HTTP /:8001| Solver
    API <-->|Prisma Client| W3
    API <-->|Inbound / Outbound Webhooks| W1
    API <-->|Agentic Webhook Triggers| W2

    classDef surface fill:#0f172a,stroke:#334155,color:#cbd5e1;
    classDef nodeBox fill:#1e293b,stroke:#475569,color:#f8fafc;
    class UI,API,Solver,Integrations surface;
    class V1,V2,V3,V4,A1,A2,A3,A4,S1,S2,S3,S4,W1,W2,W3 nodeBox;
```

---

## WhatsApp & n8n AI Workflows

CAMPORA pairs the high-performance **Evolution-Go Gateway** with **n8n Cloud Workflows** to handle unstructured natural language requests in English and Hinglish.

```mermaid
sequenceDiagram
    autonumber
    actor User as Campus Member (Student / Faculty)
    participant Evo as Evolution-Go Gateway (:8080)
    participant Server as Campora API Gateway (:5000)
    participant N8N as n8n Cloud (Gemini 2.5)
    participant Solver as CP-SAT Engine (:8001)

    User->>Evo: WhatsApp message ("Mujhe kal Seminar Hall chahiye 2 ghante ke liye, 900 log aayenge")
    Evo->>Server: Inbound Webhook Event (RemoteJID, Text)
    Server->>N8N: Trigger WF01 Booking Intake Webhook
    N8N-->>Server: Extracted Entity JSON (Venue: Auditorium, 900 pax, 2 hrs, Needs: AV)
    Server->>Solver: Validate Capacity & Overlap Constraints
    Solver-->>Server: Feasibility: Feasible (Upgraded to Auditorium)
    Server->>Evo: Dispatch Confirmation Draft ("Reply YES to submit")
    Evo->>User: Formatted WhatsApp Message
    User->>Evo: Reply "YES"
    Evo->>Server: Confirm Draft & Commit to Campora DB
    Server->>Evo: Dispatch Notification ("Booking Request BR-xx Staged")
```

### WF01 — AI Booking Intake Pipeline
Accepts free-form English, Hindi, and Hinglish venue requests, extracts required attendees, timings, and technical equipment, and auto-upgrades venue tiers when capacity thresholds are exceeded.

![WF01 - AI Booking Intake](docs/N8N/WF01_CIT_AI_BOOKING_INTAKE.png)

### WF02 — AI Schedule Change & Disruption Processing
Parses faculty leave notices and room maintenance windows, structuring disruption payloads for the CP-SAT stability solver while preserving untouched sessions.

![WF02 - AI Schedule Change](docs/N8N/WF02_CIT_AI_SCHEDULE_CHANGE.png)

### WF03 — Decision Explainer & Transparent Reasoning
Generates human-readable, auditable mathematical justifications for approved, alternative, or rejected requests based on constraint telemetry and priority ranking.

![WF03 - Decision Explainer](docs/N8N/WF03_CIT_AI_DECISION_EXPLAINER.png)

---

## Operational Workflows

### 1. Approval Governance & Separation of Duties
*Admins commit changes directly; academic coordinators and student clubs submit drafts that route to their managers for review.*

```mermaid
flowchart TD
    Req["Request Initiated<br/>(Schedule Move / Disruption / Venue Booking)"] --> CheckRole{"Requester Role?"}
    
    CheckRole -- "Admin" --> DirectCommit["Auto-Run Constraint Check<br/>& Commit Directly to Live Database"]
    DirectCommit --> NotifyAll["Broadcast Live Timetable Update Notification"]

    CheckRole -- "Subordinate (Faculty / Club)" --> RouteMgr["Stage in 'pending_approval'<br/>Generate Diff Audit Preview"]
    RouteMgr --> AlertMgr["Dispatch Notification to Operations Manager / Admin"]
    AlertMgr --> Review{"Manager Review Decision"}
    Review -- "Approved" --> CommitSub["Commit Repaired Schedule to Live Database"]
    Review -- "Rejected / Alt" --> Explainer["Gemini Explainer Generates Reason & Notifies Subordinate"]
```

---

### 2. Disruption Recovery (Minimal-Movement Stability)
*Preserves campus stability by penalizing session rescheduling.*

```mermaid
flowchart TD
    Evt["Disruption Event Injected<br/>(e.g., F07 absent Mon, CR-102 closed)"] --> Load["Load Baseline Active Schedule (Version N)"]
    Load --> Constraints["Apply Strict Hard Constraints (H1, H2, H3, H4, H11, H12)"]
    Constraints --> WarmStart["Inject Warm-Start Variable Hints from Baseline"]
    WarmStart --> Minimize["CP-SAT Minimize Stability Function:<br/>Cost = 100 × (Time Changed) + 10 × (Room Only Changed)"]
    Minimize --> Solve{"Feasible Solution?"}
    Solve -- "Yes" --> Diff["Compute Minimal-Shift Diff Table<br/>(11 moved: 2 time shifts, 9 room reallocations)"]
    Solve -- "No" --> Infeas["Identify and Report Conflicting Constraints"]
    Diff --> AdminAction["Admin Reviews Diff on /disruptions"]
    AdminAction --> FinalCommit["Click 'Commit Timetable Changes' (Version N+1)"]
```

---

### 3. Spectra Week 6-Tier Priority Adjudication
*Deterministic hierarchy enforced during festival congestion.*

```mermaid
graph TD
    T1["Tier 1: Academic Midsem Examinations (Weight: 100)"]
    T2["Tier 2: Department Academic Events & Colloquia (Weight: 80)"]
    T3["Tier 3: Student Fest Flagship Programs (Weight: 60)"]
    T4["Tier 4: Registered Student Club Activities (Weight: 40)"]
    T5["Tier 5: Informal Study Sessions & Ad-hoc Gatherings (Weight: 20)"]
    T6["Tier 6: External Bookings & Commercial Rentals (Weight: 10)"]

    T1 --> T2 --> T3 --> T4 --> T5 --> T6

    classDef t1 fill:#7f1d1d,stroke:#b91c1c,color:#fef2f2;
    classDef t2 fill:#7c2d12,stroke:#c2410c,color:#fff7ed;
    classDef t3 fill:#78350f,stroke:#d97706,color:#fffbeb;
    classDef t4 fill:#064e3b,stroke:#047857,color:#ecfdf5;
    classDef t5 fill:#1e3a8a,stroke:#1d4ed8,color:#eff6ff;
    classDef t6 fill:#1f2937,stroke:#374151,color:#f9fafb;

    class T1 t1;
    class T2 t2;
    class T3 t3;
    class T4 t4;
    class T5 t5;
    class T6 t6;
```

---

## Role-Based Access Control (RBAC) Matrix

| Platform Role | Demo Credentials | Operational Scope |
| :--- | :--- | :--- |
| **System Admin** | `admin@cit.ac.in`<br/>Password: `admin123` | **Direct Commit Authority:** Master schedule generation, disruption repair execution, override approvals, official validator execution. Changes commit without intermediary approval. |
| **Academic Coordinator** | `f1@cit.ac.in`<br/>Password: `faculty123` | **Department Scope:** Timetable and room inspection, leave requests, session movement submissions. Requests route to Admin. |
| **Club Representative** | `robotics@cit.ac.in`<br/>Password: `club123` | **Event Booking Scope:** Venue booking submissions via Web UI or Evolution-Go WhatsApp. Strictly isolated from academic modification permissions. |

---

## Setup & Deployment Guide

### Option 1: Docker Compose (Production & Staging)

```bash
# 1. Clone repository
git clone https://github.com/Akshat-sin-official/TZ-Meru-Byte.git
cd TZ-Meru-Byte

# 2. Launch container stack
docker compose up -d

# 3. Seed canonical dataset
docker exec cit_server npm run seed

# 4. Access live endpoints
# UI:          http://localhost:5173
# API Gateway: http://localhost:5000
# Optimizer:   http://localhost:8001
```

### Option 2: Local Windows Development via Internal Scripts

All launcher scripts are centrally located in [`scripts/`](scripts/):

```cmd
:: Launch all platform microservices simultaneously
scripts\start_all.bat
```

*Individual service scripts:*
- UI Server: `scripts\run_client.bat`
- Node.js API: `scripts\run_server.bat`
- Python Optimizer: `scripts\run_optimizer.bat`

---

## Documentation and Scripts Directory

Technical specifications, declarations, and testing scripts are organized into dedicated directories:

| Resource | Description | Redirect Link |
| :--- | :--- | :--- |
| **Presentation Video Script** | Word-for-word 5-minute recording script and demonstration walkthrough | [docs/guides/PRESENTATION_VIDEO_SCRIPT.md](docs/guides/PRESENTATION_VIDEO_SCRIPT.md) |
| **AI Usage Declaration** | Mandatory hackathon AI disclosures and model declarations | [docs/declarations/AI_USAGE.md](docs/declarations/AI_USAGE.md) |
| **Third-Party Disclosures** | Open-source libraries, frameworks, and licensing declarations | [docs/declarations/THIRD_PARTY.md](docs/declarations/THIRD_PARTY.md) |
| **System Feature Architecture** | In-depth engineering specifications for every Campora engine module | [docs/architecture/features.md](docs/architecture/features.md) |
| **Audit & Verification Log** | Problems analyzed, corrected, and verified across testing phases | [docs/audit/PROBLEMS.md](docs/audit/PROBLEMS.md) |
| **Hackathon Task Division** | Team engineering split and delivery verification log | [docs/audit/TASK_DIVISION.md](docs/audit/TASK_DIVISION.md) |
| **n8n Workflow Specifications** | Webhook contracts, payload structures, and workflow architecture | [docs/N8N/n8n.md](docs/N8N/n8n.md) |
| **Internal Scripts** | Launchers, droplet deployment tools, and latency benchmarks | [`scripts/`](scripts/) |
| **Canonical Exports** | Verified `schedule.json`, `schedule_after.json`, and validator reports | [`exports/`](exports/) |

---

<div align="center">
<b>Campora · Chilika Institute of Technology Operations Engine</b><br/>
Engineered by <b>MERUBYTE</b> for Tech Zephyr 4.
</div>
