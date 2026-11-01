# CAMPORA — Known Problems & Gaps

> Last updated: November 1, 2026
> Based on: full code audit of `optimizer/`, `server/src/routes/`, `server/src/middleware/`,
> `client/src/pages/`, `client/src/contexts/`, and `client/src/components/`.
>
> Current exported validator result: `hard_violations: 0`, `soft_total: 290`, `booking_score: 66/70`.

Each problem is classified by:
- **Area** — which part of the system it affects
- **Impact** — judging criterion and estimated mark loss
- **Root cause** — exactly what is wrong in the code
- **Fix** — what needs to change

---

## SECTION A — SOLVER & CORRECTNESS PROBLEMS

---

### Problem A1 — S2, S3, S4 missing from the CP-SAT solver objective

#### Area
`optimizer/timetable_solver.py` — soft penalty objective function

#### Impact
**Optimisation criterion — estimated −3 to −5 marks**

The optimisation criterion compares soft penalty scores across teams. Lower is better.
The current exported score is **290**. Of that:

| Penalty | Current value | Solver minimises it? |
|---|:---:|:---:|
| S1 — Faculty avoidance | 0 | ✅ Yes |
| S2 — Group schedule gaps | 50 | ❌ No |
| S3 — Group daily overload | 48 | ❌ No |
| S4 — Same-course double lecture | 192 | ❌ No |
| S5 — Poor room utilisation | 0 | ✅ Yes |
| S6 — P9 sessions | 0 | ✅ Yes |

S4 alone is 192 points — 66% of the total. Any team that includes S4 in their objective
will eliminate most of those 64 instances and beat this score by a wide margin.

#### Root cause

`timetable_solver.py`, the `objective_terms` block (~line 160–185):

```python
# S1: Faculty avoided preferences — added ✅
# S5: Room utilisation < 40%      — added ✅
# S6: Late teaching in Period 9   — added ✅
model.Minimize(sum(objective_terms))
```

There are no terms for S2 (gap counting), S3 (daily hour excess), or S4 (same-course repeats).
The solver places sessions wherever is feasible with no preference for avoiding these patterns.

#### Fix

Add auxiliary integer variables and objective terms before `model.Minimize(...)`.
**Recommended order: S4 first (biggest return, least complexity), then S3, then S2.**

**S4 — Same-course double lecture (3 pts per extra lecture per group per day):**
```python
from collections import defaultdict
gc_day_vars = defaultdict(list)  # (group, day, course_id) -> [bool_var, ...]
for (s_id, d, p, r_id), var in x.items():
    s = sessions[s_id]
    if s.get("kind") == "lecture" and not s.get("basket_slot"):
        for g in s["groups"]:
            gc_day_vars[(g, d, s["course_id"])].append(var)

for (g, d, c_id), var_list in gc_day_vars.items():
    if len(var_list) > 1:
        count_var = model.NewIntVar(0, len(var_list), f"s4_{g}_{d}_{c_id}")
        model.Add(count_var == sum(var_list))
        excess = model.NewIntVar(0, len(var_list), f"s4ex_{g}_{d}_{c_id}")
        model.AddMaxEquality(excess, [count_var - 1, model.NewConstant(0)])
        objective_terms.append(3 * excess)
```

**S3 — Group daily overload (3 pts per hour over 6):**
```python
gd_hour_terms = defaultdict(list)  # (group, day) -> [(var, duration), ...]
for (s_id, d, p, r_id), var in x.items():
    s = sessions[s_id]
    for g in s["groups"]:
        gd_hour_terms[(g, d)].append((var, s["duration"]))

for (g, d), terms in gd_hour_terms.items():
    total_possible = sum(dur for _, dur in terms)
    if total_possible <= 6:
        continue
    hours_var = model.NewIntVar(0, total_possible, f"s3h_{g}_{d}")
    model.Add(hours_var == sum(v * dur for v, dur in terms))
    excess = model.NewIntVar(0, total_possible, f"s3ex_{g}_{d}")
    model.AddMaxEquality(excess, [hours_var - 6, model.NewConstant(0)])
    objective_terms.append(3 * excess)
```

