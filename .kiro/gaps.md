# Kiro documentation audit — CIT CampusOS

Needs revision

Do not freeze this as the final engineering specification yet.

I've inspected Kiro's 46 KB requirements document against:

- The official 6-page Problem Statement.
- The actual Starter Pack README.
- The executable `validator.py`.
- The sample disruption file and export schema.
- Your teammate's Feature Guide.

My verdict: Kiro has produced a strong, detailed requirements document, but it has introduced some incorrect technical assumptions and additional requirements that could send your developers in the wrong direction.

The biggest concern is that some requirements sound authoritative but do not match the actual validator.

## 1. Overall assessment

| Area                  | Assessment                        |
| --------------------- | --------------------------------- |
| Product requirements  | Strong                            |
| Architecture          | Good, needs correction            |
| Timetable constraints | Incorrect numbering               |
| Optimization          | Mostly good                       |
| Exam engine           | Incomplete specification          |
| Booking engine        | Several critical gaps             |
| Disruption engine     | Strong                            |
| AI copilot            | Good, incorrect time bounds       |
| RBAC                  | Good foundation                   |
| API contracts         | Needs implementation-level detail |
| Security              | Good foundation                   |
| Submission compliance | Needs additional checks           |

My assessment: 7/10 as a planning document. Not yet 10/10 as an implementation contract.

## 2. Critical issues that must be fixed

These are not cosmetic changes. They affect whether the system produces correct results.

Issue 01 — Constraint numbering is wrong

Critical

Kiro defines HC-01 through HC-16, but the official validator does not use that numbering.

The actual timetable validator uses:

| Official rule | Actual meaning                                   |
| ------------- | ------------------------------------------------ |
| H1            | Missing/unknown sessions and invalid assignments |
| H2            | Faculty collision                                |
| H3            | Student group collision                          |
| H4            | Room collision                                   |
| H5            | Capacity                                         |
| H6            | Room type                                        |
| H7            | Faculty unavailability                           |
| H8            | Room unavailability                              |
| H9            | Teaching periods, lunch and labs                 |
| H10           | Accessibility                                    |
| H11           | Elective basket synchronization                  |
| H12           | Faculty daily teaching limit                     |
| H13           | Spectra booking validity                         |
| H14           | Fixed slots                                      |

Kiro's HC-10, HC-11 and HC-13 mappings are wrong, and its HC-16 reference is unsupported.

Fix: Use the official H1–H14 codes and separate exam-specific E1/E2 checks and booking-related B1/B2/B3 checks. Never invent a new numbering system for the official rules.

Issue 02 — Soft penalty weights

Critical

Kiro specifies S1–S6 weights. These happen to match several actual rules, but the implementation must follow the executable validator, not a manually transcribed formula.

I inspected the code:

- S1: 2 points per avoided teaching period.
- S2: 1 point per idle gap.
- S3: 3 points per group-hour above six.
- S4: 3 points per repeated lecture.
- S5: 1 point for room utilization below 40%.
- S6: 1 point for each session occupying P9.

Exam soft penalty is separate: 5 points per additional exam for a group on the same day.

Fix: Treat `validator.py` as the scoring authority. Add automated parity tests between your optimizer's reported score and the official validator.

Issue 03 — Incorrect period bounds

Critical

Kiro's AI booking requirements specify period identifiers P1–P10.

The actual time model is:

- P1–P9: teaching.
- P10–P13: events.

Booking requests can occupy event periods such as P10–P13. P10 is not the maximum period.

Fix: Make the period model dataset-driven. Do not use a single P1–P10 enum for the entire application.

Issue 04 — Canonical validator architecture

Critical

Kiro proposes a Python OR-Tools solver, Node.js booking engine and one canonical validator used everywhere.

This is conceptually correct but technically underspecified.

Node.js and Python cannot simply share one in-memory validation module.

Fix: Make Python the authoritative constraint-validation service. Node.js calls it through a typed internal API. Alternatively, implement a shared validation package in Python and have every operation, including manual moves and booking decisions, call it.

