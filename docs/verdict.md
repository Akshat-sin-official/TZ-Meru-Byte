# CAMPORA (CIT CampusOS) — Engineering and Hackathon Evaluation

Strong product scope

Critical correctness gaps to verify

I reviewed your feature directory against the Problem Statement, the Feature Guide and the official starter-pack requirements.

My overall verdict: CAMPORA has the foundations of a serious campus operations platform. The architecture is sensible, the feature breadth is impressive, and the disruption engine, AI copilot, WhatsApp interface and audit workflows give it more potential than a conventional timetable application.

But there is one major concern: some of the constraints and operating rules in your feature directory do not match the official specification. That matters more than adding another ten features. A polished application that generates a timetable the official validator rejects can lose heavily on the most important part of the challenge.

I would separate the evaluation into three questions:

1. Does the product cover the required functionality?
2. Does the implementation actually follow the dataset and official validator?
3. What additions would make it memorable to judges without compromising correctness?

## 1. Overall scorecard

These scores assess the feature directory and its stated compliance, not independently verified runtime performance. I have not run your application, solver or validator, so claims such as zero violations and sub-three-second generation still need test evidence.

| Area                                | Assessment                                                                    | Score  |
| ----------------------------------- | ----------------------------------------------------------------------------- | ------ |
| Architecture and technology choices | Good separation of web, workflow, database and optimization services          | 8.5/10 |
| Timetable scheduling correctness    | Major discrepancies in documented hard constraints and time model             | 3/10   |
| Timetable user experience           | Useful filtering, views and interactive movement                              | 7/10   |
| Faculty availability workflow       | Good self-service and approval concept                                        | 8/10   |
| Disruption recovery                 | Strong concept; incomplete change coverage and approval ambiguity             | 6.5/10 |
| Midsem examination scheduling       | Good starting point; important allocation rules are missing                   | 5/10   |
| Spectra venue booking               | Priority logic exists, but full validator-rule coverage is not demonstrated   | 5.5/10 |
| RBAC                                | Four personas and data scoping exist; operational permissions need completion | 6.5/10 |
| AI copilot                          | Good deterministic/LLM separation in principle                                | 8/10   |
| WhatsApp integration                | Differentiating feature; production-readiness is unverified                   | 6.5/10 |
| Notifications and audit             | Useful foundation; completeness and immutability need proof                   | 7/10   |
| Data import, export and evaluation  | Major missing items in the feature directory                                  | 4/10   |
| Reporting and PDF exports           | Useful additional capability                                                  | 8/10   |

My assessment: approximately 6.3/10 for specification coverage as documented, with considerably more potential in the product itself.

The biggest opportunity is to convert the broad feature set into a demonstrably correct, validator-compliant platform.

## 2. Requirement-by-requirement PS coverage

Here is how your current feature directory maps to the ten main requirements in PS §2.

| PS requirement                                                       | Coverage           | My assessment                                                                                    |
| -------------------------------------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------ |
| 1. Generate weekly timetable without clashes                         | 🔶 Partial         | Solver exists, but documented constraints and period model are incorrect                         |
| 2. Schedule midsem exams                                             | 🔶 Partial         | Exam solver exists; room allocation and capacity rules are not sufficiently specified            |
| 3. Plain English/Hinglish venue requests, editable before submission | 🔶 Partial         | Copilot and WhatsApp draft flow exist; explicit edit-before-submit flow needs proof              |
| 4. Approve/reject/offer alternatives with reasons                    | 🔶 Partial         | Priority engine and explanations exist; full booking validation is not demonstrated              |
| 5. Disruption handling with minimal movement and Admin approval      | 🔶 Partial         | Good recovery workflow, but missing change types and conflicting activation language             |
| 6. Timetables, approvals, conflicts and utilisation                  | ✅/🔶               | Views and analytics are present; completeness of role-specific dashboards needs checking         |
| 7. Faculty AI assistant for schedule changes                         | ✅/🔶               | AI assistant exists; ensure structured requests go through deterministic validation and approval |
| 8. Explain scheduling decisions                                      | ✅/🔶               | Copilot claims decision explanations; explanations must come from actual constraint evaluations  |
| 9. Admin dataset import and `schedule.json` export                   | ❌ Not demonstrated | One of the most important gaps in the directory                                                  |
| 10. Manual scheduling of events by authorised roles                  | 🔶 Partial         | Slot movement is covered; authorised event booking, scopes and server-side validation need proof |

