# 06 — Midsem Examination Scheduling Engine

## 1. Source facts
Public dataset contains 41 exams. Exam week is described by `calendar.exam_week`; public data uses MON–SAT and two sessions: AM 09:30–11:30 and PM 14:00–16:00. Read these values from the dataset rather than hard-coding.

Each exam has `id`, `course_ids[]`, `groups[]`, `size`, `duration_hours`. Export shape: `{exam_id, day, session, rooms:[room_id,...]}`.

## 2. Constraints enforced by official validator
- Every exam exactly once; no unknown or duplicate exam IDs.
- Day must be in exam calendar; session must be configured AM/PM (or dataset equivalent).
- Each room must exist and have `exam` in `allowed_uses`.
- Effective capacity is `floor(room.capacity / 2)` for each room; aggregate across allocated rooms must meet exam size.
- A room cannot host two exams in the same day/session.
- A student group cannot sit two exams in the same day/session.
- Validator applies a soft exam penalty of 5 for each additional exam a group has on the same day. Avoid same-day multiple exams for a group when possible.

Do not invent a faculty exam conflict constraint: the public exam validator does not check faculty for exams. If organisers provide additional exam rules, implement them as new explicit requirements and regression-test.

## 3. Recommended optimization
Decision variables: each exam chooses one `(day, exam_session)` and one or more compatible rooms. Room allocation is a set-cover/capacity assignment with exclusivity.

Practical approach:
1. Enumerate valid day/session candidates for each exam.
2. Generate room combinations or model exam-to-room allocation with CP-SAT.
3. Ensure every selected room is exam-capable.
4. Sum half-capacity seats; satisfy exam size.
5. Prevent room/group same-slot clashes.
6. Minimize same-group multiple exams per day.
7. Optionally minimize number of rooms per exam as a secondary objective, without compromising correctness.

## 4. Important implementation note
The timetable solver and exam solver may share room metadata, resource conflict utilities and validation infrastructure, but they must use different time domains and capacity rules. Do not reuse P1–P13 teaching/event period logic as exam AM/PM slots.

## 5. Acceptance tests
- Every exam appears exactly once.
- Unknown room or room without `allowed_uses: exam` is rejected.
- A room of capacity 199 contributes 99 seats (integer floor) under the validator's `capacity // 2` behaviour.
- Aggregate effective room capacity >= exam size.
- No room collision and no group same-slot collision.
- The official validator reports zero hard violations and exam penalty is measured.