**S2 — Group schedule gaps (1 pt per idle period between first and last class):**
This requires `first_period` and `last_period` integer variables per (group, day),
constrained by period occupancy indicators. Most complex, but the pattern is:
```python
for g_id in {g for s in sessions.values() for g in s["groups"]}:
    for d in days:
        period_occ = {}
        for pt in range(1, LAST_TEACHING + 1):
            entries = grp_slots.get((g_id, d, pt), [])
            if entries:
                occ = model.NewBoolVar(f"gocc_{g_id}_{d}_{pt}")
                model.AddMaxEquality(occ, [var for (var, sid, is_b, bslot) in entries])
                period_occ[pt] = occ
        if len(period_occ) < 2:
            continue
        all_pts = sorted(period_occ)
        first_p = model.NewIntVar(all_pts[0], all_pts[-1], f"gfirst_{g_id}_{d}")
        last_p  = model.NewIntVar(all_pts[0], all_pts[-1], f"glast_{g_id}_{d}")
        for pt, occ_var in period_occ.items():
            model.Add(first_p <= pt).OnlyEnforceIf(occ_var)
            model.Add(last_p  >= pt).OnlyEnforceIf(occ_var)
        span = model.NewIntVar(0, LAST_TEACHING, f"gspan_{g_id}_{d}")
        model.Add(span == last_p - first_p + 1)
        total_occ = model.NewIntVar(0, LAST_TEACHING, f"gtot_{g_id}_{d}")
        model.Add(total_occ == sum(period_occ.values()))
        gap = model.NewIntVar(0, LAST_TEACHING, f"ggap_{g_id}_{d}")
        model.Add(gap == span - total_occ)
        objective_terms.append(gap)
```

---

## SECTION B — WORKFLOW & APPROVAL PROBLEMS

---

### Problem B1 — Disruption approval button does nothing

#### Area
`client/src/pages/campus/DisruptionsView.tsx` — `handleApplyRepair` function

#### Impact
**Rescheduling criterion — estimated −2 marks**

The rubric awards 4 of the 15 rescheduling marks for "a clear view of the changes and a
proper approval step." The approval button is visible and correctly styled, but clicking
it makes no API call and commits nothing to the database.

#### Root cause

```typescript
// DisruptionsView.tsx
const handleApplyRepair = () => {
    setApprovedCommitted(true);   // sets a local boolean
    toast.success('Repaired timetable successfully approved...');
    // NO API CALL — the repaired schedule is never persisted
};
```

`POST /api/disruptions/submit` runs the solver, stores a `DisruptionJob` record, and
returns the diff — but it does NOT create a `ScheduleVersion` or activate the result.
There is no commit endpoint for the general disruption flow.

Note: The **faculty unavailability** flow (`POST /api/faculty/unavailability`) DOES work
end-to-end — it creates a `pending_approval` `ScheduleVersion` that goes through the full
proposal → approve pipeline. Only the general disruption path in `DisruptionsView` is broken.

#### Fix

**Step 1** — `disruptions.ts`: Store repaired assignments in the `DisruptionJob` and add a
commit endpoint:
```typescript
// In /api/disruptions/submit: add to job creation
repairedAssignmentsJson: result.assignments  // store on the job record

// New endpoint:
router.post('/commit/:jobId', authenticate, requireRole([Role.admin]), async (req, res) => {
    const job = await prisma.disruptionJob.findUnique({ where: { id: req.params.jobId } });
    // Supersede current active version, create new active version from job.repairedAssignmentsJson
    // (same atomic transaction pattern as schedules/proposals/:id/approve)
});
```

**Step 2** — `DisruptionsView.tsx`: Replace the local state toggle with a real API call:
```typescript
const handleApplyRepair = async () => {
    if (!repairResult?.jobId) return;
    try {
        await campusApi.commitDisruptionRepair(repairResult.jobId);
        setApprovedCommitted(true);
        toast.success('Repaired timetable committed to live operations.');
    } catch (err: any) {
        toast.error('Failed to commit: ' + (err.response?.data?.error || err.message));
    }
};
```