The official PS explicitly requires dataset loading, change-file handling and the `schedule.json` export. A PDF export is useful, but it does not replace this required machine-readable export.&#x20;

Problem statement.pdf



## 3. Critical issue: your timetable constraints do not match the official specification

This is the first thing I would fix.

Your document defines H1–H10 as its own set of hard constraints. Unfortunately, those labels and several of their rules do not match the official validator.

For example, you have:

- H6: Student daily workload maximum of six hours.
- H7: Maximum two consecutive hours.
- H8: Lunch during Period 4.
- H9: Departmental room affinity.
- H10: Weekly faculty workload cap.

These should not be represented as official hard constraints.

### The correct time model

Official teaching week: Monday–Friday

# 9

Teaching periods

# 1 hr

Per period

# 4

Event periods

| Period  | Time                     |
| ------- | ------------------------ |
| P1–P5   | 08:00–13:00              |
| Lunch   | 13:00–14:00              |
| P6–P9   | 14:00–18:00              |
| P10–P13 | 18:00–22:00, events only |

P1 starts at 08:00, P5 is 12:00–13:00, and P9 is 17:00–18:00.

Your feature directory currently says the timetable operates across eight daily periods and identifies Period 4 as lunch. Both are wrong.&#x20;

Problem statement.pdf



### Correct hard-constraint coverage

The official validator has 14 hard-constraint groups. Your feature directory does not document them faithfully.

| Official rule | What CAMPORA must enforce                                                     | Current documentation                       |
| ------------- | ----------------------------------------------------------------------------- | ------------------------------------------- |
| H1            | Every required session is scheduled exactly once; valid session, day and room | Not clearly stated                          |
| H2            | No faculty member teaches overlapping sessions                                | Covered                                     |
| H3            | No student group has overlapping sessions                                     | Covered                                     |
| H4            | No room has overlapping allocations                                           | Covered                                     |
| H5            | Sufficient room capacity                                                      | Covered, but exam capacity is separate      |
| H6            | Required room type matches assigned room                                      | Missing from listed hard constraints        |
| H7            | Faculty unavailability respected                                              | Partially covered                           |
| H8            | Room unavailability respected                                                 | Partially covered                           |
| H9            | Valid periods, no lunch crossing, three-hour labs start at P2 or P6           | Incorrect time model                        |
| H10           | Accessibility requirement respected                                           | Missing                                     |
| H11           | Sessions in an elective basket share day and start period                     | Missing                                     |
| H12           | Faculty daily teaching-hour limit respected                                   | Your weekly limit is not the specified rule |
| H13           | Spectra booking constraints respected                                         | Not fully demonstrated                      |
| H14           | Fixed-slot sessions remain at their assigned slots                            | Missing                                     |

The official constraints also include soft penalties. These are not interchangeable with hard constraints:

| Soft rule                                            | Correct treatment      |
| ---------------------------------------------------- | ---------------------- |
| Faculty time preferences                             | Minimize violations    |
| Student group idle gaps                              | Minimize               |
| More than six hours for a group in a day             | Penalize, not prohibit |
| Repeated lectures of the same course for a group/day | Penalize               |
| Room utilization below 40%                           | Penalize               |
| Scheduling a session in P9                           | Penalize               |

Your current H6 incorrectly makes the six-hour student workload a hard limit. Your H7, departmental room affinity and weekly faculty cap are not official hard constraints either.

