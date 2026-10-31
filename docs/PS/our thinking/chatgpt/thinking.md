Akshat, we're going to approach this as if CIT is our enterprise client and we're building a production-grade campus operations platform.

My first CTO decision: We are NOT building a timetable management website. We are building a constraint-driven scheduling and decision platform.

The distinction matters. A beautiful dashboard with an unreliable scheduling engine will lose this hackathon.

Your biggest opportunity is to build a platform where:

- A deterministic optimization engine makes scheduling decisions.
- AI understands human requests and explains decisions.
- A conflict-resolution engine handles disruptions.
- An approval workflow ensures administrators retain control.
- Every decision is traceable and reproducible.

## 1. Understand what we're actually building

# CIT CampusOS

PROPOSED PRODUCT · CAMPUS OPERATIONS INTELLIGENCE

[Campus Assign — AI-Powered Faculty Scheduling (Demo)](https://images.openai.com/static-rsc-4/VeFjj_T9qoorh3_43CiYBvK7Nd3fORnTv8pKFgHnBhyYpAye4nQJG-0jLTZR-_93D3kFbEBnG1be58apwkP46kuwJtuAzs7ezPe2TfcIqktqXAeVR3MPm_r6PFhXrP6oBUUf4W8bBGDLMafGfX4n_euiu71WxE9BvNFaghi0QDY?purpose=inline)

[lightleapai.com](https://www.lightleapai.com/campusassign?utm_source=chatgpt.com)

One platform. Four operational engines.

Timetable Engine

189 sessions, 27 rooms, 40 faculty.

Venue Engine

25 Spectra requests, priorities, approvals.

Disruption Engine

Minimum-movement rescheduling.

AI Copilot

Natural language, Hinglish, explanations.

The important numbers from the problem statement:

| Component        | Dataset |
| ---------------- | ------- |
| Rooms            | 27      |
| Faculty          | 40      |
| Student groups   | 14      |
| Courses          | 62      |
| Sessions         | 189     |
| Teaching hours   | 243     |
| Midsem exams     | 41      |
| Spectra requests | 25      |

The judging criteria tell us exactly where to invest engineering effort.

| Judging area           | Marks |
| ---------------------- | ----- |
| Scheduling correctness | 25    |
| Rescheduling           | 15    |
| AI                     | 15    |
| Booking decisions      | 10    |
| Optimization           | 10    |
| UI/dashboard           | 10    |
| Code/documentation     | 5     |

My strategic decision: Get scheduling correctness first. It is the foundation for everything else. Then build rescheduling, booking intelligence and AI around that foundation.

## 2. CTO architecture: how we build it

I recommend retaining your familiar MERN ecosystem, with one important addition: Python as the optimization engine.

Do not force scheduling mathematics into Node.js.

## Proposed system architecture

## React + TypeScript

Admin dashboard · Timetable · Booking portal · AI Copilot

## Node.js + Express

REST APIs · Authentication · RBAC · Approvals · Audit logs

MySQL

Master data, schedules, versions, requests

AI service

LLM parsing, clarification, explanations

Python + Google OR-Tools CP-SAT

Critical engine

Timetable generation · Exams · Booking validation · Rescheduling · Optimization

Official validator.py

Independent correctness verification before export

### Why this architecture?

| Technology                | Responsibility                 |
| ------------------------- | ------------------------------ |
| React + Vite + TypeScript | Frontend                       |
| Tailwind + shadcn/ui      | Interface                      |
| Node.js + Express         | Main backend                   |
| MySQL                     | Persistent database            |
| Python + OR-Tools         | Constraint optimization        |
| LLM API                   | Natural language understanding |
| JWT + RBAC                | Four user roles                |

Critical architectural rule: The LLM never decides whether a booking or timetable is valid. It only proposes structured data. Python validates it.

This is explicitly required in the problem statement.

## 3. The most important component: Scheduling Engine

This is where we win or lose.

You have 189 sessions. Each session already has its faculty and student groups. Your job is to allocate:

- Day: Monday–Friday.
- Start period: P1–P9.
- Room: one compatible room.

This is a classic Constraint Satisfaction Problem (CSP).

I would implement it using Google's OR-Tools with CP-SAT.

### A. Hard constraints — absolutely non-negotiable

These must have zero violations.

| Constraint          | Implementation                  |
| ------------------- | ------------------------------- |
| Faculty clash       | No overlapping faculty sessions |
| Group clash         | No overlapping group sessions   |
| Room clash          | No overlapping room sessions    |
| Capacity            | Room capacity ≥ session size    |
| Room type           | Compatible room only            |
| Faculty leave       | Exclude unavailable periods     |
| Room maintenance    | Exclude unavailable periods     |
| Lunch               | No session across P5/P6         |
| Labs                | Three-hour labs only P2 or P6   |
| Accessibility       | Require accessible rooms        |
| Elective basket     | Same day and period             |
| Daily faculty limit | Maximum 4 hours                 |
| Fixed slot          | Must preserve assigned slot     |

### B. How the algorithm works

For every session, generate all possible combinations of:

`Day × Start Period × Compatible Room`

Then eliminate impossible combinations.

For example:

Example: PH191-A-P1

Illustrative allocation process

Duration

3 hours

Required room

Physics laboratory

Valid start periods

P2 or P6

Valid candidate example

MON

P2–P4

PHY-LAB

Other candidates are evaluated against faculty, group, room and availability constraints.

The solver then finds a combination where every session is scheduled exactly once without violating any hard constraint.

### C. Optimization: after correctness

Don't just find a valid timetable. Find a good timetable.

Minimize the soft penalty:

1. Faculty avoid preferences.
2. Student free periods between classes.
3. Groups having more than six teaching hours daily.
4. Duplicate course lectures on the same day.
5. Rooms operating below 40% capacity.
6. Sessions in P9.

Use a weighted objective function.

\\[ \min \sum\_{i=1}^{6} w_i P_i \\]

Where \\(P_i\\) is the penalty associated with a soft constraint and \\(w_i\\) its importance.

My recommendation: First get a feasible schedule. Then optimize it. Never sacrifice hard correctness for soft optimization.

## 4. Midsem examination engine

Don't treat exams as ordinary timetable sessions.

The data model is different:

- 41 exams.
- Monday–Saturday.
- Two slots: AM and PM.
- Each exam may require multiple rooms.
- Effective room capacity is half the normal capacity.

Example:

An exam has 300 students.

If a room has capacity 200, its exam capacity is 100.

You need at least three such rooms, assuming all three are otherwise compatible.

The exam solver should:

1. Allocate an exam slot.
2. Identify eligible rooms.
3. Calculate effective capacity.
4. Allocate multiple rooms if needed.
5. Prevent room and student-group overlaps.
6. Export the exam's room allocation.

Keep this as a separate solver module, but reuse your constraint utilities.

## 5. Spectra booking engine — where creativity matters

This is more than a room booking form. It is a priority-aware resource allocation engine.

The starter pack gives you:

- Original booking text.
- Attendance.
- Requested time windows.
- Duration.
- Room types.
- Required facilities.
- Mandatory student groups.
- Requester role.
- Submission timestamp.
- Cancellation information.

### The booking workflow

1. User submits natural-language request

   "Seminar hall kal shaam 6 baje, 2 ghante, 100 log, mic chahiye."
2. AI extracts structured data

   Attendance: 100, duration: 2, tomorrow, P10–P11, seminar hall, PA system.
3. User reviews and edits

   Display an editable booking form. Never silently assume missing critical details.
4. Deterministic booking engine

   Check room capacity, room type, facilities, maintenance, timetable conflicts and mandatory groups.
5. Priority resolution

   Compare the request against competing requests using effective category and submission time.
6. Decision and explanation

   Approve, reject or offer an alternative. Store the reason and approval status.

### Important: priority is not user-selectable

The official priority is:

1. Exams
2. Regular classes
3. Institute events
4. Guest lectures
5. Department events
6. Club events

There is an important detail in the README: a role has a maximum category it can claim. A club cannot label its request an institute event to jump the queue.

Also:

- Cancelled requests must never be approved.
- Equal-priority requests are decided by earlier submission time.
- Only institute events can displace regular classes.
- An approved request must fit its requested window.
- An alternative can be outside the requested window, but must be marked `alternative_offered`.
- Every rejection and alternative needs a reason.

### My creative product idea: Venue Intelligence

Don't simply show a list of available rooms.

Show the user:

Booking recommendation

Best alternative

# SH-1

Illustrative result, not a live availability claim

120

Capacity

PA System

Facilities

Why this room?

- Meets the requested capacity.
- Has the required facilities.
- Fits the requested time.
- No room conflict.

  The engine should generate these explanations from actual checks, not from an LLM's assumptions.

Add a feature called Why Not This Room?

When someone selects an unavailable room, explain exactly why it cannot be used:

- Capacity insufficient.
- Already booked.
- Maintenance scheduled.
- Required equipment missing.
- Accessibility requirement not met.

This is a strong product-engineering differentiator.

## 6. Disruption engine — your second biggest opportunity

This feature is worth 15 marks.

Imagine:

- Faculty F07 goes on leave Monday.
- Room CR-102 closes for maintenance.
- A new tutorial is added.

A naive system regenerates everything.

Our system should preserve the existing timetable wherever possible.

### How to implement it

Use a two-stage optimization strategy.

Stage 1: Find a valid repaired timetable.

Apply the disruption to a copy of the dataset. Lock unaffected assignments where feasible and solve for a valid timetable.

Stage 2: Minimize changes.

Introduce a movement penalty:

\\[ \min \sum\_{s \in Sessions} I(x_s \neq x_s^{old}) \\]

Here, \\(I\\) is 1 when a session's day, period or room changes, otherwise 0.

In CP-SAT, model this using Boolean change indicators.

You can also use a lexicographic objective:

1. Zero hard violations.
2. Minimum number of moved sessions.
3. Minimum soft penalty.

Do not simply assign arbitrary weights and hope the priorities work.

### The approval workflow

Proposed timetable change

Sessions moved

3

Sessions unchanged

186

Change preview

| Session  | Previous | Proposed |
| -------- | -------- | -------- |
| CS101-L1 | Mon P2   | Tue P2   |
| MA102-T1 | Mon P3   | Wed P3   |
| PH101-L1 | Mon P6   | Thu P6   |

Awaiting Admin approval

Illustrative preview only.

Review

Approve

The actual workflow:

1. Create a new schedule version.
2. Generate the proposed changes.
3. Compare old and new assignments.
4. Run the official validator.
5. Display the differences.
6. Wait for Admin approval.
7. Atomically activate the new version.
8. Preserve the old version for rollback/audit.

Never overwrite the live timetable during optimization.

If no valid repair exists, return an infeasibility explanation. Show which sessions or constraints prevent a solution rather than silently creating a broken timetable.

## 7. AI Copilot — use AI intelligently

I would give the assistant a name: CIT Copilot.

But it must have a very strict responsibility boundary.

| AI can do                    | AI cannot do                     |
| ---------------------------- | -------------------------------- |
| Understand English/Hinglish  | Approve a booking                |
| Extract date and time        | Override priority                |
| Ask clarifying questions     | Ignore room capacity             |
| Suggest a room preference    | Declare a timetable valid        |
| Explain scheduling decisions | Write directly to live schedules |
| Generate a proposed change   | Bypass validation                |

### Architecture of an AI request

```
User prompt
    ↓
LLM interpretation
    ↓
Structured JSON
    ↓
Schema validation
    ↓
User confirmation
    ↓
Python scheduling engine
    ↓
Hard constraint validation
    ↓
Approval workflow
    ↓
Database commit
```

Example prompt:

> Faculty F07 is unavailable Monday. Fix my timetable with minimum changes.

The AI should convert this into a disruption request, not invent a replacement timetable itself.

Creative feature: Explain My Schedule

A faculty member can ask:

> Why am I scheduled at 8 AM on Monday?

Your application should retrieve the actual assignment and its constraints, then generate an explanation using:

- Faculty availability.
- Room availability.
- Fixed sessions.
- Student group clashes.
- Alternative feasible slots.

This feature directly addresses the explainability requirement.

## 8. Database design — MySQL

Don't store the entire application in one JSON column. Normalize the operational data, but retain the original dataset JSON for import/export and reproducibility.

My proposed schema:

| Table                  | Purpose                          |
| ---------------------- | -------------------------------- |
| users                  | Authentication                   |
| roles                  | Four roles                       |
| faculty                | Faculty records                  |
| student_groups         | Student groups                   |
| courses                | Course information               |
| rooms                  | Room metadata                    |
| sessions               | Sessions to schedule             |
| session_groups         | Many-to-many group mapping       |
| room_unavailability    | Maintenance                      |
| faculty_unavailability | Leave                            |
| schedules              | Schedule versions                |
| schedule_assignments   | Session → day, period, room      |
| exams                  | Examination records              |
| exam_room_allocations  | Multiple rooms per exam          |
| booking_requests       | Original and structured requests |
| booking_decisions      | Approve/reject/alternative       |
| change_proposals       | Proposed disruptions             |
| change_diffs           | Before/after changes             |
| approvals              | Approval history                 |
| audit_logs             | Every important operation        |

### One important architectural decision

Use immutable schedule versions.

For example:

- `V1`: Original generated timetable.
- `V2`: Timetable after faculty leave.
- `V3`: Timetable after room maintenance.

Each version references its parent version.

This makes comparison, rollback and auditing straightforward.

## 9. Product interface — what should we actually build?

I would design a professional SaaS dashboard, not a generic college ERP.

## Proposed product screens

[XY Analytics Dashboard | Built with Blink](https://images.openai.com/static-rsc-4/GEBsK6sOuvRxmC8chMm4c7vH3PD5XBhV7fWMLf0CgLxOPey3kiH3QnUsriZ2LaSz_WCZek07drFm7rEsFCXB3CYrRjTdPE01WLYmRTxdXNEKUYEs3YZwT6gOWaGp_crFLrpW4kvUUAeZTyGBH6YaaLoAVLqQpodrQ9-nmPWMHCs?purpose=inline)

01\. Command Center

Conflicts, utilisation, pending approvals, scheduling health.

[Generador de Horarios Gratuito | TrySchedule (Sin Registro)](https://images.openai.com/static-rsc-4/EK7pi9b9DgSF3TpLJHOZpLO73SO2LhVOZ7dvezhYbGt3M6G7BGiQAs9TNGD5-2lAFN1Bv8s4Fm3_BTIr63N-1VazWRJ2JK8iHK_Htj8EDliKFunw0WioSH34tWyUxZ8l3ZjH0n3TUc1nij6xW2WFNwrSedtvoSHavj_9NDlcz1I?purpose=inline)

02\. Timetable Explorer

Group, faculty and room-based timetable views.

[Meeting Room-Booking Dashboard UI by Md. Al Amin on Dribbble](https://images.openai.com/static-rsc-4/T8W9aIjOxo_bMF-CfzVFx6UfQb0zw33_b_4-P8W744cAoksNCjZTIuuktKT-X7gquOuT-PVVeYHk2zImUtL3Go02xPtzrRf8wo8CFmKJIn5TX803RD-L9nuHBPv4Nfi3FqUoS13kKtUc_RwZWd8k6WMe0V8k46oMom5TbbjWUAs?purpose=inline)

03\. Venue Management

Requests, room availability and booking decisions.

[Change approval light \[iTop Documentation\]](https://images.openai.com/static-rsc-4/Fdza6qmm2cmzZwJgzgjB2tvT6aQ-2NO8zfTvlBFWNwphR7Jq3Ma7LJtnVbx14gEBQ0ZFp_1BQEVXPBUqVsDDjQfNzjQmMHRXjENaMfB9sBOcoYHZHu8uKIOdpDCfJT3GAazv6uR3mUU-DE30b7klTnIt5lmi2fR2N8ucl6LXo_k?purpose=inline)

04\. Change Control

Disruption proposals, diffs and approval.

[Copilot & chatGPT & AI in Dashboard by ByeWind on Dribbble](https://images.openai.com/static-rsc-4/c9dC2C3JLX8AIyxt0tDD2ai_68adQNt2gIebrR48hewYqogiIvwaWsSBQbqFOschTzZU0Cy_mY-HDyKZzNri481qR4BJXh35fCeVLobiAYRbmXDYXiHmdPjXiSY1EAUW_3lEQV_cmpDc0cx6XYPzvFEq-zFhHa_Qbs7fiifIHEY?purpose=inline)

05\. CIT Copilot

Natural language requests and explanations.

[SaaS - School Management Dashboard by Design Veli UI/UX for Design Veli  on Dribbble](https://images.openai.com/static-rsc-4/tovCDKryExnZ4z1ABNWT5DpRMIOe95csGqinX8Dl3xM_p55xwbbsRvA8ZjLHqv8oPOXefZu7qxPND9k8YQSTEaJbkaZAW_TCq7F8Rszwy5vxa_1urnbLETauHwgZsbHl6jhh0ubsrJ1upLrG-H4R9WUtBa2JCuMj2tqby7OTzZk?purpose=inline)

06\. Examination Planner

Exam slots, room allocation and capacity.

My design recommendation:

- Deep navy sidebar.
- White/light-grey workspace.
- Indigo or blue primary actions.
- Green for validated/approved.
- Amber for pending.
- Red for conflicts.
- Poppins or Inter typography.
- Dense but readable timetable grids.

## 10. Actual development roadmap — follow this order

This is the order I would enforce as CTO.

## Execution roadmap

1. P0 · FIRST

   Dataset ingestion + optimization engine
   - Read `cit_public.json`.
   - Build Python OR-Tools solver.
   - Generate all 189 assignments.
   - Validate against official validator.
   - Export `schedule.json`.
   Deliverable: zero hard violations.
2. P0

   Examination scheduler
   - Schedule all 41 exams.
   - Allocate multiple rooms.
   - Validate half-capacity rules.
   Deliverable: complete exam schedule.
3. P0

   Disruption engine
   - Parse sample disruption.
   - Repair the timetable.
   - Minimize moved sessions.
   - Export `schedule_after.json`.
   Deliverable: valid repaired schedule with approval.
4. P1

   Spectra booking engine
   - Process all 25 requests.
   - Respect priority and cancellation rules.
   - Generate reasons and alternatives.
   Deliverable: complete booking decisions.
5. P1

   AI integration
   - Natural-language extraction.
   - Hinglish interpretation.
   - Editable structured form.
   - Schedule explanation.
   Deliverable: working CIT Copilot.
6. P2

   Dashboard + RBAC
   - Four demo accounts.
   - Timetable filters.
   - Approval management.
   - Analytics and audit history.
   Deliverable: polished product experience.
7. P2

   Deployment + submission
   - Live deployment.
   - Public GitHub repository.
   - Documentation.
   - Video demonstration.
   - Final validator runs.

## 11. Recommended repository structure

```
cit-campus-os/
│
├── client/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── layouts/
│       ├── hooks/
│       ├── services/
│       └── types/
│
├── server/
│   └── src/
│       ├── modules/
│       │   ├── auth/
│       │   ├── users/
│       │   ├── timetable/
│       │   ├── exams/
│       │   ├── bookings/
│       │   ├── disruptions/
│       │   ├── approvals/
│       │   └── analytics/
│       ├── middleware/
│       └── config/
│
├── optimizer/
│   ├── main.py
│   ├── models.py
│   ├── timetable_solver.py
│   ├── exam_solver.py
│   ├── booking_engine.py
│   ├── disruption_solver.py
│   ├── constraints.py
│   └── validator.py
│
├── data/
│   └── cit_public.json
│
├── exports/
│   ├── schedule.json
│   └── schedule_after.json
│
├── docs/
├── AI_USAGE.md
├── THIRD_PARTY.md
├── README.md
└── .env.example
```

## 12. What I want you to do RIGHT NOW

Before writing React components, establish the optimization engine.

Run:

```
# Create Python environment
cd cit-campus-os

python -m venv .venv

# Windows
.venv\Scripts\activate

# Install solver and API framework
pip install ortools fastapi uvicorn pydantic

# Run your own API
uvicorn main:app --reload --port 8001
```

Keep the official `validator.py` from the starter pack. Do not modify it.

Your first milestone is:

## Milestone 01 — Scheduling correctness

Progress

# 0/7

Import all 189 sessions correctly

Generate a timetable using OR-Tools

Schedule every session exactly once

Achieve zero hard constraint violations

Generate all 41 exams

Export schedule.json

Run official validator successfully

## 13. My CTO rules for this hackathon

1. Never trust an LLM for constraint validation.
2. Never hardcode the generated timetable or booking decisions.
3. Never modify the live timetable before approval.
4. Every generated result must pass the official validator.
5. Every role must have server-side permission checks.
6. Nobody can approve their own request.
7. Keep AI failure independent of manual booking functionality.
8. Build for the judges' unseen datasets and disruption files, not just the public examples.
9. Commit frequently. The repository must be created after the hackathon starts.
10. Keep `AI_USAGE.md` and `THIRD_PARTY.md` accurate.

## 14. Let's work like an actual engineering team

I want to guide you incrementally, not dump 500 lines of code and leave you debugging them.

Our development loop will be:

Architecture → Implementation → Testing → Validation → Next module.

I will challenge your design decisions, identify shortcuts that could cost marks, and help you prioritize engineering trade-offs.

But I need one critical detail before we start assigning implementation tasks:

How many developers are in your hackathon team, including you?

I will divide the architecture into parallel workstreams if you have a team. If you're solo, I'll give you a tightly optimized build sequence.

Our first target: a working, validator-approved scheduling engine. Everything else builds on it.