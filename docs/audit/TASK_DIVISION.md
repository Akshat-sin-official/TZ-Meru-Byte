# CAMPORA — Parallel AI Execution Task Division

To ensure rapid, collision-free execution for the hackathon presentation, the 10 problems from `PROBLEMS.md` are divided into two completely isolated workstreams across independent files.

---

## Workstream 1: AI-1 (Assigned to Antigravity — IN PROGRESS)
**Domain:** Backend API, Disruption Persistence, RBAC Approvals, Lab Booking Authority.

| Task ID | Problem | Files Owned | Scope & Acceptance Criteria | Status |
|---|---|---|---|:---:|
| **W1-D1** | **Problem D1** | `README.md` | Match soft penalty score (290) between README and `exports/validation_report.json`. | **COMPLETED** |
| **W1-C3** | **Problem C3** | `client/src/contexts/CampusAuthContext.tsx` | Eliminate insecure client-side `mock-token-*` fallback auth; surface real backend errors. | **COMPLETED** |
| **W1-B1** | **Problem B1** | `server/src/routes/disruptions.ts`<br>`client/src/services/api.ts`<br>`client/src/pages/campus/DisruptionsView.tsx` | 1. In `POST /api/disruptions/submit`, persist repaired assignments into `DisruptionJob`.<br>2. Implement `POST /api/disruptions/commit/:jobId` (supersedes active schedule, activates repaired schedule, updates `schedule_after.json`).<br>3. Wire frontend `handleApplyRepair` to call the commit endpoint. | **IN PROGRESS** |
| **W1-B2** | **Problem B2** | `server/src/routes/schedules.ts` | 1. In `POST /api/schedules/generate`, auto-schedule directly activates with zero self-approval clash for Admin.<br>2. Enforce strict separation of duties for subordinate proposals. | **QUEUED** |
| **W1-C1** | **Problem C1** | `server/src/routes/bookings.ts`<br>`client/src/services/api.ts`<br>`client/src/pages/campus/SpectraBookingsView.tsx` | 1. Add `POST /api/bookings/approve-lab/:requestId` allowing department coordinators (and admin) to approve lab requests for their department's labs.<br>2. Add "Approve Lab Booking" button in `SpectraBookingsView.tsx` for coordinator. | **QUEUED** |

---

## Workstream 2: AI-2 (Assigned to Other AI — COMPLETED)
**Domain:** CP-SAT Solver Soft Objectives, Timetable Dashboard Enhancements & Faculty Requests.
> **Prompt for AI-2**: *"You are working on Workstream 2. Do NOT edit `disruptions.ts`, `bookings.ts`, `CampusAuthContext.tsx`, or `SpectraBookingsView.tsx`. Your scope is strictly `optimizer/timetable_solver.py`, `client/src/pages/campus/TimetableDashboard.tsx`, and `server/src/routes/faculty.ts`."*

| Task ID | Problem | Files Owned | Scope & Detailed Instructions | Status |
|---|---|---|---|:---:|
| **W2-A1** | **Problem A1** | `optimizer/timetable_solver.py` | Add soft penalty objective terms for **S4** (same-course double lecture = 3 pts/excess) and **S3** (daily overload > 6h = 3 pts/excess) into `objective_terms` before `model.Minimize(...)`. Follow the exact CP-SAT formulation given in `PROBLEMS.md` lines 63–99. Keep solve time under 25s. | **COMPLETED** |
| **W2-D4** | **Problem D4** | `client/src/pages/campus/TimetableDashboard.tsx` | In `renderPeriodBlock`: display full faculty name (`facultyMap.get(session.facultyId)?.name || session.facultyId`) instead of raw ID `F19`. Display ♿ badge if `room.accessible && session.needsAccessible`. | **COMPLETED** |
| **W2-D2** | **Problem D2** | `client/src/pages/campus/TimetableDashboard.tsx` | Render evening sessions / approved Spectra allocations (Periods P10–P13, 18:00–22:00) as an expandable evening row or cards below afternoon periods for each day. | **COMPLETED** |
| **W2-C2** | **Problem C2** | `client/src/pages/campus/TimetableDashboard.tsx`<br>`server/src/routes/faculty.ts` | In the session detail drawer, when logged-in role is `faculty`, add a "Request Session Move" button that creates a `pending_approval` proposal for Admin review. | **COMPLETED** |

---

## Synchronization Protocol
- Neither AI edits files outside its assigned list.
- After finishing Workstream 1 & 2:
  1. Run `npm --prefix server run build`
  2. Run `npm --prefix client run build`
  3. Deploy to `cit.saubhagyalabs.tech` and restart Docker containers.