Why this is important: a solver can report zero violations against its own rules and still fail the official validator. The official `validator.py` must be your independent acceptance authority, not just the validator implemented inside CAMPORA.

Problem statement.pdf

## 4. Dataset compliance audit

The dataset is not just sample content. It defines the actual entities, resource constraints, booking requests, time model and disruptions your application must support.

Your feature directory reports the correct baseline counts:

| Dataset entity           | Official count | CAMPORA                 |
| ------------------------ | -------------- | ----------------------- |
| Rooms                    | 27             | 27                      |
| Faculty                  | 40             | 40                      |
| Student groups           | 14             | 14 cohorts              |
| Courses                  | 62             | 62                      |
| Teaching sessions        | 189            | 189                     |
| Teaching hours/week      | 243            | Not explicitly reported |
| Midsem exams             | 41             | 41                      |
| Spectra booking requests | 25             | 25                      |

That is a good start. But supporting the record counts is not the same as supporting the full dataset schema.

### A. Weekly timetable

Your solver needs to process the actual dataset fields and constraints, including:

- Session duration, faculty, student groups and required room types.
- Room capacity, features, accessibility and permitted uses.
- Faculty availability, preferences and daily hour limits.
- Room maintenance and unavailability periods.
- Elective basket relationships.
- Fixed-slot sessions.
- Multi-period sessions, including three-hour labs.

The specific lab rule is important: three-hour labs may only start at P2 or P6. A session also cannot cross the lunch break.

Your current feature list mentions multi-period contiguity, but that alone does not prove all these rules are implemented.

### B. Midsem examination scheduling

The exam section is currently under-specified.

The official dataset/README rules require the exam engine to account for:

| Requirement             | Expected behaviour                                      |
| ----------------------- | ------------------------------------------------------- |
| Exam calendar           | Use configured exam days, Monday–Saturday               |
| Exam sessions           | AM: 09:30–11:30; PM: 14:00–16:00                        |
| Room eligibility        | Only rooms permitted for exams                          |
| Room capacity           | Count half of each room's capacity                      |
| Multiple rooms          | Allow multiple rooms for one exam when required         |
| Room collision          | No room can host two exams in the same session          |
| Student group collision | No student group can have two exams in the same session |
| Daily exam load         | Minimize multiple exams for a group on the same day     |

Your feature directory says that you enforce room seating capacity, avoid multi-exam clashes and mandatory revision gaps.

The problem is that it does not explicitly confirm the half-capacity calculation, multiple-room allocation or exam-room collision rules. Mandatory revision gaps are also not an official hard constraint. The official exam soft penalty discourages multiple exams for a student group on the same day.

Recommendation: implement the actual exam constraints first. Show revision-gap or workload analysis as an optional planning metric, not an invented hard rule.

Problem statement.pdf

### C. Spectra venue booking

This is another major area where the feature directory needs more detail.

Your document covers priority order, venue capacity and explanations. However, a correct booking engine must also process every request against the following conditions:

| Booking condition  | Required                                                                                 |
| ------------------ | ---------------------------------------------------------------------------------------- |
| Request priority   | Exam → regular session → institute event → guest lecture → department event → club event |
| Role category cap  | Enforce the dataset's `role_category_cap`                                                |
| Room capacity      | Must accommodate requested attendance                                                    |
| Room type          | Must match a requested type                                                              |
| Room usage         | Room must permit events                                                                  |
| Required features  | All requested features must be available                                                 |
| Accessibility      | Must be satisfied when requested                                                         |
| Room maintenance   | Booking cannot overlap unavailable periods                                               |
| Existing classes   | Booking cannot occupy a room during a class                                              |
| Existing bookings  | Cannot overlap approved bookings in the same room                                        |
| Mandatory groups   | Their scheduled classes cannot overlap the booking                                       |
| Requested windows  | Try valid placements inside the requested windows first                                  |
| Alternatives       | Search outside requested windows if no feasible requested placement exists               |
| Reasons            | Every rejection and alternative must have an explanation                                 |
| Priority inversion | A lower-priority allocation must not block a feasible higher-priority request            |

