# CAMPORA — Known Problems & Gaps

> Last updated: November 1, 2026  
> Based on: full audit of `optimizer/`, `server/src/routes/`, `server/src/middleware/`,
> `client/src/`, and the official starter pack (`cit_public.json`, `sample_disruption.json`,
> `sample_requests.md`, `validator.py README`).  
> Current exported validator result: `hard_violations: 0`, `soft_total: 290`, `booking_score: 66/70`.

---

## SECTION A — SOLVER & CORRECTNESS

---

### A1 — S2, S3, S4 missing from the CP-SAT solver objective

**File:** `optimizer/timetable_solver.py`  
**Criterion:** Optimisation — **−3 to −5 marks**

The validator measures all six soft penalties correctly. The solver only minimises three of them.

| Penalty | Current value | Solver minimises? |
|---|:---:|:---:|
| S1 Faculty avoidance | 0 | ✅ |
| S2 Group schedule gaps | 50 | ❌ |
| S3 Group daily overload | 48 | ❌ |
| S4 Same-course double lecture | 192 | ❌ |
| S5 Poor room utilisation | 0 | ✅ |
| S6 P9 sessions | 0 | ✅ |

S4 = 192 is 66% of the total 290. That is 64 instances of the same course taught to the same group twice in one day. The solver placed them there because it had no reason not to.

**Root cause:** The `objective_terms` block only appends terms for S1, S5, and S6. There are no terms for S2, S3, or S4 before `model.Minimize(sum(objective_terms))`.

**Fix — S4 (highest return, add before `model.Minimize`):**
```python
from collections import defaultdict
gc_day_vars = defaultdict(list)
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

**Fix — S3:**
```python
gd_hour_terms = defaultdict(list)
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

**Fix — S2 (most complex):**
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

### A2 — Sample disruption in the app does not match the official `sample_disruption.json`

**File:** `client/src/pages/campus/DisruptionsView.tsx` — `sampleDisruption` constant  
**Criterion:** Rescheduling — **direct judging risk**

The judges explicitly say they will apply `examples/sample_disruption.json` in the app. The app hardcodes its own disruption payload that differs from the official file.

**Official `sample_disruption.json`:**
- `faculty_unavailable`: F07, MON, periods 1–9
- `room_unavailable`: CR-102, MON–FRI, periods 1–9
- `add_session`: CS202-T2 (tutorial, CSE-2, F06, size 80)

**Hardcoded in `DisruptionsView.tsx`:**
```typescript
const sampleDisruption = {
    changes: [
        { type: 'faculty_unavailable', faculty_id: 'F07', days: ['MON'], periods: [1..9] },
        { type: 'room_unavailable', room_id: 'CR-102', days: ['MON','TUE','WED','THU','FRI'], periods: [1..9] },
        { type: 'add_session', session: { id: 'CS202-T2', ... faculty_id: 'F06', size: 80 ... } }
    ]
}
```

These happen to match — but the `description` field and wrapping `id`/`dataset` keys are missing, and the app doesn't read the file from the filesystem. The real risk is: **judges may upload their own change file** using the "Upload Change File" button. The custom upload path parses JSON and calls `handleRunRepair(parsed)` — but the `handleApplyRepair` button still does nothing (see B1). So even if the judge uploads the official file and repair runs correctly, approving it saves nothing.

**Fix:** Resolve B1 first. Then also update the "Simulate Sample Disruption" default to read from the actual file path served via the API, rather than a hardcoded constant, so it always stays in sync with whatever `sample_disruption.json` is on disk.

---

### A3 — Exam sizes require multi-room allocation; solver must verify this works

**File:** `optimizer/exam_solver.py`  
**Criterion:** Scheduling correctness — **potential −3 per violation**

From `cit_public.json`, several exams are very large:
- `EX-MA101`: 360 students — needs AUD (500/2=250) + LH-1 (200/2=100) + LH-2 (200/2=100) = 450 seats minimum from 3 rooms
- `EX-PH101`: 360 students — same situation  
- `EX-CS101`: 360 students — same situation  
- `EX-HS201`: 320 students across 5 departments — any single room fails

SH-1 and SH-2 have `allowed_uses: ["exam", "event"]` but capacities of 150 and 100. Labs have `allowed_uses: ["lab", "event"]` — no `"exam"` — so they cannot be used for exams.

