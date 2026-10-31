# 08 — Disruption & Rescheduling Engine

## 1. Objective
Apply a change file to a copy of the active dataset, repair the timetable while moving as few existing sessions as possible, show exact changes, and activate only after Admin approval.

## 2. Supported public change types
- `faculty_unavailable`: faculty ID, days[], periods[], reason.
- `room_unavailable`: room ID, days[], periods[], reason.
- `add_faculty`: faculty object with same shape as dataset faculty.
- `add_session`: session object with same shape as dataset session.
- `remove_session`: session ID.

Unknown change type must fail with explicit error. Validate all references and payloads before starting solve.

## 3. Algorithm
1. Capture active schedule version and immutable baseline assignment.
2. Apply change file to a cloned dataset snapshot; do not mutate active dataset.
3. Identify impacted sessions (faculty unavailable, room closed, added/removed session, resource conflicts).
4. Build solver model with all hard constraints.
5. Add movement Boolean `m_s` for each pre-existing session: 1 if day/start/room differs from baseline, 0 otherwise.
6. Lexicographic objectives:
   - First, zero hard violations (hard constraints are not penalties).
   - Second, minimize total moved sessions.
   - Third, minimize soft penalty.
7. New sessions are scheduled but do not count as moved existing sessions. Removed sessions are absent in target schedule and should be reported as removed, not moved.
8. Validate complete candidate with canonical validator.
9. Generate diff and impact summary.
10. Store proposal as `pending_approval`; active schedule remains unchanged.
11. Admin reviews and approves/rejects. On approval, re-check base version is still current (optimistic concurrency), revalidate candidate, atomically activate new schedule version, write audit log, create notifications.

## 4. Movement metric
A session is moved if any of day, start period or room changes, matching validator stability logic. Report:
- total moved existing sessions;
- time-changed count (day/start differs);
- room-only changed count;
- added/removed session count;
- groups/faculty affected;
- soft score before/after.

## 5. Infeasibility handling
If CP-SAT proves infeasible, return:
- solver status;
- impacted sessions and empty candidate sets;
- relevant constraints/resource conflicts;
- if available, an irreducible infeasible subset or practical conflict explanation;
- possible relaxation suggestions clearly marked as suggestions (e.g. change leave window or add room availability).

Do not claim a minimal conflict set unless solver/model actually provides one. For timeout/unknown status, say no solution was found within the time limit, not that the problem is mathematically infeasible.

## 6. Multiple proposals (optional)
Can generate up to 2–3 alternatives: minimum moves; best soft score within a movement bound. Every proposal must independently satisfy hard constraints. Keep one-click Admin comparison.

## 7. Drag/drop during proposal review (recommended extra)
- Preview endpoint validates a candidate against the proposal snapshot.
- Invalid targets return reason codes.
- Final drop repeats the exact server validation and concurrency check.
- Fixed sessions are locked; elective basket move is atomic across basket members.
- Touch devices use tap-select/tap-target.

## 8. Acceptance tests
- Sample disruption applies F07 Monday unavailability, CR-102 weekday closure, and adds CS202-T2.
- Output includes new session exactly once, preserves all remaining sessions exactly once, no hard violations.
- Minimize moved sessions and compare using official validator `--disruption` + `--baseline`.
- Proposal does not alter active schedule before Admin approval.
- Unauthorized user cannot approve; requester cannot self-approve.
- Concurrent baseline change prevents stale proposal activation.
