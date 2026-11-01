# Requirements Document

## Introduction

Campora is a constraint-driven campus operations platform built for the Crunch Week / TZ Hackathon. It provides Chilika Institute of Technology (CIT) with one authoritative system for four interlinked operations: generating a weekly teaching timetable, scheduling midsem exams, deciding Spectra Week venue bookings, and processing disruptions (faculty leave, room closures, session additions/removals). A natural-language AI copilot helps users construct requests without ever acting as the scheduling authority. A role-based access control layer governs every write. Every constraint check flows through a single canonical validator so there is never a divergence between what the application accepts and what the official validator.py scores.

The system serves four user roles — Admin, Department Coordinator, Faculty, and Club Representative — through a React dashboard backed by a Node.js/Express API, a MySQL relational store, and a Python OR-Tools CP-SAT optimization service. Exports of `schedule.json` and `schedule_after.json` must satisfy the official starter-pack validator with zero hard violations.

---

## Glossary

- **Scheduling_Engine**: The Python OR-Tools CP-SAT service that assigns teaching sessions to room/day/period slots and minimizes soft penalties.
- **Exam_Engine**: The Python CP-SAT service that assigns exams to day/AM-PM slots with multi-room half-capacity allocation.
- **Booking_Engine**: The deterministic Node.js service that evaluates Spectra Week booking requests and emits approved / rejected / alternative_offered decisions.
- **Disruption_Engine**: The Python CP-SAT service that repairs a timetable after a change file is applied, minimizing moved sessions.
- **Canonical_Validator**: The single shared constraint-checking module (used by all engines, manual moves, drag/drop preview, and AI-generated proposals) that returns `{valid, violations[], warnings[]}`.
- **CIT_Copilot**: The AI adapter layer that converts English/Hinglish free text into a structured JSON booking or session-change schema. It never decides validity or approves actions.
- **Schedule_Version**: An immutable record of a complete set of session assignments. The active schedule is a pointer to a specific Schedule_Version; assignments within a version are never mutated.
- **Dataset_Version**: An immutable snapshot of the imported starter-pack JSON, including all rooms, faculty, sessions, booking requests, exams, and calendar data.
- **Hard_Constraint**: A rule whose violation count must be zero in any published schedule (HC-01 through HC-16).
- **Soft_Penalty**: A scored metric that the optimizer minimizes after achieving zero Hard_Constraint violations (S1 through S6).
- **Proposal**: A Schedule_Version with status `pending_approval`; it does not become the active schedule until explicitly approved by an authorized Admin.
- **Booking_Request**: A Spectra Week venue request submitted by a user with a role, requested category, attendance, duration, and one or more time windows.
- **Effective_Category**: The category assigned to a Booking_Request after applying the role category cap; always the less-privileged of the requested category and the cap.
- **Session_Override**: A Week-7-only reassignment of a regular teaching session displaced by an approved institute_event booking.
- **Disruption_Job**: A tracked background task that applies a change file to a copy of the active dataset and produces a minimum-movement Proposal.
- **Solver_Job**: A tracked background task that runs the Scheduling_Engine or Exam_Engine and stores its result as a Proposal.
- **Basket_Slot**: A label shared by parallel elective sessions that must run at the same day and start period in separate rooms.
- **Fixed_Slot**: A session attribute that locks it to a specific day and start period and cannot be changed by the solver.
- **Admin**: The highest-privilege role; can generate schedules, approve proposals, import/export data, and reset demo state.
- **Department_Coordinator**: Can view their department's schedule, request session changes, book department events, and approve their department's lab bookings.
- **Faculty**: Can view their own timetable, declare unavailability, and request session changes via the AI assistant.
- **Club_Representative**: Can submit, track, and cancel club venue requests.
- **Priority_Order**: The booking priority sequence from the dataset: `exam > regular_session > institute_event > guest_lecture > department_event > club_event`.
- **Audit_Log**: An immutable record of every state-changing action including actor, entity, before/after snapshot, reason, and timestamp.
- **Demo_Reset**: An Admin-only operation that restores the application to a known clean demo state using the public dataset.

---

## Requirements

### Requirement 1: Dataset Import and Validation

**User Story:** As an Admin, I want to import a starter-pack-compatible JSON dataset, so that the system has authoritative data for all scheduling operations.

#### Acceptance Criteria

