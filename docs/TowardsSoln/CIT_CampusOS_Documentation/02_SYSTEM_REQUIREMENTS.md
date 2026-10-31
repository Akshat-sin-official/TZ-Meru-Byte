# 02 — System Requirements & Acceptance Criteria

## 1. Calendar and time model (source: starter pack)
- Teaching days: `MON`, `TUE`, `WED`, `THU`, `FRI`.
- Teaching periods P1–P9, one hour each: P1 08:00–09:00, P2 09:00–10:00, P3 10:00–11:00, P4 11:00–12:00, P5 12:00–13:00, lunch 13:00–14:00, P6 14:00–15:00, P7 15:00–16:00, P8 16:00–17:00, P9 17:00–18:00.
- Event-only periods P10–P13: 18:00–22:00.
- Session duration `d` at start `p` occupies inclusive periods `p ... p+d-1`.
- No teaching session may cross lunch. Three-hour labs start only P2 or P6.
- Exam week comes from `calendar.exam_week`: days MON–SAT and sessions AM 09:30–11:30, PM 14:00–16:00 in the public dataset. Always read this dynamically.

## 2. Hard constraints — must have zero violations
| ID (internal) | Requirement |
|---|---|
| HC-01 | Every session scheduled exactly once with one day, start period and room |
| HC-02 | Faculty member cannot overlap themselves |
| HC-03 | Student group cannot overlap itself; combined sessions count for every listed group |
| HC-04 | Same elective basket slot runs same day/start; basket members are parallel alternatives and do not clash with one another, but still clash with non-basket sessions |
| HC-05 | Room cannot be double-booked |
| HC-06 | Room capacity >= session size; exam capacity is floor(room capacity / 2) per room |
| HC-07 | Room type must match session allowed `room_types` |
| HC-08 | Faculty unavailability respected |
| HC-09 | Room maintenance/unavailability respected |
| HC-10 | No session crosses lunch; three-hour labs only P2/P6; teaching stays P1–P9 |
| HC-11 | Accessibility requirement must be met by room |
| HC-12 | Faculty daily teaching duration <= faculty `max_hours_per_day` (public data usually 4) |
| HC-13 | Fixed-slot session remains at exact day and start period |
| HC-14 | Approved booking cannot overlap timetable session/booking in same room or mandatory group timetable |
| HC-15 | An event booking must fit room event use, room type, capacity, features and requested duration |
| HC-16 | A regular session is not displaced by a booking unless the effective booking category is `institute_event`; displaced session must be represented as an override, not dropped |

The official validator is definitive for the organiser's scoring. Keep the internal rule map aligned with its current implementation and rerun it after every meaningful change.

## 3. Soft constraints — minimize, never trade against hard validity
The public validator calculates:
- S1: faculty avoid preference: 2 points per avoided teaching period.
- S2: group idle gap between first and last occupied period on a day; lunch is naturally outside teaching period IDs.
- S3: group daily hours above 6: 3 points per excess hour.
- S4: repeated lecture of same course for a group on same day: 3 points per repeat; basket lecture repetition is also counted.
- S5: room utilization below 40%: 1 point per session.
- S6: any session occupying P9: 1 point.

Use the exact supplied validator as the scoring oracle; do not substitute a different interpretation. Build hard constraints as hard solver constraints, then optimize the exact soft penalties where practical.

## 4. Booking priority and role caps
Priority order from data: `exam`, `regular_session`, `institute_event`, `guest_lecture`, `department_event`, `club_event`.
Role caps from data: admin → institute_event; faculty → guest_lecture; department_coordinator → department_event; club → club_event. Effective category is the lower priority (farther down the order) of requested category and role cap. Earlier `submitted_at` wins ties. Admin-configurable priority is allowed by PS; if changed, persist a versioned policy and apply consistently.

## 5. Functional acceptance criteria
- Import: reject malformed datasets with actionable field-path errors; do not partially replace active dataset.
- Generate: produce one assignment for each session; no unknown or duplicate IDs; validate before publish/export.
- Exams: every exam exactly once; valid day/session; every room allowed for exams; aggregate half-capacity sufficient; no room/group same-slot clash.
- Bookings: every non-cancelled request receives a decision; cancelled request never approved/alternative; approval inside requested window; alternative may be outside window and is explicitly marked; reasons required by application policy for every decision.
- Disruption: apply supported change types to a copy; preserve baseline; produce valid candidate; minimize movements; diff before/after; do not activate before Admin approval.
- AI: structured schema only; ask clarification for ambiguity; user reviews before submission; deterministic validation before any write.
- Manual: unauthorized actions denied server-side; invalid move denied with reason codes.
- Dashboard: all three timetable dimensions and required operational summaries available.
- Export: exact starter-pack schema and official validator pass.

## 6. Non-functional requirements
- Deterministic, repeatable solver output for same dataset/configuration/seed where solver settings permit.
- Solver operations must not block API request threads; expose job status.
- Idempotent imports and guarded publish/approval actions.
- Transactional writes for schedule activation and approvals.
- Clear error states; no silent fallback to stale schedules.
- Responsive data views; phone interaction may use tap-to-select instead of drag.
- Maintainability: single shared hard-constraint implementation or a single canonical rule module; no duplicated divergent checks.