The exam solver correctly models multi-room allocation via `w[eid, slot, rid]` boolean variables. However, the half-capacity check:
```python
sum(w[(eid, slot, rid)] * (exam_rooms[rid]["capacity"] // 2) for rid in exam_rooms)
>= needed_seats * z[(eid, slot)]
```
is a bilinear product `w * z` which CP-SAT cannot handle directly as written because both are decision variables. This should be linearised with `w[eid, slot, rid] <= z[eid, slot]` (already added) and the sum written only over rooms where `w` is 1 — which CP-SAT handles correctly via the linearisation. Verify the solve is returning `OPTIMAL` or `FEASIBLE` and that all 41 exams are scheduled in the output. The exported `validation_report.json` shows 0 exam violations so the solver is working, but this is worth double-checking if results change after a re-solve.

---

### A4 — BR-17 (Astronomy Club) requests period 13–14; period 14 does not exist

**File:** `optimizer/booking_engine.py`  
**Criterion:** Booking decisions — the engine must reject or handle this gracefully

From `cit_public.json`, BR-17 (Astronomy Club "Night sky watch") requests:
```json
"windows": [{"day": "WED", "from_period": 13, "to_period": 14}]
```
The dataset only defines periods 1–13. Period 14 does not exist. `MAX_PERIOD = 13` in the booking engine. The engine's placement loop:
```python
for start_p in range(from_p, to_p - dur + 2):  # range(13, 14 - 2 + 2) = range(13, 14)
    end_p = start_p + dur - 1  # 13 + 2 - 1 = 14
    if end_p > MAX_PERIOD:     # 14 > 13 → skip
        continue
```
This correctly skips the invalid window. But the fallback alternative search then looks for P10–P13 and may offer an alternative. That's the right outcome. Confirm the decision in the exported `spectra_allocations.json` for BR-17 is `rejected` with a reason like "window extends beyond P13" or `alternative_offered` — not `approved` at an impossible period.

---

### A5 — BR-14 requests room "LHC-5" which does not exist in the dataset

**File:** `optimizer/booking_engine.py`  
**Criterion:** Booking decisions — should not crash, should fall back to eligible rooms

From `cit_public.json`, BR-14 (Literary Society "Open Mic") has:
```json
"requested_room": "LHC-5"
```
The dataset room IDs are: AUD, LH-1 through LH-6, CR-101 through CR-205, SH-1, SH-2, OAT, CS-LAB-1, CS-LAB-2, ELEC-LAB-1, ELEC-LAB-2, PHY-LAB, MECH-WS, CIVIL-LAB. There is no `LHC-5`.

The booking engine prioritises the `pref_room` if it is in `candidate_rooms`:
```python
if pref_room in candidate_rooms:
    candidate_rooms.remove(pref_room)
    candidate_rooms.insert(0, pref_room)
```
Since `LHC-5` is not in `rooms`, it won't be in `candidate_rooms`, so the engine silently falls through to other eligible rooms. This is correct behaviour. But the reason string on the decision should acknowledge the invalid room was requested, so a judge checking decisions can see it was handled properly. Currently the reason just says category + "requested venue confirmed" without noting the room fallback.

---

## SECTION B — WORKFLOW & APPROVAL

---

### B1 — Disruption approval button does nothing

**File:** `client/src/pages/campus/DisruptionsView.tsx` — `handleApplyRepair`  
**Criterion:** Rescheduling — **−2 marks**

The rubric gives 4 of 15 rescheduling marks for "a proper approval step." Clicking "Approve & Apply" sets a local boolean and toasts. No API call. The repaired schedule is never persisted.

```typescript
const handleApplyRepair = () => {
    setApprovedCommitted(true);   // local state only
    toast.success('Repaired timetable successfully approved...');
    // NO API CALL
};
```

The `POST /api/disruptions/submit` route computes the diff and creates a `DisruptionJob` record but does not store the repaired assignments and has no commit endpoint.

Note: The faculty unavailability flow (`POST /api/faculty/unavailability`) **does** work end-to-end — it creates a `pending_approval` ScheduleVersion through the full proposal → approve pipeline. Only the general disruption path in `DisruptionsView` is broken.

**Fix:**

Step 1 — Store repaired assignments in `DisruptionJob` and add a commit route:
```typescript
// In POST /api/disruptions/submit, add to prisma.disruptionJob.create:
repairedAssignmentsJson: result.assignments

// New route:
router.post('/commit/:jobId', authenticate, requireRole([Role.admin]), async (req, res) => {
    const job = await prisma.disruptionJob.findUnique({ where: { id: req.params.jobId } });
    // Atomic: supersede current active, create new active version from job.repairedAssignmentsJson
});
```

Step 2 — Make the button call the API:
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

### B2 — "No self-approval" rule gated behind an environment variable

**File:** `server/src/routes/schedules.ts` line ~312  
**Criterion:** RBAC compliance — problem statement says "nobody can approve their own request"