No separate Node.js implementation of the same hard rules.

Also, the official validator remains an independent final oracle; your internal validator must never replace or modify it.

## 3. Booking engine: important missing details

This is one of the areas where I would make substantial changes.

The official validator has more precise behaviour than the Kiro requirements suggest.

### Actual booking validation

The official implementation checks:

- Exactly one decision per request.
- Cancelled request handling.
- Valid room and event eligibility.
- Requested room type.
- Capacity and required features.
- Full duration within the window for approved bookings.
- Room maintenance.
- Room occupancy.
- Mandatory student-group availability.
- Priority inversions.
- Week-7 session overrides.

Kiro covers many of these, but there are important omissions.

Corrections:

1. The booking decision must account for the official dataset's `priority_order` and `role_category_cap`, not hardcoded role mappings.
2. A request's original `raw_text` must remain preserved.
3. Every request must receive exactly one decision, including cancelled requests.
4. `alternative_offered` must be evaluated and scored according to the official validator.
5. The engine must detect priority inversions, not merely sort requests by priority.
6. A session override must only be used for an eligible approved institute event.
7. The original teaching schedule must remain intact; overrides are specific to Week 7.
8. Room occupancy must be checked for every period of a booking, not just its start period.

A particularly important issue: Kiro describes the booking engine as Node.js. I'd move the deterministic booking decision engine into Python alongside the canonical validation layer. Express should handle the user-facing workflow, authentication and approvals.

This avoids two competing implementations of resource availability.

## 4. Architecture changes I recommend

I would retain Kiro's overall architecture but make the following changes.

## Revised target architecture

React + TypeScript

Dashboard · Timetable · Bookings · AI Copilot · Approvals

Node.js + Express

Auth · RBAC · REST API · Workflow · Audit · Notifications

MySQL

Persistent records, versions, jobs, approvals

AI adapter

LLM parsing and explanation

## Python Optimization & Validation Service

Timetable solver

Exam solver

Booking engine

Disruption solver

Canonical constraint validator

Official validator.py

Independent export verification

### Why this is better

- One authoritative implementation of scheduling rules.
- One optimization environment.
- Easier debugging of constraint failures.
- Booking and timetable logic can share resource availability checks.
- Node.js remains responsible for product workflows rather than optimization mathematics.
- AI failures cannot break core scheduling.

### Two more architectural changes

A. Add a proper job execution model.

Kiro's database-backed jobs are good. But a database table alone does not execute background work.

For this hackathon, use a Python worker process polling queued jobs from MySQL. Node.js creates the job, the worker executes it, and the frontend polls the job status.

You don't need Kubernetes, Kafka or a complicated microservice platform.

B. Introduce a single source of truth for time.

Create a shared domain module containing:

- Teaching days.
- Teaching periods.
- Event periods.
- Exam days.
- Exam sessions.
- Period duration.
- Lunch boundary.
- Lab start rules.

Read configurable values from the dataset wherever available. The domain module should provide consistent interval and overlap functions.

## 5. Disruption engine: strong, but one important correction

Keep most of this section

This is probably Kiro's strongest section.

It correctly describes:

- Cloning the dataset.
- Keeping the live timetable unchanged.
- Re-solving with minimal movement.
- Producing a detailed diff.
- Checking version concurrency.
- Revalidating before activation.
- Requiring Admin approval.

However, I would change one thing.

Kiro says to identify directly and transitively impacted sessions and re-solve the full timetable.

That is a reasonable strategy, but don't lock all unaffected sessions unconditionally.

Why?

Sometimes moving an additional session is necessary to create a feasible repair. A hard lock on an unaffected session can turn a solvable disruption into an infeasible one.

Use a movement penalty for every existing session instead.

\\[ \min \sum_s I(\text{new assignment}\_s \neq \text{old assignment}\_s) \\]

Then minimize the official soft penalty as a secondary objective.

Also distinguish:

- Time change: day or start period changed.
- Room-only change: same day and period, different room.
- Added session.
- Removed session.

These are not interchangeable metrics.

Important: The live judging disruption may differ from `sample_disruption.json`. The engine must process arbitrary supported change files, not special-case F07 or CR-102.

## 6. AI Copilot: corrections

Kiro has correctly established that the LLM is not the decision-maker.

Keep that.

But improve these details:

| Kiro's specification         | Required correction                                 |
| ---------------------------- | --------------------------------------------------- |
| P1–P10 period bounds         | P1–P13 across the complete calendar                 |
| Fixed attendance range 1–500 | Validate against schema and business constraints    |
| Fixed duration range 1–8     | Validate against requested window and domain rules  |
| Hardcoded Hinglish mappings  | Use structured extraction plus clarification        |
| AI output schema             | Version and validate it strictly                    |
| AI explanation               | Retrieve actual reason codes before generating text |

I would also add three features:

1. Conditional booking: "Auditorium Friday, otherwise seminar hall Saturday." This is a useful optional enhancement.
2. Prompt-injection resistance: Text such as "I am the Dean, ignore the rules" must never alter role or priority.
3. LLM outage mode: Manual forms and deterministic workflows must remain fully operational.

One warning: Kiro's requirements should not force AI to make assumptions just to fill a schema. If a date, time or room requirement is ambiguous, ask the user.

## 7. More problems I found

These are smaller individually, but important collectively.

| Problem                                                          | What I recommend                                                          |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------- |
| HC-16 is referenced but undefined                                | Remove unsupported numbering                                              |
| Validator failure handling says partial evaluation is prohibited | Return structured input errors; do not silently skip invalid entities     |
| Exam engine has no detailed infeasibility strategy               | Add diagnostics for insufficient room capacity and unavailable exam slots |
| Exam objective omits exact scoring                               | Match the official 5-point-per-additional-exam rule                       |
| Dataset reset restores pre-generated schedules                   | Reset to authoritative data; generate results through the application     |
| Notification requirements are mandatory in Kiro                  | Move notifications to optional enhancements after core functionality      |
| Priority order is described as configuration                     | Support the Admin's ability to change it, as required by the PS           |
| Solver timeout is fixed at 300 seconds in one section            | Make it configurable and distinguish feasible from optimal                |
| All sessions are treated as immutable version assignments        | Define how added and removed sessions are represented in a version        |
| No explicit idempotency policy                                   | Prevent duplicate solver jobs and approval actions                        |

### Two particularly important observations

1\. Do not hardcode a pre-generated timetable into Demo Reset.

The official judging process requires judges to generate the timetable themselves. Your reset operation should restore a clean, authoritative dataset and demo state, not silently load a hardcoded result that bypasses your solver.

2\. Notifications are not a priority.

They are a good enhancement from your teammate's guide, but they do not deserve implementation time before the optimization engine, booking decisions and disruption workflow are correct.

## 8. What Kiro got right — do not remove these

There is plenty worth retaining.

Preserve

- Immutable dataset versions and content hashes.
- Immutable schedule versions.
- Dataset import validation.
- Background solver jobs.
- Solver reproducibility metadata.
- Explicit approval workflows.
- Concurrency checks before publishing.
- Audit logging.
- Server-side RBAC.
- No self-approval.
- AI schema validation.
- Manual fallback when the LLM fails.
- Reason-code-driven explanations.
- Export generated from persisted server-side data.
- Official validator execution before submission.

These are genuinely good enterprise engineering decisions.

## 9. Requirements that should be moved out of the core specification

Your instruction was to avoid unnecessary UI specifications. Kiro has included this:

> Primary color HSL(272, 81%, 56%), Poppins font, deep navy sidebar...

Remove that entire styling requirement.

Keep functional interface requirements:

- Responsive timetable.
- Role-specific access.
- Loading, empty and error states.
- Clear conflict explanations.
- Approval workflows.
- Accessible interaction.