---

### Problem B2 — "No self-approval" rule is opt-in, not enforced

#### Area
`server/src/routes/schedules.ts` — `POST /api/schedules/proposals/:id/approve`

#### Impact
**RBAC compliance — rule from problem statement: "nobody can approve their own request"**

#### Root cause

```typescript
// schedules.ts line ~312
if (process.env.STRICT_SEPARATION_OF_DUTIES === 'true' && proposal.createdById && ...) {
    return res.status(403).json({ error: 'You cannot approve your own proposal.' });
}
```

The check is **gated behind an environment variable** `STRICT_SEPARATION_OF_DUTIES`.
If that variable is not set to `"true"` in the deployment environment (which is not
guaranteed), the rule is silently skipped. The problem statement says this is a hard
requirement: "nobody can approve their own request." It should always be enforced.

#### Fix

Remove the environment variable gate:
```typescript
// Before
if (process.env.STRICT_SEPARATION_OF_DUTIES === 'true' && proposal.createdById && proposal.createdById === req.user?.id) {

// After — always enforce
if (proposal.createdById && proposal.createdById === req.user?.id) {
```

---

## SECTION C — RBAC PROBLEMS

---

### Problem C1 — Department coordinator cannot approve lab bookings

#### Area
`server/src/routes/bookings.ts` — `POST /api/bookings/solve`

#### Impact
**RBAC compliance — missing coordinator capability from the problem statement**

The problem statement says: the coordinator can **"approve bookings of their department's
labs."** No such endpoint or capability exists anywhere in the system.

#### Root cause

`POST /api/bookings/solve` is `requireRole([Role.admin])` only. There is no route that
allows a coordinator to review or approve a booking request that involves their
department's lab rooms. The coordinator can view bookings scoped to their department
(the GET route filters by role), but cannot take any approval action on them.

The concept of lab booking approval by a coordinator is also absent from the frontend —
`SpectraBookingsView.tsx` shows decisions as read-only for non-admin roles.

#### Fix

Add a coordinator-accessible approval endpoint that gates on department ownership of the lab:
```typescript
// bookings.ts — new route
router.post('/approve-lab/:requestId',
    authenticate,
    requireRole([Role.department_coordinator, Role.admin]),
    async (req: AuthenticatedRequest, res) => {
        const request = await prisma.bookingRequest.findUnique({ where: { externalId: req.params.requestId } });
        // Verify the requested room is a lab belonging to the coordinator's department
        const room = await prisma.room.findFirst({ where: { externalId: request.requestedRoom } });
        const coordDept = req.user?.department;
        if (req.user?.role !== Role.admin && !room?.externalId.toUpperCase().includes(coordDept)) {
            return res.status(403).json({ error: 'You can only approve bookings for your department labs.' });
        }
        // Self-approval check
        if (request.createdById === req.user?.id) {
            return res.status(403).json({ error: 'You cannot approve your own request.' });
        }
        // Apply approval...
    }
);
```

On the frontend, show an "Approve Lab Booking" button in `SpectraBookingsView` when the
logged-in role is `department_coordinator` and the request is for a lab room in their department.

---

### Problem C2 — Faculty cannot request extra or moved sessions through the UI

#### Area
`client/src/pages/campus/TimetableDashboard.tsx`, `server/src/routes/faculty.ts`

#### Impact
**RBAC compliance — missing faculty capability from the problem statement**

The problem statement says faculty can **"request extra or moved sessions."**

#### Root cause

The faculty `Mark Unavailability` flow is well-implemented: faculty marks a slot as
unavailable → the disruption solver re-schedules their sessions → an admin approval
proposal is created.

However, **requesting a new extra session** or **requesting a specific session be moved**
to a different slot is not implemented. There is no UI element or API endpoint for
faculty to submit a move/add request that gets routed to admin for approval.

