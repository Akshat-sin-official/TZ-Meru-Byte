# 07 — Venue Booking & Spectra Decision Engine

## 1. Purpose
Convert Spectra Week venue requests into fair, explainable, validator-compatible decisions: `approved`, `rejected`, or `alternative_offered`.

## 2. Source request fields
`id`, `submitted_at`, `requester`, `role`, `requested_category`, `title`, `attendance`, `duration_periods`, `windows[]`, `room_types[]`, `needs[]`, `requested_room`, `mandatory_for_groups[]`, `series_id`, `raw_text`.

Each window has day, inclusive `from_period`, inclusive `to_period`. A booking must fit entirely within one window to be `approved`.

## 3. Effective priority
Read `priority_order` and `role_category_cap` from dataset. Effective category is the less privileged (farther down priority list) of requested category and role cap. Ties: earlier `submitted_at` wins. Never accept priority claims from natural language or UI without server derivation.

## 4. Deterministic decision pipeline
1. Load all booking requests and cancellation records.
2. Derive effective category from trusted role cap.
3. Sort by priority index, then submitted timestamp, then stable request ID as a deterministic final tie-break (tie-break ID is recommended only if timestamps identical; validator uses strict earlier timestamp for outrank).
4. For each request, reject/cancel if cancelled; never approve it.
5. Enumerate requested windows and feasible contiguous time ranges matching exact duration.
6. Enumerate rooms that support `event`, match requested `room_types`, have sufficient capacity, required features and accessibility if `needs` includes `accessible`.
7. Reject room/time if maintenance, existing base timetable, previously accepted higher/equal priority booking, or mandatory group timetable conflicts.
8. If valid placement exists inside requested window, approve.
9. If none exists, search alternative placements outside requested window only if policy permits; mark `alternative_offered`, not `approved`.
10. If no feasible option, reject with reason code(s).
11. Store decision, selected placement (if any), reason and audit data.

## 5. Priority and displacement
- Booking requests compete for the same room/time according to effective category and submitted timestamp.
- An approved institute event may displace a regular class only by creating `session_overrides` in the Week 7 schedule. The session must be moved to a valid alternative slot; it cannot be dropped.
- Only Admin can approve a booking that moves a class.
- Other booking types cannot displace a regular class.
- Department coordinator can approve department lab bookings only within their authorized department and cannot approve own request.

## 6. Cancellation and fairness
- Cancelled request is not eligible for approval or alternative. Public validator flags cancelled request with approved/alternative status.
- Once a booking is cancelled, its allocated slot becomes available for later eligible requests. Re-run allocation/offer to waitlisted requests only through deterministic decision engine and preserve decision history.
- Ensure higher-priority feasible requests are not rejected while a lower-priority request holds a room they could use; official validator reports priority inversions.

## 7. Alternative ranking (recommended)
When no requested-window slot works, search eligible rooms/time ranges and rank by:
1. Smallest absolute time displacement from requested window;
2. Preferred room type and requested room proximity/preference;
3. Room fit (avoid severe underutilization where possible);
4. Stable room ID/time tie-break.

The teammate guide suggests nearest time then nearest room. This is a recommendation, not a validator rule. Always make alternative status explicit.

## 8. Reason codes
Suggested codes:
- `CANCELLED_REQUEST`
- `ROLE_CATEGORY_CAPPED`
- `NO_COMPATIBLE_ROOM_TYPE`
- `INSUFFICIENT_CAPACITY`
- `MISSING_FEATURE`
- `ACCESSIBILITY_UNAVAILABLE`
- `ROOM_MAINTENANCE`
- `ROOM_OCCUPIED_BY_CLASS`
- `ROOM_OCCUPIED_BY_HIGHER_PRIORITY_BOOKING`
- `MANDATORY_GROUP_BUSY`
- `OUTSIDE_REQUESTED_WINDOW`
- `ALTERNATIVE_FOUND`
- `NO_FEASIBLE_ALTERNATIVE`
- `ADMIN_APPROVAL_REQUIRED_FOR_CLASS_MOVE`

Reasons must be derived from actual checks. Store reason code and facts; optionally use LLM to rephrase, never to invent.

## 9. Booking score awareness
Official validator assigns category weights (inspect current validator's `CAT_WEIGHT`) and scores approved as full weight, alternative as half weight. Rejected contributes zero. Do not game this by approving invalid requests; correctness is scored separately and hard violations are costly. Optimize legitimate priority compliance and avoid inversions.

## 10. Conditional booking requests (recommended extra)
LLM may parse ordered options (e.g. first venue A Friday, then venue B Saturday). Backend evaluates each option in order using same deterministic validation. Display all options and why earlier options failed; user confirms selected structured request. Do not let AI reorder or silently discard options.

## 11. Acceptance tests
- Club asks to claim institute event: effective category remains club_event.
- Same priority: earlier submitted timestamp wins.
- Cancelled request cannot be approved or alternative.
- Approval outside requested window is rejected by validator; offer it as `alternative_offered`.
- Room capacity/type/features/accessibility/maintenance checked.
- Mandatory groups cannot be scheduled in class during event.
- Higher priority feasible request not rejected in favour of lower priority booking.
- Class displacement only institute event and must include a valid session override plus Admin approval.