The official starter pack also includes one cancelled request. Your application must not silently omit it or approve it. It must be handled in a manner compatible with the export schema and official validator.

Two important points:

1. `end_period` is inclusive in the booking export.
2. A booking that displaces a regular class requires a valid `session_override` and Admin approval. Only an approved institute event may displace a regular class.

Your feature list also mentions category quota management across venues. I would not make that a core booking restriction unless it is actually present in the supplied dataset or official rules. The role-based category cap and venue-specific quotas are different things.

Pasted markdown(20261031-074342).md

### D. Disruption file support

Your current scenarios include faculty sick leave, room maintenance and weather-related room closures. These are useful demonstrations.

But the starter-pack disruption format requires support for five types:

| Disruption type       | Current directory |
| --------------------- | ----------------- |
| `faculty_unavailable` | ✅                 |
| `room_unavailable`    | ✅                 |
| `add_faculty`         | ❌ Not mentioned   |
| `add_session`         | ❌ Not mentioned   |
| `remove_session`      | ❌ Not mentioned   |

You should add these missing change types.

There is another important architectural concern.

Your document says the disruption solver relocates only disrupted classes and retains up to 92% of all existing session positions. But a valid repair can require moving sessions that were not directly affected, because their slots may be needed by other displaced sessions.

The correct objective is:

1. Zero hard violations.
2. Minimize the number of sessions moved.
3. Minimize the official soft penalty when multiple solutions move the same number of sessions.

Do not unconditionally lock unaffected sessions.

Also, Section 5 says there is a one-click Commit Recovery Plan, whereas the earlier approval workflow says a repair must only be applied after Admin approval. These must become one consistent workflow:

Simulate → Validate → Show impact and diff → Admin approves → Activate.

The simulation can be one-click. Activation must not bypass approval.

Pasted markdown(20261031-074342).md

## 5. Evaluation of each major feature area

### Architecture and data management — strong foundation, incomplete contract

Good architectural choice

React + TypeScript, Express, MySQL/Prisma, Python FastAPI and OR-Tools is a sensible combination for this application.

The most important architecture boundary should be:

| Component    | Responsibility                                                                                 |
| ------------ | ---------------------------------------------------------------------------------------------- |
| React        | User experience, forms, timetables, previews and dashboards                                    |
| Node/Express | Authentication, RBAC, workflow state, approvals, transactions, audit and APIs                  |
| MySQL        | Authoritative records, dataset versions, schedule versions, requests and history               |
| Python       | Scheduling, exams, disruptions, booking decisions and canonical constraint validation          |
| Gemini       | Language interpretation, clarification and explanation—not authority over validity or approval |

Do not allow Node and Python to implement competing booking or constraint rules. You need one authoritative implementation of the scheduling and booking logic.

What is missing in the directory:

- Explicit Admin dataset import in starter-pack format.
- Change-file import and validation.
- Immutable dataset snapshots and content hashes.
- Explicit schedule JSON export.
- Explicit `schedule_after.json` generation.
- Official validator execution and recorded validation report.
- Reproducible solver metadata: dataset version, schedule version, solver status and relevant configuration.

Your document mentions versioned schemas, but not the complete import/export and independent verification workflow.&#x20;

Pasted markdown.md



### RBAC — good personas, incomplete permission coverage

You have all four roles and the basic data isolation concepts.

However, there are missing or unclear operational capabilities.

Department Coordinator needs explicit support for:

- Request changes to their department's sessions.
- Book rooms for department events.
- Approve bookings for their department's labs.
- See department timetables and relevant booking/approval status.

The directory primarily describes their analytics and monitoring privileges.

Faculty needs explicit support for:

- Declare unavailability.
- Request extra or moved sessions.
- View their own timetable.
- Use the AI assistant for schedule changes.

Club Representative needs:

- Submit and cancel their own venue requests.
- Track the final status and explanation.
- View relevant venue availability without receiving access to academic timetable data.