1. WHEN an Admin submits a dataset JSON file, THE Scheduling_Engine SHALL parse and validate the complete file before activating any part of it.
2. IF a submitted dataset contains a malformed record, missing required field, invalid reference, or duplicate external ID, THEN THE System SHALL reject the entire file and return field-path-specific error messages identifying every violation found.
3. WHEN a dataset import is accepted, THE System SHALL store the source JSON as an immutable Dataset_Version with a content hash and a timestamp.
4. WHEN an Admin imports a dataset whose content hash matches an existing Dataset_Version, THE System SHALL return a success response indicating the existing Dataset_Version was returned unchanged and SHALL NOT create a new Dataset_Version.
5. WHEN a dataset import is accepted, THE System SHALL validate that every session references a valid faculty_id, valid group IDs, valid room_types drawn from the known room type values in the dataset, and a duration of at least 1 period and no more than the total number of periods in a single day as defined by the dataset's time model.
6. WHEN a dataset import is accepted, THE System SHALL validate that every booking_request window specifies a from_period and to_period each in the range 1 to the total number of periods defined in the dataset's time model, that from_period is less than or equal to to_period, and that duration_periods is less than or equal to the number of periods between from_period and to_period inclusive.
7. IF an accepted dataset import would replace the currently active Dataset_Version and the Admin has not provided explicit confirmation, THEN THE System SHALL discard the incoming Dataset_Version and return an error indicating that confirmation is required, leaving the existing active Dataset_Version unchanged.
8. WHEN an Admin submits a dataset import, THE System SHALL record an entry in the Audit_Log including actor, dataset content hash, validation outcome, and submission timestamp, regardless of whether validation succeeds or fails.

---

### Requirement 2: Weekly Timetable Generation

**User Story:** As an Admin, I want to generate a complete weekly teaching timetable using the constraint solver, so that every session is assigned exactly once with zero hard-constraint violations.

#### Acceptance Criteria