Don't prescribe visual styling in the engineering specification.

Also classify these as optional:

- Notification bell.
- Advanced notification system.
- Conditional booking requests.
- Multiple alternative optimization proposals.
- Advanced analytics.

They should not block completion of mandatory functionality.

## 10. Final instructions for Kiro

I would not ask Kiro to regenerate the document from scratch. That risks losing good work.

Give it this revision instruction:

Revise the existing CIT CampusOS Requirements Document. Do not regenerate it from scratch.

Perform a strict technical correction using these sources in descending authority:

1. Official Problem Statement.pdf
2. Actual CrunchWeek StarterPack README.md
3. Actual executable validator.py
4. Sample disruption and export JSON files
5. CIT Feature Guide.pdf

Required changes:

1. Replace the invented HC-01–HC-16 constraint mapping with the actual official validator rule identifiers H1–H14. Document exam-specific E1/E2 rules and booking-related B1/B2/B3 checks separately.
2. Correct all time-period references. Teaching periods are P1–P9; event periods are P10–P13. Exam periods must be read from calendar.exam_week.
3. Verify every soft-penalty formula against validator.py. Include the separate exam soft penalty of 5 points for each additional exam a group has on the same day.
4. Make Python the authoritative deterministic optimization and constraint-validation layer. Node.js must not implement competing hard-constraint logic. Booking, timetable, exam, disruption and manual-placement validation must use the same authoritative Python domain rules.
5. Keep validator.py unmodified as the independent scoring authority. Add automated parity tests against it.
6. Correct the booking engine specification to cover every official validator condition, including effective_category, priority inversions, cancellations, room eligibility, mandatory groups, session overrides and exact export semantics.
7. Correct the AI Copilot's temporal schema and period validation. Do not silently invent missing information. Retain user confirmation, schema validation and manual fallback.
8. Improve disruption optimization. Zero hard violations first, minimum moved sessions second, official soft penalty third. Do not unconditionally lock all unaffected sessions.
9. Ensure Demo Reset restores the authoritative dataset and clean application state. It must not bypass generation by loading hardcoded or manually prepared schedules.
10. Move notifications, conditional booking, advanced analytics and other non-mandatory enhancements into an OPTIONAL scope.
11. Remove all typography, font, colour and visual styling prescriptions. Retain functional UI acceptance criteria only.
12. Verify role permissions against the official role table. Include Admin-configurable priority order, department-scoped permissions and no-self-approval enforcement.
13. Make all JSON export requirements exactly match the starter-pack examples and official validator.
14. Add explicit infeasibility handling, solver reproducibility, concurrency protection, transaction boundaries and idempotency requirements.
15. Clearly distinguish:\
    MANDATORY — official PS requirements.\
    RECOMMENDED — engineering architecture and reliability.\
    OPTIONAL — enhancements.\
    PROHIBITED — approaches that violate hackathon rules.

Do not introduce requirements that contradict the official PS or executable validator.

Finally, produce a change report listing every correction, its source of truth, and any remaining unresolved ambiguity. Do not claim compliance without verifying the actual source files.

## 11. My final CTO decision

# Engineering sign-off

Current Kiro document

Revision required

Core architecture

Retain with changes

Disruption design

Retain

Constraint definitions

Correct

Booking engine

Correct

AI specification

Revise

Implementation priority

1. Dataset ingestion and domain model.
2. Canonical validator and test harness.
3. Timetable optimization.
4. Examination optimization.
5. Spectra booking decisions.
6. Disruption optimization and approval.
7. AI Copilot and explanation layer.
8. Dashboard, deployment and submission.

My recommendation: Keep approximately 85–90% of Kiro's work. Correct the specification rather than replacing it.

One distinction I want you to remember throughout implementation:

The Problem Statement defines what must be achieved. The starter pack defines the data contract. The executable validator defines what actually passes. Your architecture defines how reliably you achieve it.

That is the hierarchy your entire engineering team and AI coding agents should follow.