The biggest security concern is your Instant Demo Role Switcher. Do not allow a client-side role switch to become privilege escalation.

Use four separate authenticated demo accounts. Any convenience role-switching control must be restricted to a controlled demo environment and must still use server-authorized identities. Hiding Admin buttons in React is not security; enforce RBAC on every backend operation.

Problem statement.pdf

### Faculty self-service and disruption — a strong product feature

This is one of your better areas.

I particularly like the sequence:

- Faculty declares unavailability.
- System displays affected sessions.
- Solver finds a repair.
- Proposal is created.
- Admin sees the before/after diff.
- Proposal is validated again.
- Admin approves or rejects it.
- The active schedule changes only upon approval.

I would preserve this architecture.

However, make sure that a faculty absence does not create a silent substitute assignment. The supplied disruption types do not imply that an arbitrary substitute can be invented. Handle only changes supported by the dataset and schema.

I would also add an impact summary with:

- Sessions moved.
- Sessions added or removed.
- Affected faculty.
- Affected student groups.
- Old and new room allocations.
- Soft penalty before and after.

This is more useful to an Admin than simply saying that 92% of the schedule was retained.

### AI copilot — potentially one of your strongest differentiators

Your separation of deterministic scheduling and LLM interpretation is exactly the right philosophy.

But I would strengthen three things:

1\. Do not use prompt fencing as access control.

Your copilot may only receive data the authenticated user is allowed to access. The database/API layer must filter context before it reaches Gemini. A prompt saying "do not reveal Admin data" is not an authorization mechanism.

2\. Make every proposed action reviewable.

The flow should be:

`User request → Intent extraction → Structured request → User preview/edit → Deterministic validation → Proposal → Required approval`

3\. Ground explanations in real results.

For example, when asked:

"Why can't I book the auditorium on Wednesday at 10?"

The answer should come from actual constraint checks, such as:

- Room occupied by a regular class.
- Requested capacity is too high.
- Required room feature is missing.
- Another higher-priority booking owns the slot.

Gemini can explain these facts in natural language. It should not manufacture a reason.

### WhatsApp bot — an excellent differentiator, with reliability requirements

This could be a very strong hackathon feature because it makes campus scheduling available outside the web dashboard.

Your current implementation directory describes Twilio-compatible webhooks, multi-turn conversations and a simulator. However, it does not establish that the deployed WhatsApp provider integration is operational end-to-end.

Before presenting it as a finished integration, verify:

- Inbound and outbound messages work through a real provider.
- Webhook signatures are verified.
- Phone numbers map to verified user accounts and roles.
- Conversation state survives server restarts.
- Duplicate webhook deliveries do not create duplicate bookings.
- Booking details can be edited before confirmation.
- A confirmation creates a request, not an automatic bypass of the approval process.
- Unauthorized users cannot access another person's timetable or booking details.

Your in-memory conversation state is a particular reliability risk: a process restart can destroy ongoing conversations. Persist conversation state in MySQL.

### Notifications and audit — good foundation

Your notifications cover important events, but I would ensure that the system also sends notifications for:

- Booking approval, rejection and alternative offers.
- Booking cancellation.
- Faculty unavailability decisions.
- Admin approval or rejection of a timetable proposal.
- Any session moved or removed.
- New approvals waiting for action.

Your audit table should include the actor, action, target entity, before/after state or diff, reason, timestamp, request ID and relevant schedule/dataset version.

Also, calling a table "immutable" does not make it immutable. Prevent normal application users from editing or deleting audit records, and enforce append-only behaviour at the service/database level.

### PDF reports and user experience — useful extras

Your report exports are good supporting features. Keep them.

A few improvements:

- Make academic term, institution metadata and generation time dynamic rather than fixed in the template.
- Do not describe a generated report as digitally verified or signed unless there is an actual signature mechanism.
- Add a validation summary to every exported report.
- Make sure the timetable UI can display the complete academic week and event periods.
- Provide a mobile-friendly way to select and move schedule items without depending entirely on drag-and-drop.