```typescript
if (process.env.STRICT_SEPARATION_OF_DUTIES === 'true' && ...) {
    return res.status(403).json({ ... });
}
```

If `STRICT_SEPARATION_OF_DUTIES` is not `"true"` in the deployment env, this check never runs. It should always be enforced.

**Fix:** Remove the env var gate:
```typescript
// Before
if (process.env.STRICT_SEPARATION_OF_DUTIES === 'true' && proposal.createdById && proposal.createdById === req.user?.id) {
// After
if (proposal.createdById && proposal.createdById === req.user?.id) {
```

---

## SECTION C — RBAC

---

### C1 — Department coordinator cannot approve lab bookings

**File:** `server/src/routes/bookings.ts`  
**Criterion:** RBAC compliance — missing coordinator capability

The problem statement says coordinators can "approve bookings of their department's labs." The only booking approval route is `POST /api/bookings/solve` which is `requireRole([Role.admin])` only. There is no endpoint that allows a coordinator to approve a booking for their department's lab. The coordinator can view scoped bookings but cannot act on them.

From the dataset: CSE has CS-LAB-1 and CS-LAB-2, ECE has ELEC-LAB-1 and ELEC-LAB-2, etc. A coordinator for CSE should be able to approve a booking request for CS-LAB-1 or CS-LAB-2.

**Fix:** Add a coordinator-scoped approval endpoint that verifies the requested room belongs to the coordinator's department, and enforces the no-self-approval rule.

---

### C2 — Faculty cannot request extra or moved sessions through the UI

**File:** `client/src/pages/campus/TimetableDashboard.tsx`  
**Criterion:** RBAC compliance — missing faculty capability

The problem statement says faculty can "request extra or moved sessions." The `Mark Unavailability` flow is complete. Requesting a specific session move or a new session to be added is not implemented. The AI Copilot returns a `disruptionProposal` JSON for rescue/reschedule requests but doesn't submit it through the workflow — it just displays raw JSON for the user to read.

**Fix:** Add a "Request Session Move" action in the timetable session detail drawer for faculty role, which creates a `FacultySessionMoveRequest` record in `pending_approval` state visible in the admin proposals queue.

---

### C3 — Client-side fallback auth bypasses server RBAC silently

**File:** `client/src/contexts/CampusAuthContext.tsx`  
**Criterion:** RBAC stability — judges may appear logged in but all API calls fail

When the backend returns 500 or is unreachable, the client logs in using hardcoded `DEMO_FALLBACK_USERS` with a `mock-token-*` string. This token is not signed with the server JWT secret, so every subsequent API call returns 401. The user appears authenticated on the frontend but sees empty data everywhere.

**Fix:** Remove the client-side fallback. The server's `auth.ts` already has its own `DEMO_ACCOUNTS` fallback that works even when the DB is unreachable. Surface the real error:
```typescript
} catch (err: any) {
    throw new Error(err.response?.data?.error || 'Server unavailable. Please try again.');
}
```

---

## SECTION D — DATA & OUTPUT

---

### D1 — Soft score discrepancy between README and validation_report.json

**File:** `README.md` (~line 130)  
**Criterion:** Documentation — credibility issue

README states `soft score of 315.0`. `exports/validation_report.json` states `290`. One is from a different solver run. Run the validator against the committed `exports/schedule.json` and update the README to match.

---

### D2 — AI Copilot uses wrong room IDs in hardcoded knowledge base

**File:** `server/src/routes/assistant.ts` — `processPromptWithAI` system prompt  
**Criterion:** Use of AI — wrong answers on capacity questions

The Gemini system prompt hardcodes:
```
LH-1 (120), LH-2 (120), LH-3 (90), SH-1 (80, wheelchair accessible), SH-2 (80, upper floor WITHOUT elevator)
```

From `cit_public.json`, the actual values are:
- LH-1: **200** seats (not 120)
- LH-2: **200** seats (not 120)
- LH-3: **120** seats (not 90)
- LH-4: **120** seats — also exists
- LH-5: **120** seats — also exists
- LH-6: **120** seats — also exists
- SH-1: **150** seats (not 80)
- SH-2: **100** seats (not 80)
- OAT: **800** seats (not mentioned)

The fallback capacity response in the chat route also hardcodes:
```typescript
"Lecture Halls L1 & L2: 120 seats each"  // wrong — actual 200
"Seminar Halls SH-1 & SH-2: 80 seats each"  // wrong — actual 150 and 100
```

If a judge asks "what is the capacity of LH-1" or "can 180 people fit in LH-1", the AI will say no (120 < 180) when the answer is yes (200 > 180). This directly fails the "explain its decisions" requirement.

