# 15 — Decision Register, Risks & Open Questions

## 1. Decision register
| ID | Decision | Status | Rationale |
|---|---|---|---|
| D-01 | React + TS frontend | Recommended | Team familiarity, typed UI |
| D-02 | Node/Express workflow API | Recommended | Auth, approvals, import/export and CRUD |
| D-03 | Python + OR-Tools CP-SAT optimizer | Recommended | Constraint optimization fit |
| D-04 | MySQL operational DB | Recommended | Relational integrity and team familiarity |
| D-05 | LLM isolated behind adapter | Required design principle | Graceful failure and policy boundary |
| D-06 | Immutable schedule versions | Recommended | Safe approval, rollback, audit |
| D-07 | Official validator used as release gate | Required | Judge scoring oracle |
| D-08 | In-app notifications | Optional extra | Useful without external delivery risk |
| D-09 | Drag/drop live validation | Optional extra | Manual scheduling usability |
| D-10 | Conditional natural-language options | Optional extra | Handles explicit fallback requests |

## 2. High risks and mitigations
| Risk | Impact | Mitigation |
|---|---|---|
| Solver emits hard violation | Severe score loss | Canonical validation + official validator release gate |
| Elective basket modeled incorrectly | Group clashes / invalid schedule | Dedicated basket tests and exact exception semantics |
| Exams use teaching time model | Unscheduled/invalid exams | Separate AM/PM exam model sourced from calendar |
| Booking priority spoofing | Priority inversion | Effective category computed server-side from role cap |
| Cancelled request approved | Hard violation | Cancellation checked before any decision |
| AI hallucination / prompt injection | Invalid operation | Strict schema, user confirmation, deterministic validation |
| LLM provider outage | AI marks / workflow disruption | Manual path and fallback banner |
| Disruption overwrites active schedule | Operational corruption | Immutable proposal + Admin approval + atomic activation |
| Stale proposal approved | Lost updates | Base-version compare-and-swap and revalidation |
| Export manually edited | Disqualification | Generate from DB and hash/store generation metadata |
| Missing AI disclosures | 10 mark penalty | Maintain AI_USAGE.md from first day |
| Deployment unavailable | Disqualification | Health checks, persistent DB, smoke test and monitoring |

## 3. Open questions to resolve from actual code/data
- Which exact import formats will judges provide beyond `cit_public.json` and disruption JSON? Support starter-pack schema first; avoid assumptions.
- Does the organiser's live validator remain byte-for-byte same as starter `validator.py`? Treat the supplied version as current and re-check any organiser update.
- Exact approval scope for department lab booking: implement coordinator's own department and no self-approval.
- Does manual event scheduling need to be included in `schedule.json` or represented through `fest_week.bookings`? Follow starter export schema and official validator.
- How should a coordinator-requested disruption be escalated for Admin approval? Recommended: coordinator may submit proposal; only Admin activates.
- If solver time limit expires with FEASIBLE solution, allow review only after validation and display non-optimal status.

## 4. Corrections to assumptions to avoid
- Do not assume exam days are Monday–Friday; public dataset includes Saturday.
- Do not assume every event booking uses P10–P13 only: booking windows in dataset are authoritative and validator allows periods up to configured maximum. Respect request windows and calendar; do not invent a blanket restriction not in source.
- Do not assume every alternative must be inside the requested window; validator expects `alternative_offered` for outside-window placement.
- Do not assume the LLM is required for manual booking or deterministic explanations.
- Do not assume the teammate's four extras are mandatory PS features.
- Do not assume the public counts are fixed in judge tests.
