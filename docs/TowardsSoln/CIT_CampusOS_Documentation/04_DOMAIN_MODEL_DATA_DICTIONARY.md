# 04 — Domain Model & Data Dictionary

## 1. Dataset root
The public `cit_public.json` root contains: `dataset_id`, `institute`, `calendar`, `priority_order`, `role_category_cap`, `rooms`, `room_unavailability`, `faculty`, `student_groups`, `courses`, `sessions`, `booking_requests`, `cancellations`, `exams`.

Do not assume every imported dataset has the same counts. Validate required fields and preserve unknown optional fields where possible.

## 2. Source entities
### Room
`id`, `name`, `building`, `type`, `capacity`, `features[]`, `accessible`, `allowed_uses[]`.
Room type values in public README include classroom, lecture_hall, auditorium, seminar_hall, outdoor, lab_cs, lab_elec, lab_phy, workshop, lab_civil. Use actual dataset values, not a hard-coded enum that rejects future valid values.

### Room unavailability
`room_id`, `day`, `periods[]`, `reason`.

### Faculty
`id`, `name`, `department`, `max_hours_per_day`, `needs_accessible`, `unavailable[]`, `preferences[]`.
Unavailability entries contain `day`, `periods[]`, `reason`. Preferences include `type: avoid`, `days[]`, `periods[]`, `note`.

### Student group
`id`, `name`, `year`, `department`, `size`, `needs_accessible`.

### Course
Reference data: `id`, `title`, `department`, `year`, `lecture_hours`, `tutorial_hours`, `lab_blocks`. Sessions, not courses, are scheduled.

### Session
`id`, `course_id`, `kind` (`lecture|tutorial|lab`), `groups[]`, `faculty_id`, `size`, `duration`, `room_types[]`, `needs_accessible`, `basket_slot|null`, `fixed_slot|null`.
Assignment is one `day`, `start_period`, `room_id`.

### Booking request
`id`, `submitted_at`, `requester`, `role`, `requested_category`, `title`, `attendance`, `duration_periods`, `windows[]`, `room_types[]`, `needs[]`, `requested_room|null`, `mandatory_for_groups[]`, `series_id|null`, `raw_text`.
A window contains `day`, `from_period`, `to_period`. Endpoints are inclusive in the export/validator model.

### Cancellation
`request_id`, `cancelled_at`, `by`, `note`.
Cancelled requests must not be approved or offered an alternative.

### Exam
`id`, `course_ids[]`, `groups[]`, `size`, `duration_hours`.
Exam calendar is in `calendar.exam_week`.

## 3. Recommended relational model
Use normalized operational tables with explicit foreign keys. Keep a source JSON snapshot for import fidelity and export/debugging.

- `dataset_versions(id, dataset_id, version, source_hash, source_json, imported_by, created_at, is_active)`
- `rooms(id, dataset_version_id, external_id, name, building, type, capacity, accessible, features_json, allowed_uses_json)`
- `faculty(id, dataset_version_id, external_id, name, department, max_hours_per_day, needs_accessible, preferences_json)`
- `faculty_unavailability(id, faculty_id, day, periods_json, reason)`
- `student_groups(id, dataset_version_id, external_id, name, year, department, size, needs_accessible)`
- `courses(id, dataset_version_id, external_id, title, department, year, metadata_json)`
- `sessions(id, dataset_version_id, external_id, course_external_id, kind, faculty_external_id, size, duration, room_types_json, needs_accessible, basket_slot, fixed_slot_json)`
- `session_groups(session_id, group_external_id)`
- `room_unavailability(id, room_external_id, day, periods_json, reason)`
- `schedule_versions(id, dataset_version_id, parent_version_id, status, solver_config_json, hard_violation_count, soft_score, created_by, approved_by, created_at, activated_at)`
- `schedule_assignments(id, schedule_version_id, session_external_id, day, start_period, room_external_id)`
- `exams(id, dataset_version_id, external_id, metadata_json)`
- `exam_allocations(id, schedule_version_id, exam_external_id, day, exam_session, room_external_id)`
- `booking_requests(id, dataset_version_id, external_id, requester, role, requested_category, effective_category, submitted_at, raw_text, payload_json, status)`
- `booking_decisions(id, booking_request_id, decision_status, day, start_period, end_period, room_external_id, reason_code, reason_text, decided_by, decided_at)`
- `session_overrides(id, schedule_version_id, session_external_id, day, start_period, room_external_id, displaced_by_request_external_id)`
- `disruption_jobs(id, base_schedule_version_id, change_payload_json, status, result_version_id, diagnostics_json, created_by, approved_by)`
- `schedule_diffs(id, disruption_job_id, session_external_id, old_assignment_json, new_assignment_json, change_type)`
- `approvals(id, subject_type, subject_id, requested_by, approver_id, status, decision_note, decided_at)`
- `notifications(id, user_id, type, payload_json, read_at, created_at)`
- `audit_logs(id, actor_user_id, action, entity_type, entity_id, before_json, after_json, reason, created_at)`
- `users(id, email, password_hash, role, faculty_external_id, department, active)`

Use unique constraints on `(dataset_version_id, external_id)` and `(schedule_version_id, session_external_id)`. Avoid using external IDs as globally unique primary keys across dataset versions.

## 4. Important domain distinctions
- `course` is not the scheduling unit; `session` is.
- `basket_slot` represents parallel elective options; basket members share day/start but occupy separate rooms.
- `mandatory_for_groups` on a booking means those groups must be free during the event.
- `room_types` is an allowed type list, not a preferred room name.
- `requested_room` is a preference; it may be null or invalid.
- `role` caps the maximum category a requester can claim.
- `requested_category` is untrusted until converted to `effective_category` by policy.
- `schedule_version` is immutable; active schedule is a pointer, not mutable assignment rows.

## 5. Import rules
- Parse and validate full file before activating it.
- Validate unique IDs, references, period ranges, supported days, session duration, room references, faculty/group references and required fields.
- Keep original raw JSON and compute a content hash.
- Import should be idempotent for the same dataset version/hash.
- Never silently discard unknown fields or malformed records; return path-specific errors.