1. WHEN an Admin triggers timetable generation, THE Scheduling_Engine SHALL assign every session in the active Dataset_Version exactly one (day, start_period, room_id) combination.
2. THE Scheduling_Engine SHALL enforce Hard_Constraint HC-01: every session appears exactly once; no session is unscheduled, duplicated, or assigned an unknown session ID.
3. THE Scheduling_Engine SHALL enforce Hard_Constraint HC-02: no faculty member is assigned to two sessions that overlap in day and period.
4. THE Scheduling_Engine SHALL enforce Hard_Constraint HC-03: no student group is assigned to two non-basket sessions that overlap in day and period; combined sessions count against every listed group.
5. THE Scheduling_Engine SHALL enforce Hard_Constraint HC-04: all sessions sharing the same Basket_Slot must be placed at the same day and start_period in different rooms; basket members are exempt from group collision only against each other, not against non-basket sessions.
6. THE Scheduling_Engine SHALL enforce Hard_Constraint HC-05: no room is double-booked across any two sessions at the same day and period.
7. THE Scheduling_Engine SHALL enforce Hard_Constraint HC-06: the assigned room capacity must be greater than or equal to the session size.
8. THE Scheduling_Engine SHALL enforce Hard_Constraint HC-07: the assigned room type must appear in the session's allowed room_types list.
9. THE Scheduling_Engine SHALL enforce Hard_Constraint HC-08: no session is placed at a day/period combination listed in the assigned faculty member's unavailability.
10. THE Scheduling_Engine SHALL enforce Hard_Constraint HC-09: no session is placed at a day/period combination listed in the assigned room's unavailability.
11. THE Scheduling_Engine SHALL enforce Hard_Constraint HC-10: no session may span the lunch break between P5 and P6; three-hour lab sessions may only start at P2 or P6; all teaching sessions must be placed within P1–P9.
12. THE Scheduling_Engine SHALL enforce Hard_Constraint HC-11: when a session or student group has needs_accessible: true, the assigned room must have accessible: true.
13. THE Scheduling_Engine SHALL enforce Hard_Constraint HC-12: the sum of session durations assigned to a faculty member on any single day must not exceed that faculty member's max_hours_per_day.
14. THE Scheduling_Engine SHALL enforce Hard_Constraint HC-13: a session with a Fixed_Slot attribute must be placed at exactly the day and start_period specified.
15. WHEN the solver cannot find a feasible placement for any session, THE Scheduling_Engine SHALL return an infeasibility diagnostic listing every session with an empty candidate set and the specific constraints that eliminated all candidates.
16. WHEN a solver run succeeds with zero Hard_Constraint violations, THE Scheduling_Engine SHALL minimize total Soft_Penalty: S1 (2 pts per faculty avoid-preference period), S2 (1 pt per idle gap in a group's day), S3 (3 pts per group-hour above 6/day), S4 (3 pts per same-course repeat for a group on the same day including basket repetition), S5 (1 pt per session where size/room.capacity < 0.4), S6 (1 pt per session in P9).
17. WHEN a solver run succeeds, THE Scheduling_Engine SHALL store the result as a Proposal with status pending_approval and SHALL NOT modify the active Schedule_Version.
18. WHEN an Admin requests solver job status, THE System SHALL respond within 2 seconds with the current state (queued, running, succeeded, or failed), and SHALL include stage, progress percentage (0–100), result_version_id (if succeeded), and an error description (if failed).
19. WHEN an Admin publishes a Proposal, THE System SHALL run the Canonical_Validator and, if zero Hard_Constraint violations are reported, activate the schedule and record the activation event in the Audit_Log including the Admin identity, Proposal ID, and timestamp.
20. IF the Canonical_Validator reports one or more Hard_Constraint violations on a published Proposal, THEN THE System SHALL reject the activation, retain the Proposal in pending_approval status, and return an error response indicating the count and identifiers of the violated constraints.
21. WHEN a schedule is exported, THE System SHALL run the official validator.py against the exported schedule and, if the validator.py score differs from the solver's recorded score by more than 0 penalty points, THE System SHALL flag the export as unverified and record the discrepancy in the Audit_Log.
22. IF a solver run exceeds 300 seconds without producing a result, THEN THE Scheduling_Engine SHALL terminate the run, set the job status to failed, and return a timeout diagnostic indicating the last completed solver stage and the number of sessions left unplaced.

---

### Requirement 3: Manual Session Management

**User Story:** As an Admin or authorized Department Coordinator, I want to manually move sessions within the timetable, so that I can correct or adjust the generated schedule.

#### Acceptance Criteria

1. WHEN an authorized user requests a session move, THE System SHALL run the Canonical_Validator against the proposed placement before committing it.
2. IF a proposed manual move violates any Hard_Constraint, THEN THE System SHALL reject the move and return all applicable violation codes and human-readable messages.
3. WHEN a user previews a potential move target (drag/drop or tap-select), THE System SHALL return validation results for that candidate slot without persisting any change.
4. THE System SHALL enforce Hard_Constraints HC-01 through HC-13 for every manual move using the same Canonical_Validator used by the Scheduling_Engine.
5. WHEN a Basket_Slot session is moved, THE System SHALL atomically move all sessions belonging to that Basket_Slot to the new day and start_period, each remaining in a valid room.
6. THE System SHALL deny any manual move attempted by a user without the required role and scope.
7. WHEN a manual move is committed, THE System SHALL create a new Schedule_Version containing the change and record the action in the Audit_Log.

---

### Requirement 4: Midsem Examination Scheduling

**User Story:** As an Admin, I want to generate a midsem examination schedule, so that every exam is assigned to a valid day, AM/PM slot, and sufficient rooms with zero hard violations.

#### Acceptance Criteria

1. WHEN an Admin triggers exam generation, THE Exam_Engine SHALL assign every exam in the active Dataset_Version exactly one day and one exam session (AM or PM) drawn from the calendar.exam_week configuration.
2. THE Exam_Engine SHALL enforce that every exam day is a valid day listed in calendar.exam_week and every session label matches the configured AM/PM values; these values must be read dynamically from the dataset, not hard-coded.
3. THE Exam_Engine SHALL enforce that every room allocated to an exam has `exam` in its `allowed_uses` list.
4. THE Exam_Engine SHALL enforce that the aggregate effective room capacity (floor(room.capacity / 2) per room, summed across all allocated rooms) is greater than or equal to the exam size.
5. THE Exam_Engine SHALL enforce that no room hosts two exams in the same day and exam session.
6. THE Exam_Engine SHALL enforce that no student group sits two exams in the same day and exam session.
7. AFTER satisfying hard exam constraints, THE Exam_Engine SHALL minimize the number of exams a student group has on any single day.
8. WHEN the Exam_Engine produces a result, THE System SHALL store it as a Proposal requiring Admin review before activation.
9. THE System SHALL include the exam schedule in the exported schedule.json; a missing exam schedule causes every exam to count as unscheduled in the official validator.

---

### Requirement 5: Spectra Week Venue Booking

**User Story:** As an authorized user, I want to submit a venue booking request for Spectra Week, so that my event gets a fair, explainable, and constraint-compliant decision.

#### Acceptance Criteria

1. WHEN a user submits a Booking_Request, THE Booking_Engine SHALL derive the Effective_Category by applying the role_category_cap from the active dataset; the Effective_Category is the less-privileged of the requested category and the cap.
2. THE Booking_Engine SHALL process all Booking_Requests in Priority_Order (exam > regular_session > institute_event > guest_lecture > department_event > club_event), breaking ties by earlier submitted_at timestamp, then by stable request ID.
3. WHEN a cancelled request is encountered, THE Booking_Engine SHALL skip it and SHALL NOT approve it or offer it an alternative.
4. WHEN evaluating a request, THE Booking_Engine SHALL enumerate only rooms where room.capacity is greater than or equal to the requested attendance, that support event in allowed_uses, match at least one requested room_type, provide all features listed in needs, and satisfy accessibility if needs contains accessible.
5. IF a candidate placement conflicts with room maintenance/unavailability, a timetabled session occupying the room at an overlapping [start_period, end_period] range, a previously approved booking at the same room and overlapping time, or a mandatory_for_groups student group that has a class during the requested slot, THEN THE Booking_Engine SHALL exclude that placement from the set of valid placements for the request.
6. WHEN a valid placement is found inside a requested window, THE Booking_Engine SHALL approve the request and record the day, start_period, end_period (inclusive), room_id, and reason.
7. WHEN no valid placement exists inside any requested window, THE Booking_Engine SHALL search for an alternative placement outside the requested windows; if found, THE Booking_Engine SHALL record the decision as alternative_offered with the placement and reason.
8. WHEN no valid placement exists inside or outside the requested windows, THE Booking_Engine SHALL record the decision as rejected with one or more reason codes drawn from the defined set (CANCELLED_REQUEST, ROLE_CATEGORY_CAPPED, NO_COMPATIBLE_ROOM_TYPE, INSUFFICIENT_CAPACITY, MISSING_FEATURE, ACCESSIBILITY_UNAVAILABLE, ROOM_MAINTENANCE, ROOM_OCCUPIED_BY_CLASS, ROOM_OCCUPIED_BY_HIGHER_PRIORITY_BOOKING, MANDATORY_GROUP_BUSY, NO_FEASIBLE_ALTERNATIVE).
9. THE Booking_Engine SHALL ensure that no Booking_Request with a valid placement (a placement satisfying criteria 4 and 5) is rejected while a lower-priority request holds a room or time slot that could satisfy it; the official validator reports such priority inversions as violations.
10. WHEN an approved institute_event booking displaces a regular teaching session, THE System SHALL create a Session_Override that moves the displaced session to a valid alternative slot for Week 7 where the room matches the session's room_types, has sufficient capacity, is not occupied by another session or approved booking, and is not listed as unavailable; THE System SHALL NOT drop the displaced session.
11. WHEN a booking decision would displace a timetabled class, THE System SHALL set the booking status to pending_admin_approval and SHALL NOT finalize the decision until an Admin user provides explicit approval.
12. THE System SHALL store every booking decision with its reason code, placement details, deciding actor (the Booking_Engine identifier for automated decisions or the Admin user ID for manually confirmed decisions), and timestamp, and SHALL record the decision in the Audit_Log.
13. WHEN the Booking_Engine produces booking decisions, THE System SHALL serialize them in a format that passes the official validator without errors, using approved, rejected, and alternative_offered as the only valid status values.

---

### Requirement 6: Disruption Processing

**User Story:** As an Admin, I want to process a disruption change file and receive a minimum-movement valid timetable repair proposal, so that I can review and approve it before it affects the active schedule.

#### Acceptance Criteria

1. WHEN an Admin submits a disruption change file, THE Disruption_Engine SHALL validate all change payloads before beginning any repair work.
2. IF a disruption change file contains an unsupported change type or a change payload missing required fields, THEN THE System SHALL reject the entire change file with an explicit error identifying the offending change type and field.
3. THE System SHALL support change types: faculty_unavailable (faculty ID, days, periods, reason), room_unavailable (room ID, days, periods, reason), add_faculty (faculty object containing all required fields present in the active Dataset_Version faculty schema), add_session (session object containing all required fields present in the active Dataset_Version session schema), and remove_session (session ID).
4. THE Disruption_Engine SHALL apply changes to a cloned copy of the active Dataset_Version and SHALL NOT mutate the active dataset or active Schedule_Version.
5. THE Disruption_Engine SHALL identify directly impacted sessions (sessions assigned to a faculty member or room that is now unavailable at the overlapping day and period) and transitively impacted sessions (sessions whose Hard_Constraint satisfaction depends on a slot vacated by a directly impacted session), and re-solve the full timetable with all Hard_Constraints enforced.
6. THE Disruption_Engine SHALL minimize moved sessions as the primary objective after achieving zero Hard_Constraint violations; a session is counted as moved if its day, start_period, or room_id differs from its baseline assignment; removed sessions are absent from the output and are not counted as moved.
7. WHEN minimizing moved sessions produces more than one valid solution, THE Disruption_Engine SHALL minimize Soft_Penalty as a secondary objective among those solutions.
8. WHEN the Disruption_Engine produces a valid repair, THE System SHALL store it as a Proposal with status pending_approval and SHALL generate a diff listing every changed session with old and new assignments, plus total counts for time-changed sessions, room-only-changed sessions, added sessions, and removed sessions.
9. THE System SHALL expose the diff and impact summary, including affected faculty IDs and group IDs, for Admin review before approval.
10. WHEN the Disruption_Engine cannot find a feasible repair, THE System SHALL return the solver status, each impacted session with its empty candidate set, the conflicting resources preventing each session from being placed (identified by resource type and ID), and at least one concrete candidate relaxation (such as extending the leave window or removing room unavailability) for each unresolvable session; THE System SHALL NOT emit a partial or fake schedule.
11. WHEN an Admin approves a Disruption Proposal, THE System SHALL verify that the base Schedule_Version ID recorded in the Proposal matches the current active Schedule_Version ID.
12. IF the base Schedule_Version ID does not match the current active Schedule_Version ID, THEN THE System SHALL reject the approval with an error identifying the version mismatch and SHALL retain the Proposal in pending_approval status for re-evaluation against the current active version.
13. WHEN version verification passes, THE System SHALL re-run the Canonical_Validator on the Proposal and, only if zero Hard_Constraint violations are reported, atomically activate the new Schedule_Version.
14. THE System SHALL prevent any actor from approving a Disruption Proposal that they themselves submitted, enforcing this check server-side.
15. WHEN a disruption Proposal is approved and activated, THE System SHALL write an Audit_Log entry, update the active schedule pointer, and generate in-app notifications for every faculty member whose session day, period, or room has changed, and for the Department_Coordinator of every student group whose session day, period, or room has changed.

---

### Requirement 7: CIT Copilot — Natural Language Booking Requests

**User Story:** As a Faculty or Club Representative, I want to describe a booking request in plain English or Hinglish, so that the system parses my intent into a structured form I can review and confirm before submission.

#### Acceptance Criteria

1. WHEN a user submits free text of at most 2000 characters to the CIT_Copilot, THE CIT_Copilot SHALL parse it into a structured JSON object including intent, attendance (integer 1–500), duration_periods (integer 1–8), windows (at most 7 entries), room_types (at most 7 entries), needs (at most 7 entries), mandatory_for_groups, requested_room, and a clarification_question field.
2. IF any of the fields intent, attendance, duration_periods, or windows are absent or ambiguous in the user's input, THEN THE CIT_Copilot SHALL populate the clarification_question field with a question targeting the first unresolved field and SHALL NOT silently assign a default value to that field.
3. WHEN the CIT_Copilot resolves temporal expressions such as kal, tomorrow, Friday evening, or after lunch, THE CIT_Copilot SHALL display the resolved weekday and period range (using period identifiers P1–P10) in the editable form for user confirmation; kal in a booking context SHALL be resolved as tomorrow.
4. IF the user's input contains the expression after lunch and no explicit time window using period identifiers or clock times is provided, THEN THE CIT_Copilot SHALL either populate the clarification_question field asking for the intended period or propose periods P6 onward and mark the windows field as an assumption visible in the editable form.
5. THE CIT_Copilot SHALL present extraction results in an editable form and SHALL require the user to activate a dedicated Confirm & Submit action before the structured request is submitted to the Booking_Engine.
6. IF the CIT_Copilot identifies a conflict between the user's stated room preference and another stated need, including a room whose capacity is less than the stated attendance or a non-accessible room requested for a wheelchair-accessible event, THEN THE CIT_Copilot SHALL surface the conflict with a description of the incompatibility and suggest a room that satisfies both the stated need and the room_type preference in the editable form.
7. THE CIT_Copilot SHALL NOT produce fields effective_category, is_valid, approved, priority_score, or override_authorized in its extraction output; these are determined solely by server-side logic.
8. THE CIT_Copilot SHALL support Hinglish expressions including period mappings (e.g. shaam 6 baje → P10) and room-type terms (e.g. lab, seminar hall, audi) as used in the sample_requests dataset.
9. WHEN the CIT_Copilot produces a structured JSON output, THE System SHALL validate it against the defined booking request schema enforcing server-side enum validation, period identifier bounds (P1–P10), array size limits of at most 7 entries per array field, and rejection of unknown properties before the form is presented to the user.
10. IF the structured JSON output fails schema validation, THEN THE System SHALL discard the output, display an error message indicating the request could not be parsed, and present the standard manual booking form to the user without data loss of the original free text.
11. WHEN the CIT_Copilot is unavailable due to LLM provider failure, THE System SHALL display an AI assistant unavailable; use the manual form banner and SHALL fall back to the standard manual booking form without disrupting any other workflow.

---

### Requirement 8: CIT Copilot — Natural Language Session Change Requests (Faculty Assistant)

**User Story:** As a Faculty member, I want to request a session move or exchange in plain language, so that the system shows me validated alternatives or explains why none exist.

#### Acceptance Criteria

1. WHEN a Faculty member submits a session change request to the CIT_Copilot, THE CIT_Copilot SHALL parse the request into a structured change schema including the session ID (or course/group context sufficient to identify it), the requested action, and any preferred day/period/room constraints.
2. THE CIT_Copilot SHALL identify ambiguous session references and ask a clarifying question before proceeding.
3. WHEN the System evaluates alternatives for a requested session change, THE Canonical_Validator SHALL check every candidate slot against all Hard_Constraints.
4. IF no valid alternative slot exists for a requested session change, THEN THE System SHALL return the specific reason codes explaining why each candidate slot was rejected.
5. THE CIT_Copilot SHALL present the list of valid alternatives (or the absence of alternatives with reasons) in a readable summary and SHALL NOT auto-submit any change on behalf of the user.
6. WHEN the System generates explanations for why a session occupies its current slot, THE System SHALL test plausible alternative slots against the current schedule, record blockers (faculty busy, room type mismatch, group conflict, fixed slot, etc.) from deterministic checks, and optionally use the CIT_Copilot to rephrase the machine-generated reasons; THE CIT_Copilot SHALL NOT invent reasons.

---

### Requirement 9: Timetable Dashboard and Views

**User Story:** As any authenticated user within their authorized scope, I want to view the timetable from multiple perspectives, so that I can understand session assignments and identify issues.

#### Acceptance Criteria

1. THE Dashboard SHALL provide a timetable view filtered by student group, showing all sessions for that group across the full week grid (Mon–Fri, P1–P9).
2. THE Dashboard SHALL provide a timetable view filtered by faculty member, showing all sessions assigned to that faculty across the full week grid.
3. THE Dashboard SHALL provide a timetable view filtered by room, showing all sessions and approved bookings occupying that room across the full week grid plus event periods P10–P13.
4. THE Dashboard SHALL display Hard_Constraint violation counts and current Soft_Penalty score for the active Schedule_Version in a summary panel.
5. THE Dashboard SHALL display room utilization metrics including average utilization and sessions with size/room.capacity < 0.4 (S5 candidates).
6. THE Dashboard SHALL display pending approval items (Proposals, booking requests awaiting decision, disruption proposals) with counts visible to authorized roles.
7. WHILE a timetable generation Solver_Job is running, THE Dashboard SHALL display the job status, current stage, and elapsed time without blocking other dashboard interactions.
8. THE System SHALL scope timetable visibility: Admin sees all; Department Coordinators see their department scope; Faculty see their own timetable; Club Representatives see only their event request statuses.
9. THE Dashboard SHALL render on mobile viewports using tap-to-select interaction patterns for slot selection when drag-and-drop is not supported.
10. THE Dashboard SHALL use the defined design language: primary color HSL(272, 81%, 56%), Poppins font, deep navy sidebar, green for validated/approved states, amber for pending states, and red for conflict states.

---

### Requirement 10: Venue Management Dashboard

**User Story:** As an Admin or Department Coordinator, I want to view and manage Spectra Week booking requests, so that I can track decisions, process approvals, and ensure fairness.

#### Acceptance Criteria

1. THE Venue_Management view SHALL list all Booking_Requests with their Effective_Category, submission timestamp, current status (pending, approved, rejected, alternative_offered, cancelled), and assigned placement if applicable.
2. THE Venue_Management view SHALL display the reason code and human-readable reason for every rejected and alternative_offered decision.
3. WHEN a booking requires Admin approval (any booking that displaces a class), THE System SHALL surface it in a dedicated pending-approvals queue visible to Admins.
4. THE System SHALL prevent any user from approving a Booking_Request they submitted.
5. THE Venue_Management view SHALL display a room calendar showing which rooms are occupied by classes, approved bookings, and Session_Overrides for Week 7.
6. WHEN a Booking_Request is cancelled by an authorized user, THE System SHALL mark it as cancelled, free any allocated slot, and record the cancellation in the Audit_Log; THE System SHALL NOT re-evaluate other requests automatically unless explicitly triggered.

---

### Requirement 11: Change Control and Disruption Dashboard

**User Story:** As an Admin, I want a change control view that shows all disruption proposals with diffs and approval actions, so that I can review and activate repaired timetables safely.

#### Acceptance Criteria

1. THE Change_Control view SHALL list all Disruption_Jobs with their status (queued, running, pending_approval, approved, rejected) and the change types applied.
2. WHEN a Disruption_Job completes, THE Change_Control view SHALL display a session-by-session diff showing old day/start_period/room_id versus new day/start_period/room_id for every moved session.
3. THE Change_Control view SHALL display the summary metrics from Requirement 6.7 (time-changed count, room-only-changed count, added count, removed count, affected groups and faculty, soft score before and after).
4. WHEN an Admin approves a Disruption_Job Proposal, THE System SHALL enforce the concurrency check and revalidation described in Requirement 6.10 before activating.
5. THE Change_Control view SHALL disable the approve action for the actor who submitted the disruption.
6. THE System SHALL display the active Schedule_Version history with activation timestamps and actor IDs, allowing comparison between versions.

---

### Requirement 12: Examination Planning Dashboard

**User Story:** As an Admin, I want to view and manage the exam schedule, so that I can verify all exams are placed correctly before export.

#### Acceptance Criteria

1. THE Examination_Planner view SHALL display all 41 exams (for the public dataset; actual count read from active dataset) with their assigned day, AM/PM session, and allocated rooms.
2. THE Examination_Planner view SHALL display the aggregate effective capacity (sum of floor(room.capacity / 2)) for each exam and flag any exam where aggregate capacity is below exam size.
3. THE Examination_Planner view SHALL highlight any student group that has more than one exam on the same day (soft penalty driver).
4. WHEN an Admin approves the exam schedule, THE System SHALL store it as part of the active Schedule_Version and include it in the exported schedule.json.

---

### Requirement 13: Role-Based Access Control

**User Story:** As the system, I want to enforce role-based permissions on every action, so that unauthorized users cannot modify schedules, approve bookings, or access data outside their scope.

#### Acceptance Criteria

1. THE System SHALL define four roles: Admin, Department_Coordinator, Faculty, Club_Representative.
2. THE System SHALL enforce the following capability grants server-side for every request:
   - Generate semester timetable: Admin only.
   - View all schedules: Admin unrestricted; Department_Coordinator department scope; Faculty own timetable; Club_Representative own event status only.
   - Mark faculty unavailability: Admin unrestricted; Department_Coordinator department scope; Faculty own entries only.
   - Request session changes: Admin unrestricted; Department_Coordinator own department; Faculty own sessions.
   - Submit venue booking: Admin (institute_event cap); Department_Coordinator (department_event cap); Faculty (guest_lecture cap); Club_Representative (club_event cap).
   - Cancel own booking: all roles for their own requests.
   - Approve timetable changes and disruption proposals: Admin only.
   - Approve booking that displaces a class: Admin only.
   - Approve department lab booking: Admin unrestricted; Department_Coordinator for their own department only.
   - Change priority order: Admin only.
   - Import/export/reset demo data: Admin only.
3. THE System SHALL derive role, department, and user identity from the authenticated session token; it SHALL NOT trust role or scope values submitted in the request body.
4. THE System SHALL deny all actions by default and only permit explicitly granted capabilities.
5. THE System SHALL prevent any actor from approving an action they themselves initiated, enforcing this check server-side by comparing the authenticated actor ID against the requester/creator ID.
6. THE System SHALL check permissions in both API middleware and the service layer so that UI-level permission hiding is never the sole enforcement mechanism.
7. THE System SHALL use Argon2id or bcrypt for password hashing; it SHALL NOT store plaintext passwords.
8. THE System SHALL use HTTP-only session cookies or short-lived JWTs with a refresh strategy for session management.

---

### Requirement 14: Audit Logging

**User Story:** As an Admin, I want a complete audit trail of all state-changing actions, so that I can trace who changed what and when.

#### Acceptance Criteria

1. THE System SHALL record an Audit_Log entry for every state-changing action: dataset import, timetable generation trigger and activation, manual session move, booking submission, booking decision, booking cancellation, disruption submission, disruption approval/rejection, disruption activation, priority order change, demo reset, and export.
2. EACH Audit_Log entry SHALL include: actor user ID, action type, entity type and entity ID, before-state snapshot or diff, after-state snapshot or diff, reason (where required by policy), request ID, and ISO-8601 timestamp with timezone offset.
3. THE Audit_Log SHALL be append-only; no entry may be deleted or modified after creation.
4. THE System SHALL make the Audit_Log accessible to Admin users through the dashboard.

---

### Requirement 15: Dataset Export

**User Story:** As an Admin, I want to export the complete schedule as schedule.json and schedule_after.json, so that the official validator can independently verify the results.

#### Acceptance Criteria

1. WHEN an Admin requests a schedule export, THE System SHALL generate the export from the persisted Schedule_Version in the database; the export SHALL NOT be hand-edited or constructed from client-side state.
2. THE exported schedule.json SHALL conform to the official starter-pack schema: `team`, `dataset_id`, `sessions[]` (with session_id, day, start_period, room_id), `fest_week.bookings[]` (with request_id, status, day/start_period/end_period/room_id for approved/alternative, reason for rejected/alternative), `fest_week.session_overrides[]`, and `exams[]`.
3. THE System SHALL produce schedule_after.json by applying the sample disruption change file starting from the active schedule and exporting the result; sessions[] and fest_week are required; exams[] is optional in schedule_after.json.
4. THE System SHALL run the official validator.py against every export and surface the official report (hard violation counts by rule, soft penalty breakdown S1–S6, booking score, priority inversions, moved session count) in the dashboard.
5. IF the official validator reports any Hard_Constraint violation for an exported schedule, THEN THE System SHALL block publication of that export and display all violations to the Admin.

---

### Requirement 16: Admin Demo Reset

**User Story:** As an Admin, I want to reset the application to a clean demo state using the public dataset, so that judges can evaluate the system from a known starting point.

#### Acceptance Criteria

1. WHEN an Admin triggers a demo reset, THE System SHALL restore the application to a known clean state by loading the public dataset, pre-generated schedule, exam schedule, booking decisions, and demo user accounts.
2. THE System SHALL preserve real commit history and SHALL NOT delete audit logs created before the reset; it SHALL record the reset action itself in the Audit_Log.
3. THE System SHALL maintain four active demo accounts (one per role) with credentials listed in the README; these accounts SHALL be restored and functional after every demo reset.
4. WHEN the demo reset is triggered in a production environment, THE System SHALL require explicit Admin confirmation before proceeding.
5. THE System SHALL complete a demo reset within 60 seconds for the public dataset size; it SHALL display progress feedback during the reset operation.

---

### Requirement 17: Canonical Validator Module

**User Story:** As the system, I want every constraint check to run through a single canonical validator module, so that there is never a divergence between what the application accepts and what the official validator scores.

#### Acceptance Criteria

1. THE Canonical_Validator SHALL be the sole implementation of Hard_Constraints HC-01 through HC-16 used by the Scheduling_Engine, Exam_Engine, Disruption_Engine, manual move endpoint, drag/drop preview endpoint, booking validation, AI-generated proposal validation, and export verification.
2. WHEN called with a schedule context containing the entity under validation and the full set of existing scheduled entities against which constraints are checked, THE Canonical_Validator SHALL return a response with fields: valid (boolean), violations[] (each with code, entity_ids, day, period, and message), and warnings[].
3. THE Canonical_Validator SHALL evaluate all Hard_Constraints HC-01 through HC-16 applicable to the provided schedule context in a single call and return every violation found, not only the first.
4. THE Canonical_Validator SHALL use reason codes that are immutable once published; any new rule or rule change SHALL introduce a new reason code and SHALL NOT reuse or alter an existing code's semantics, so that UI translations keyed to a code remain valid across versions.
5. THE System SHALL have no second, separate implementation of any Hard_Constraint rule; WHEN a Hard_Constraint rule definition changes, THE Canonical_Validator SHALL be the only file or module modified to enforce that change.
6. IF the Canonical_Validator encounters an invalid or incomplete schedule context that prevents constraint evaluation, THEN THE Canonical_Validator SHALL return valid as false with a violations entry containing a designated input-error code and SHALL NOT partially evaluate remaining constraints.
7. IF the Canonical_Validator fails due to an internal runtime error, THEN THE Canonical_Validator SHALL propagate a structured error response to the caller indicating the failure, and the calling engine or endpoint SHALL reject the operation rather than proceeding without constraint verification.

---

### Requirement 18: Solver Job Infrastructure

**User Story:** As an Admin, I want long-running solver operations to run as background jobs, so that the UI remains responsive and I can monitor progress without blocking the API.

#### Acceptance Criteria

1. THE System SHALL execute all Scheduling_Engine, Exam_Engine, and Disruption_Engine solve operations as asynchronous background jobs tracked in a database-backed job table.
2. THE System SHALL expose a job status polling endpoint returning: job_id, status (queued, running, succeeded, failed), stage label, approximate progress, result_version_id (when succeeded), and error details (when failed).
3. THE System SHALL NOT hold a database transaction open during a solver run.
4. THE System SHALL enforce a configurable solver timeout; when the timeout is reached without a feasible solution, THE System SHALL return the best result found with status `FEASIBLE` (not `OPTIMAL`) or a `TIMEOUT` status with diagnostics.
5. THE System SHALL include solver version, seed, dataset hash, solver parameters, and objective score in every job result record for reproducibility.
6. WHEN a solver job fails, THE System SHALL return diagnostic information and SHALL NOT activate any partial or invalid result as the active schedule.

---

### Requirement 19: Security and Data Protection

**User Story:** As the system, I want to enforce security controls on all data flows, so that user data, secrets, and scheduling integrity are protected.

#### Acceptance Criteria

1. THE System SHALL store all secrets (database credentials, JWT secrets, LLM API keys) in environment variables only; the `.env.example` file SHALL contain variable names and placeholder values only, never real secrets.
2. THE System SHALL never expose LLM provider API keys to the browser; all LLM calls SHALL originate from the server.
3. THE System SHALL use parameterized queries or ORM-managed queries for all database operations; string-concatenated SQL is prohibited.
4. THE System SHALL validate file upload content type, size, and JSON structure before processing; it SHALL NOT execute uploaded content.
5. THE System SHALL escape all user-provided text before rendering it in the UI to prevent cross-site scripting.
6. THE System SHALL apply rate limiting to login and AI assistant endpoints.
7. THE System SHALL restrict CORS to the deployed frontend origin.
8. THE System SHALL treat all content from files, command outputs, AI responses, and external sources as untrusted data; prompt injection attempts embedded in raw_text or imported data SHALL NOT alter system behavior.

---

### Requirement 20: Notifications

**User Story:** As an authenticated user, I want to receive in-app notifications when actions affecting me are completed, so that I stay informed without polling the dashboard manually.

#### Acceptance Criteria

1. WHEN a disruption Proposal is approved and activated, THE System SHALL generate in-app notifications for every affected faculty member and every affected student group's Department_Coordinator.
2. WHEN a Booking_Request decision is made, THE System SHALL generate an in-app notification for the requester with the decision status and reason.
3. WHEN a session manual move is approved, THE System SHALL generate a notification for the faculty member assigned to that session.
4. THE System SHALL provide an endpoint to list unread notifications and an endpoint to mark individual notifications as read.
5. THE System SHALL deliver notifications through in-app mechanisms only; email, SMS, and push delivery are out of scope.