The AI Copilot partially covers this — a faculty member can type "move CS201 to
Thursday afternoon" and get a `disruptionProposal` JSON back — but:
1. The proposal is displayed as raw JSON for the user to copy-paste, not submitted
   automatically through the workflow.
2. The underlying route (`POST /api/faculty/unavailability`) only handles the
   "unavailability" case, not "I want to move session X to slot Y."

#### Fix

Extend the timetable session detail drawer (already exists for admins) to show a
"Request Move" button when the role is `faculty`. Submitting it creates a
`FacultySessionMoveRequest` record in `pending_approval` state that shows up in the
admin proposals queue — same flow as the unavailability proposal.

---

### Problem C3 — Client-side fallback auth bypasses server-side RBAC

#### Area
`client/src/contexts/CampusAuthContext.tsx` — `login` function

#### Impact
**Security / RBAC integrity — judges can log in with a fake role if the server is down**

#### Root cause

```typescript
// CampusAuthContext.tsx
} catch (err: any) {
    // Resilient client-side fallback if backend encounters 500 or network failure
    const fallbackUser = DEMO_FALLBACK_USERS[cleanEmail];
    if (fallbackUser) {
        const mockToken = `mock-token-${fallbackUser.role}-${Date.now()}`;
        localStorage.setItem('cit_token', mockToken);
        setUser(fallbackUser);
        return;  // logged in with a hardcoded role, no server involvement
    }
```

When the backend is unreachable or throws a 500, the client logs the user in using a
hardcoded `DEMO_FALLBACK_USERS` object and issues a `mock-token-*` JWT. This token is not
signed with the server's `JWT_SECRET`, so any subsequent API call with it will fail
`jwt.verify()` and return `401`. The user appears logged in on the frontend but all API
calls will fail silently.

Worse: a judge evaluating the live app with a slow network connection could appear to be
logged in as Admin but see empty data everywhere — a very confusing experience.

#### Fix

Remove the client-side fallback auth entirely. If the server is down, show a clear error:
```typescript
} catch (err: any) {
    // Do NOT fall back to hardcoded users. Surface the real error.
    throw new Error(err.response?.data?.error || 'Server unavailable. Please try again.');
}
```

The server already has its own demo account fallback (`DEMO_ACCOUNTS` in `auth.ts`) that
works even when the database is unreachable, so the client fallback is redundant and
harmful.

---

## SECTION D — UX & OUTPUT PROBLEMS

---

### Problem D1 — Soft score discrepancy between README and validation_report.json

#### Area
`README.md` (~line 130), `exports/validation_report.json`

#### Impact
**Code and documentation — credibility issue with judges**

#### Root cause

`README.md` states: `soft score of 315.0 for the published baseline`.
`exports/validation_report.json` states: `"soft_total": 290`.

These are inconsistent — one of them was generated from a different schedule version.
Judges who notice the mismatch will question which number to trust.

#### Fix

Run the official validator against the currently committed `exports/schedule.json`:
```bash
python validator.py --data data/cit_public.json --schedule exports/schedule.json
```
Update the README table to the verified number from this run. The `validation_report.json`
value (290) is more likely correct since it was generated programmatically.

---

### Problem D2 — P10–P13 event periods not rendered in the timetable grid

#### Area
`client/src/pages/campus/TimetableDashboard.tsx` — grid rendering

#### Impact
**Usability — Spectra booking placements are invisible in the timetable view**

#### Root cause

The timetable grid renders P1–P9 only. Approved Spectra bookings placed in P10–P13
(18:00–22:00) by the booking engine have no visual representation anywhere in the
timetable. A judge verifying that a booking was placed in an evening slot sees nothing.

#### Fix

Add a collapsed "Evening Events (P10–P13)" row per day in the timetable grid that
expands to show any approved bookings in those periods. Booking decisions are already
available from the active schedule data — they just need to be rendered.

---

### Problem D3 — Drag-and-drop is a form, not live drag-and-drop

