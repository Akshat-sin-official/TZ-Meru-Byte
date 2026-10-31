# 05 — Weekly Timetable Scheduling & Optimization Engine

## 1. Objective
Assign each session exactly once to a valid `(day, start_period, room_id)` combination, with zero hard violations and minimum soft penalty.

## 2. Recommended solver
Python + Google OR-Tools CP-SAT. Do not attempt to solve the core combinatorial model in an LLM or client JavaScript.

## 3. Candidate generation
For each session `s`:
1. Enumerate teaching days from dataset calendar.
2. Enumerate start periods 1–9 that keep the full duration within P1–P9.
3. Reject any placement crossing lunch.
4. For 3-hour lab sessions, only allow configured `lab_start_periods` (public data P2/P6).
5. Filter rooms by `room_types`, capacity, accessibility, allowed use for session kind, and room unavailability.
6. Filter faculty unavailable periods.
7. Enforce fixed slot by restricting day/start to exact values.
8. Retain candidate `(day,start,room)` values.

If any session has zero candidates, stop before solving and return an infeasibility diagnostic listing the session and reasons its candidate set is empty.

## 4. Decision variables and constraints
Let `x[s,c]` be Boolean: session `s` chooses candidate `c`.
- Exactly one candidate per session: `sum_c x[s,c] == 1`.
- For every room/day/period, at most one selected session occupies it.
- For every faculty/day/period, at most one selected session occupies it.
- For every student group/day/period, at most one non-parallel selected session occupies it.
- Basket sessions with same `basket_slot` must share day and start period; they must occupy different rooms. They are exempt from group collision against each other only, not against other sessions.
- Faculty daily duration sum <= `max_hours_per_day`.
- Fixed-slot sessions have only their fixed day/start candidates.

**Elective modeling warning:** do not simply ignore all group clashes for any session with a basket. The exemption applies only among sessions belonging to the same basket slot. A group attending an unrelated session at the same time still conflicts.

## 5. Soft objective — match validator semantics
Minimize total penalty:
- S1: 2 per period faculty teaches during an avoid preference.
- S2: 1 per empty period between first and last class for a group/day.
- S3: 3 per group-hour above 6 hours/day.
- S4: 3 per repeat lecture of same course per group/day; basket-course repetition is also counted.
- S5: 1 per session where `size / room.capacity < 0.4`.
- S6: 1 per session occupying P9.

Use integer variables/linearization for soft penalties. Ensure the model's objective exactly matches validator's scoring definitions. If time is short, prioritize hard correctness and then implement high-impact soft terms. Always report both your own score and official validator score; official score wins.

## 6. Solve strategy
- Stage 1: find any feasible solution (hard constraints only).
- Stage 2: optimize soft objective, optionally seeded with feasible solution.
- Set bounded time limit and expose solver status: OPTIMAL, FEASIBLE, INFEASIBLE, UNKNOWN/MODEL_INVALID.
- For `FEASIBLE`, candidate may be used only after canonical validation; indicate optimality not proven.
- For `INFEASIBLE`, return diagnostics; never emit a fake schedule.
- Add solver version, parameters, seed, dataset hash and objective score to run metadata.

## 7. Canonical validation API
Implement one reusable validator module used by:
- solver result verification;
- manual assignment/move;
- drag/drop preview and final drop;
- booking validation against schedule;
- AI-generated schedule proposals;
- disruption repair output.

Suggested contract:
```json
{
  "valid": false,
  "violations": [
    {"code":"FACULTY_DOUBLE_BOOKED","entity_ids":["S1","S2"],"day":"MON","period":3,"message":"Faculty F07 is already assigned in P3."}
  ],
  "warnings": []
}
```
Return all relevant violations where feasible, not only first violation. Reason codes must be stable; UI text is generated from codes + contextual data.

## 8. Performance and scalability
- Candidate precomputation avoids repeated compatibility scans.
- Build conflict sets by resource/time.
- Use CP-SAT's optional interval variables or Boolean candidate model; choose the representation that is simplest to validate and debug for 189 sessions.
- Keep the solver isolated from HTTP request lifecycle; run as a job.
- Batch validate candidate moves rather than one API call per grid cell.

## 9. Output
Return an assignment for every source session. Reject unknown/missing/duplicate session IDs. Store as a proposed schedule version; only publish after official/internal validation and required workflow approval.
