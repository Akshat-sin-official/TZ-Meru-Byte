# 14 — Instructions for AI Coding Agents

You are an implementation agent working on CIT CampusOS. These instructions are mandatory.

## 1. Read before coding
Read this entire documentation pack, especially:
- `01_PRODUCT_REQUIREMENTS.md`
- `02_SYSTEM_REQUIREMENTS.md`
- `03_ARCHITECTURE.md`
- `04_DOMAIN_MODEL_DATA_DICTIONARY.md`
- `05_SCHEDULING_ENGINE.md`
- `07_BOOKING_ENGINE.md`
- `08_DISRUPTION_ENGINE.md`
- `09_AI_COPILOT.md`
- `12_TESTING_VALIDATION.md`

Inspect the actual starter pack files (`README.md`, `cit_public.json`, `validator.py`, examples) before implementing any data-dependent behaviour. Official PS and starter pack override assumptions in this documentation.

## 2. Source-of-truth hierarchy
1. Official Problem Statement.
2. Starter pack README, data, examples and validator implementation.
3. This documentation.
4. Team preferences / AI assumptions.

If sources conflict, stop and report the conflict with file/field/rule references. Do not silently choose.

## 3. Non-negotiable engineering rules
- Never hard-code a timetable, booking decision, exam allocation or sample disruption output.
- Never edit official `validator.py`, source dataset or organiser examples.
- Never ask LLM to decide validity, priority, permission or approval.
- Never trust browser validation; revalidate server-side.
- Never write solver output directly to active schedule.
- Never apply disruption proposal without Admin approval.
- Never allow self-approval.
- Never discard unrecognized or malformed input silently.
- Never change export schema without checking starter README and validator.
- Never commit secrets.

## 4. Implementation process for each task
1. State the requirement and source.
2. Inspect existing code and tests before changing it.
3. Propose minimal design and impacted modules.
4. Implement typed contracts and validation first.
5. Add unit/integration tests, including negative cases.
6. Run tests and official validator where relevant.
7. Summarize files changed, commands run, outcomes, limitations and follow-up.
8. Do not claim success without test output.

## 5. Coding expectations
- TypeScript strict mode; avoid `any` except at validated external boundaries.
- Python type hints and Pydantic schemas for service inputs/outputs.
- Centralized reason-code constants.
- Centralized period/calendar utilities; no duplicated period math.
- Parameterized DB access / ORM.
- Explicit transactions for state transitions.
- Structured logs with request/job IDs.
- Stable API error format.
- Idempotency for state-changing endpoints.
- No unnecessary microservices or infrastructure.

## 6. Solver-specific instructions
- Use CP-SAT or a documented equivalent; no greedy-only algorithm as final solver unless proven feasible and valid for all inputs.
- Hard constraints are constraints, not weighted penalties.
- Validate every solver output independently.
- Keep time model from imported dataset.
- Model elective basket exceptions precisely.
- For disruption, optimize lexicographically: validity, minimum moved existing sessions, soft score.
- Report FEASIBLE vs OPTIMAL accurately.

## 7. AI-specific instructions
- Strict JSON schema; reject invalid output.
- Do not let AI output `approved`, `valid`, `effective_category`, permissions or priority override.
- Show assumptions and ask clarification for ambiguity.
- Preserve original raw text.
- Manual form works with AI disabled.

## 8. Definition of done
A task is complete only when implementation, tests, error handling, server-side authorization, documentation and acceptance criteria are satisfied. If blocked, report the exact blocker and do not fake a completed feature.