#### Area
`client/src/pages/campus/TimetableDashboard.tsx` — session card interaction

#### Impact
**UI/Design — described live feedback feature not present**

#### Root cause

Clicking a session card opens a detail drawer with dropdown selects for Target Day,
Period, and Room. The user clicks "Validate Move" → "Apply Move." This is a manual
move form. The Python service has a `/internal/batch-validate-moves` endpoint purpose-built
for live drag-and-drop feedback, but the frontend never calls it during drag operations
because there are no drag operations.

#### Fix

Use the HTML5 Drag and Drop API:
1. Add `draggable={true}` and `onDragStart` to session cards (stores `session_id`).
2. Add `onDragEnter` to grid cells — call `campusApi.batchValidateMoves` with the
   hovered slot as a candidate.
3. Apply `border-green-500 bg-green-50` or `border-red-500 bg-red-50` based on the result.
4. On `onDrop`, call `applyMove` if valid.

All required backend endpoints already exist. This is a frontend-only change.

---

### Problem D4 — Session cards show IDs only, not full names

#### Area
`client/src/pages/campus/TimetableDashboard.tsx` — `renderPeriodBlock`

#### Impact
**Usability — judges must mentally cross-reference IDs to verify constraints**

#### Root cause

Session cards show `CS201`, `LH-1`, `F07`. Full names (`facultyMap`, `roomsMap`) are
already loaded in the component but not rendered in the card body.

#### Fix

```tsx
// Before
<span className="truncate">{session.facultyId}</span>

// After
<span className="truncate">
    {facultyMap.get(session.facultyId)?.name || session.facultyId}
</span>
```

Same for room name. Optionally add a `♿` indicator when `room.accessible` and
`session.needsAccessible` are both true.

---

## Summary Table

| # | Problem | Area | Criterion | Est. mark loss | Fix complexity |
|:---:|---|---|---|:---:|:---:|
| A1 | S2, S3, S4 not in solver objective | `timetable_solver.py` | Optimisation | −3 to −5 | Medium |
| B1 | Disruption approval button does nothing | `DisruptionsView.tsx` | Rescheduling | −2 | Medium |
| B2 | Self-approval rule is opt-in via env var | `schedules.ts` | RBAC | −0.5 | Trivial |
| C1 | Coordinator cannot approve lab bookings | `bookings.ts` | RBAC / Usability | −1 | Medium |
| C2 | Faculty cannot request extra/moved sessions | `TimetableDashboard.tsx` | RBAC / Usability | −0.5 | Medium |
| C3 | Client-side fallback auth bypasses server RBAC | `CampusAuthContext.tsx` | RBAC / Stability | −0.5 | Trivial |
| D1 | Soft score discrepancy in README vs JSON | `README.md` | Documentation | −0.5 | Trivial |
| D2 | P10–P13 not rendered in timetable grid | `TimetableDashboard.tsx` | Usability | −1 | Low |
| D3 | Drag-and-drop is a form, not live DnD | `TimetableDashboard.tsx` | UI/Design | −1 | High |
| D4 | Session cards show IDs not names | `TimetableDashboard.tsx` | Usability | −0.5 | Trivial |

**Total estimated mark loss if all 10 problems remain: −11 to −13 marks.**
**Expected score with all fixes applied: ~83–87 / 90.**

---

## RBAC Quick Reference (from problem statement)

| Role | Can do | Backend enforced? |
|---|---|:---:|
| Admin | Everything | ✅ All admin routes use `requireRole([Role.admin])` |
| Coordinator | Dept timetable view, dept bookings, **approve dept lab bookings** | ⚠️ View scoped ✅ but lab approval missing ❌ |
| Faculty | Own timetable view, mark unavailability, **request moved/extra sessions** | ⚠️ View + unavailability ✅ but session requests missing ❌ |
| Club | Submit/cancel bookings, view own request status + reasons | ✅ Fully implemented |
| All roles | Cannot approve own request | ⚠️ Implemented but gated behind env var (Problem B2) |