PDF should complement, not replace, the machine-readable JSON exports.

## 6. What would make CAMPORA stand out?

You already have plenty of features. I would not recommend adding another large module just for the sake of feature count.

I would focus on making CAMPORA exceptionally good at three things: explaining decisions, simulating changes, and proving correctness.

Here are my recommendations, ranked by potential.

### 1. Explainable Scheduling — my top recommendation

Highest recommendation

[Timetable & Substitution Management for Colleges | edumerge](https://images.openai.com/static-rsc-4/n6lQ9fKX7FKlGL2IIQLohtIk3yVfxQuksqm8TRoJiDQG1bIcpsLr_yfXfciGf9w67fGI-LsrqBZmgv5tqJReb-hndp8W_Hp4Kr-9J8pl_Sgv_VgaJxP2OPaJT6vrOyW4qkfogdtGOD7JEP0Kf3w3K5-GAaKnFJsE4sgvaziNP7o?purpose=inline)

[edumerge.com](https://www.edumerge.com/products/college-erp/timetable-substitution-management?utm_source=chatgpt.com)

Instead of showing just the final timetable, let the user inspect why each decision was made.

For every scheduled session, show:

- Why this particular day and period were selected.
- Which rooms were considered.
- Which rooms were rejected, and why.
- Whether faculty preferences affected the selection.
- What the alternative slots were.
- The soft-penalty impact of the chosen assignment.

For an unavailable slot, show actual blocking constraints.

For example:

Why was CS301 scheduled on Tuesday at P2?

| Candidate    | Result                                 |
| ------------ | -------------------------------------- |
| Monday P1    | Faculty unavailable                    |
| Monday P2    | Room capacity insufficient             |
| Tuesday P1   | Room occupied                          |
| Tuesday P2   | Valid placement; lower soft penalty    |
| Wednesday P2 | Valid, but creates a student-group gap |

This can be generated from your deterministic validation engine, not from Gemini's guess.

Why it stands out: The PS specifically asks the platform to explain its decisions. You would turn that requirement into one of the most impressive features of the entire product.

### 2. What-if Simulation / Campus Disruption Control Tower

Highest recommendation

[The Self-healing Supply Chain](https://images.openai.com/static-rsc-4/4mg4ijMTFqniCZ66Svb7OJo_qqnEygGmI1MLwAk9ZoFYOJGFrHEPSCzmvTxkoMtoPdf_3AmmL33yOIduMpoBqft1G_ifezzz0jkVhKJKxKXde0qOY0MJPDlsBjTcEy_22vKSj8WHzN0m8lZNIIFZTfwavUenxZeBGI0QCd7avoU?purpose=inline)

[forbes.com](https://www.forbes.com/sites/stevebanker/2020/01/03/the-self-healing-supply-chain/?utm_source=chatgpt.com)

You already have the beginnings of this functionality through preset disruptions.

Take it a step further.

Let an Admin simulate several scenarios without changing the active timetable:

- A faculty member becomes unavailable.
- Two rooms close simultaneously.
- A new session is introduced.
- An event needs to occupy a particular venue.
- A room becomes unavailable during an already approved booking.

For each scenario, show:

| Metric                  | Current | Proposed |
| ----------------------- | ------- | -------- |
| Hard violations         | 0       | 0        |
| Sessions moved          | 0       | 7        |
| Affected student groups | 0       | 4        |
| Affected faculty        | 0       | 3        |
| Soft penalty            | 125     | 109      |

Illustrative values, not your actual solver results.

Add a side-by-side timetable comparison and a list of every affected session.

Let Admin compare multiple proposals, reject them or approve one.

The most important detail: scenarios must operate on a copy of the active schedule. No live changes until approval and revalidation.

This could make CAMPORA feel like a genuine campus operations system instead of a collection of independent scheduling modules.

### 3. Constraint Conflict Heatmap

[Academic Course Scheduling Software | Coursedog](https://images.openai.com/static-rsc-4/lBEOEvBPCwoUJwaCSLsmZPq-W-5hs8m7UljqnUFYoEJuKbOqooICbaKbBfPNf48hlSrUN35WlNx6J2xH3PNgWIfv4cl59KIJUczjGgD2s4fEYsMyKq0JPQ8eLvJCZIVlEAFbKASI1ULGsYFdvriVFtIccqV6ktzpiT79Xl30RRM?purpose=inline)

[coursedog.com](https://www.coursedog.com/products/academic-course-scheduling-software?utm_source=chatgpt.com)

Build a heatmap that shows where campus resources are under the greatest scheduling pressure.

For example:

- Rooms with the highest occupancy.
- Periods with the most faculty conflicts.
- Days with the highest student workload.
- Frequently requested but unavailable venues.
- Time slots with the most booking rejections.

Allow clicking a heatmap cell to inspect the sessions and constraints responsible.

This would make your utilisation dashboard much more useful for decision-making.

### 4. Booking Decision Transparency

Your booking engine already has priority processing. Give it a dedicated explanation interface.

When a request is rejected or receives an alternative, show:

- Its effective booking category.
- Its priority compared with competing requests.
- Requested windows.
- Eligible rooms.
- Why each candidate room was excluded.
- Whether an alternative was found.
- Whether Admin approval is required.

A Club Representative should understand the decision without needing to contact the Dean's office.

This also demonstrates that the system is fair and follows the official booking rules rather than arbitrarily assigning venues.

### 5. One conversational interface across Web and WhatsApp

You have two interesting interfaces: the web copilot and WhatsApp bot.

Unify both behind the same request-processing service.

A Faculty member could say:

> "Meri Thursday wali lab ko Friday afternoon shift karna hai."

The system should identify the faculty member, identify the relevant session, ask for clarification if necessary, show available alternatives, and create a request.

An Admin should subsequently be able to review the same request from the web dashboard.

The important part is that both channels use the same identity, authorization, deterministic validation, request records and approval workflow.

Do not build two separate business-rule implementations.

### 6. Practical features worth considering

| Feature                                     | User value                                              | Priority  |
| ------------------------------------------- | ------------------------------------------------------- | --------- |
| Faculty/student calendar subscription (ICS) | Keep personal calendars synchronized                    | Medium    |
| Actionable notifications                    | Open the exact request or proposal needing attention    | High      |
| Version history and rollback                | Recover from an incorrect approved change               | High      |
| Room utilisation reports                    | Help administration plan resource usage                 | Medium    |
| Exam timetable PDF/ICS distribution         | Make exam schedules accessible                          | Medium    |
| Schedule validation certificate             | Show the official validator result and schedule version | Very high |
| Approval turnaround dashboard               | Help Admin identify pending requests                    | Low       |

My recommendation is to implement the first five in a staged manner, rather than trying to complete all six new headline features.

## 7. Specific corrections to your current feature directory

I would revise the documentation before treating it as the final engineering specification.

| Current statement                            | Recommended correction                                                          |
| -------------------------------------------- | ------------------------------------------------------------------------------- |
| H1–H10 constraint definitions                | Replace with the official H1–H14 mapping                                        |
| Eight daily timetable periods                | Show P1–P9 teaching periods and P10–P13 event periods                           |
| Period 4 lunch                               | Correct to lunch between P5 and P6                                              |
| Six-hour student workload as hard constraint | Treat as an official soft penalty                                               |
| Maximum two consecutive teaching hours       | Remove as an official hard constraint unless separately justified               |
| Departmental room affinity                   | Remove as an official hard constraint                                           |
| Weekly faculty teaching cap                  | Replace with the dataset-configured daily faculty teaching limit                |
| 92%+ session retention                       | Report actual moved-session metrics rather than promise a percentage            |
| One-click Commit Recovery Plan               | Make this an approval-controlled activation                                     |
| Mandatory revision gaps                      | Do not impose as a hard exam constraint                                         |
| Venue category quotas                        | Do not impose unless supported by the dataset                                   |
| PDF timetable export                         | Retain, but implement official JSON exports separately                          |
| One-click demo role switcher                 | Restrict to a controlled demo environment; never trust client-side role changes |
| Immutable audit logs                         | Enforce append-only behaviour in the backend                                    |

There is also a reporting inconsistency: Section 3.2 claims solver execution in under five seconds, while Section 13 reports under 3.2 seconds. Choose a single metric and publish it only after repeatable benchmarks on the actual deployment environment.&#x20;

Pasted markdown.md



## 8. The implementation priorities I would give your engineering team

This is the order I would follow. It prioritizes getting the competition requirements right before spending time on extras.

P0 — Must complete

Critical

1. Correct the timetable period model and official H1–H14 constraints.
2. Verify all session, room, faculty, accessibility, basket and fixed-slot constraints.
3. Implement actual midsem exam room allocation, including half-capacity and multiple rooms.
4. Complete booking feasibility, alternatives, cancelled requests, priority ordering and session overrides.
5. Support all five disruption types and the proper minimum-movement objective.
6. Implement dataset import and `schedule.json` / `schedule_after.json` exports.
7. Run the official `validator.py` against actual application-generated exports.
8. Complete backend RBAC, departmental scopes and self-approval protection.

   P1 — Differentiation

   High value
9. Explainable scheduling and candidate-slot reasoning.
10. What-if scenario simulator with side-by-side comparisons.
11. Booking decision transparency.
12. Complete impact analysis and actionable notifications.
13. Persistent, verified WhatsApp integration.

    P2 — Product maturity

    Later
14. Calendar synchronization.
15. Advanced utilisation analytics.
16. Approval turnaround reports.
17. Enhanced PDF reporting and validation certificates.

## 9. What I would demonstrate to the judges

The strongest five-minute demonstration would be a single connected operational story, not a tour of every module.

1. Admin generates the timetable

   Load the official dataset, generate the timetable and show the actual official validator report with zero hard violations.
2. Faculty requests a change

   Submit a natural-language leave or rescheduling request. Show the extracted details, alternatives and proposal.
3. Admin reviews the impact

   Display the old/new timetable, affected groups, moved sessions and soft penalty before approving.
4. Club Representative requests a venue

   Use a Hinglish WhatsApp request, confirm the editable booking details, and show the actual allocation decision and explanation.
5. Admin runs a disruption scenario

   Close a room, run the repair, show the difference and approve the validated proposal.

Finish by showing the actual generated JSON exports and validator output. That is much more convincing than claiming that your product is enterprise-grade.

Also verify the competition submission requirements: public GitHub repository, `README.md`, `.env.example`, `AI_USAGE.md`, `THIRD_PARTY.md`, demo credentials for all four roles, both JSON exports, working deployed link and the five-minute walkthrough.&#x20;

Problem statement.pdf



## My final opinion

CAMPORA's greatest opportunity is not to become the campus ERP with the most features.

It should become the platform that can make a scheduling decision, prove why that decision is valid, explain its consequences, and safely apply it after authorization.

You already have the ingredients:

- CP-SAT for optimization.
- A versioned schedule model.
- A deterministic validation layer.
- An AI copilot.
- WhatsApp communication.
- Approval workflows.
- Audit logging.

Connect these into one trustworthy workflow and the product becomes substantially more compelling.

One thing I would absolutely not compromise on: do not add more flashy functionality until the official validator passes against schedules generated by the deployed app. That is the foundation on which every other feature depends.

Scope note: this evaluation is based on your feature directory and the supplied competition requirements. I have not independently executed CAMPORA or its test suite, so I cannot certify that the documented capabilities are all working in the deployed application.

My next recommended step is a feature-by-feature acceptance test matrix: every PS requirement, dataset rule and RBAC permission mapped to an actual test case, expected result and implementation status.