**Fix:** Update both the Gemini system prompt and the hardcoded fallback strings to match `cit_public.json`. Better still, load the rooms from the database and inject them into the prompt dynamically rather than hardcoding.

---

### D3 — P10–P13 event periods not rendered in the timetable grid

**File:** `client/src/pages/campus/TimetableDashboard.tsx`  
**Criterion:** Usability — Spectra booking placements are invisible

The timetable grid renders P1–P9 only. Most Spectra bookings are in P10–P13 (18:00–22:00). A judge verifying that BR-01 (Spectra Inauguration, MON P4–P5) or BR-05a–e (Dance rehearsals, P11–P12 each day) were allocated correctly cannot see them in the timetable view.

**Fix:** Add a collapsible "Evening Events (P10–P13)" section per day row showing approved bookings in those periods.

---

### D4 — Drag-and-drop is a drawer form, not live drag-and-drop

**File:** `client/src/pages/campus/TimetableDashboard.tsx`  
**Criterion:** UI/Design — described live feedback feature not present

Session cards open a drawer with dropdowns. The Python service has `/internal/batch-validate-moves` specifically for live DnD feedback but the frontend never triggers drag events.

**Fix:** Add `draggable={true}` + `onDragStart/onDragEnter/onDrop` to session cards. On hover, call `campusApi.batchValidateMoves` and colour cells green/red. All backend endpoints already exist.

---

### D5 — Session cards show IDs only, not full names

**File:** `client/src/pages/campus/TimetableDashboard.tsx`  
**Criterion:** Usability — judges must mentally map IDs

Cards show `F07`, `CR-201`, not "Dr. Pooja Das", "Classroom B-201". `facultyMap` and `roomsMap` are already loaded in the component.

**Fix:**
```tsx
// Replace
<span>{session.facultyId}</span>
// With
<span>{facultyMap.get(session.facultyId)?.name || session.facultyId}</span>
```

Also: `CR-201` is on the 2nd floor with no lift (`accessible: false`). ME-2 group `needs_accessible: true`. A visual `♿❌` warning on any assignment where `room.accessible === false && session.needsAccessible === true` would help judges verify H10 visually.

---

## SECTION E — DATASET-SPECIFIC GAPS

---

### E1 — Booking engine alternative search only looks at P10–P13; BR-10 needs a daytime slot

**File:** `optimizer/booking_engine.py` — alternative window search  
**Criterion:** Booking decisions — BR-10 may be mishandled

BR-10 (Photography Club photo exhibition) requests:
```json
"windows": [{"day": "FRI", "from_period": 1, "to_period": 9}]
```
Duration 9 periods — the entire teaching day. `room_types: ["seminar_hall"]`, `needs: ["accessible"]`.

Only SH-1 is a `seminar_hall` that is `accessible: true`. If SH-1 is occupied on FRI during teaching hours (e.g. by an exam or another booking), the primary placement fails. The alternative search then looks only at P10–P13:
```python
for p_start in range(10, MAX_PERIOD - dur + 2):  # range(10, 13 - 9 + 2) = range(10, 6) → empty!
```
For `dur = 9`, `MAX_PERIOD - dur + 2 = 13 - 9 + 2 = 6`. `range(10, 6)` is empty — the loop never runs, no alternative is found, and BR-10 is rejected with no alternative offered even if a daytime slot is available.

This is a latent bug for any request with a large duration. It only manifests when the primary window fails and the alternative search window arithmetic underflows.

**Fix:**
```python
# Replace the alternative search range
for p_start in range(1, MAX_PERIOD - dur + 2):  # search all periods, not just P10+
    p_end = p_start + dur - 1
    if p_end > MAX_PERIOD:
        continue
    # Also check this is not a teaching period if it's a teaching-only booking...
```
Alternatively, separate the alternative search into "try all remaining day/period combinations" rather than only evening slots.

---

### E2 — F26 `needs_accessible: true` — must only be assigned accessible rooms

**File:** `optimizer/timetable_solver.py` — pre-filtering  
**Criterion:** Scheduling correctness — H10 violation risk

From `cit_public.json`, F26 (Dr. Abhishek Rout, ME) has `"needs_accessible": true`. This is the only faculty member with this flag. The solver pre-filters correctly:

```python
if needs_acc and not r.get("accessible"):
    continue
```

But `needs_acc` is read from the **session** (`s.get("needs_accessible")`), not the **faculty**. If F26 teaches a session that has `"needs_accessible": false` in the session definition, the faculty accessibility requirement is ignored. The canonical validator also only checks session-level `needs_accessible`.

From the dataset, F26 teaches ME lab sessions. Checking if those sessions carry `needs_accessible: true` is critical. If they do not, F26 could be assigned to MECH-WS which is `accessible: true` — fine. But if the solver puts one of his sessions in a non-accessible room because the session flag is false, that's a hard violation waiting to happen.

The official `validator.py` checks `s.needs_accessible`, not `faculty.needs_accessible`. So the validator would not catch it as an H10 violation — but logically it is wrong. Cross-check that all sessions assigned to F26 either have `needs_accessible: true` in the session definition, or happen to only land in accessible rooms.

---

### E3 — `schedule_after.json` is a static file, not regenerated from the live schedule

**File:** `server/src/routes/exports.ts` — `GET /schedule_after.json`  
**Criterion:** Rescheduling — judges apply their own change file and expect the repaired export

The route simply serves the static file:
```typescript
router.get('/schedule_after.json', ..., async (req, res) => {
    const filePath = path.join(EXPORTS_DIR, 'schedule_after.json');
    if (fs.existsSync(filePath)) {
        return res.sendFile(filePath);
    }
});
```

When a judge applies a disruption in the app and clicks "Approve & Apply" (currently broken — see B1), the `schedule_after.json` is never written to disk. Even if B1 is fixed, the export route needs to regenerate the file from the newly active schedule version rather than serving a stale static copy.

**Fix:** After committing a disruption repair, write the new schedule to `exports/schedule_after.json`. Add an explicit "Export Disruption Schedule" action in the UI that regenerates this file on demand.

---

## Full Summary Table

| # | Problem | File | Criterion | Est. loss | Priority |
|:---:|---|---|---|:---:|:---:|
| A1 | S2/S3/S4 not in solver objective | `timetable_solver.py` | Optimisation | −3 to −5 | 🔴 High |
| A2 | Sample disruption doesn't read the real file | `DisruptionsView.tsx` | Rescheduling | risk | 🟡 Medium |
| A3 | Exam multi-room bilinear verify | `exam_solver.py` | Correctness | verify | 🟢 Low |
| A4 | BR-17 window P13–14 (P14 invalid) | `booking_engine.py` | Booking | verify | 🟢 Low |
| A5 | BR-14 requests non-existent room LHC-5 | `booking_engine.py` | Booking | −0.5 | 🟢 Low |
| B1 | Disruption approve button does nothing | `DisruptionsView.tsx` | Rescheduling | −2 | 🔴 High |
| B2 | Self-approval rule gated by env var | `schedules.ts` | RBAC | −0.5 | 🟢 Low |
| C1 | Coordinator cannot approve lab bookings | `bookings.ts` | RBAC | −1 | 🟡 Medium |
| C2 | Faculty cannot request extra/moved sessions | `TimetableDashboard.tsx` | RBAC | −0.5 | 🟡 Medium |
| C3 | Client-side fallback auth bypasses RBAC | `CampusAuthContext.tsx` | RBAC/Stability | −0.5 | 🟡 Medium |
| D1 | Soft score mismatch in README | `README.md` | Documentation | −0.5 | 🟢 Low |
| D2 | AI Copilot has wrong room capacities | `assistant.ts` | Use of AI | −1 | 🔴 High |
| D3 | P10–P13 not shown in timetable | `TimetableDashboard.tsx` | Usability | −1 | 🟡 Medium |
| D4 | Drag-and-drop is a form, not live DnD | `TimetableDashboard.tsx` | UI/Design | −1 | 🟡 Medium |
| D5 | Cards show IDs not names | `TimetableDashboard.tsx` | Usability | −0.5 | 🟢 Low |
| E1 | BR-10 alternative search underflows for dur=9 | `booking_engine.py` | Booking | −1 | 🔴 High |
| E2 | F26 needs_accessible on faculty not session | `timetable_solver.py` | Correctness | verify | 🟡 Medium |
| E3 | schedule_after.json is static, never regenerated | `exports.ts` | Rescheduling | −1 | 🔴 High |

**Estimated total mark loss if all remain: −15 to −18.**  
**Expected score with all fixes: ~83–87 / 90.**

### Fix order recommendation

1. **A1** — S4 objective term (single block of code, recovers ~150 soft penalty points)
2. **B1 + E3** — disruption commit endpoint + regenerate schedule_after.json (same feature, do together)
3. **D2** — fix hardcoded room capacities in AI assistant (5-minute text change, directly tested by judges)
4. **E1** — fix booking alternative search underflow for large durations
5. **B2** — remove env var gate from self-approval check (one-line change)
6. **D3** — render P10–P13 bookings in timetable grid
7. **A1 S3/S2** — add remaining soft penalty terms
