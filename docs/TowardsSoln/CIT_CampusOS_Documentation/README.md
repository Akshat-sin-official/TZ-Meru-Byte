# CIT CampusOS — Product & Engineering Documentation

**Purpose:** authoritative implementation handoff for the CIT Campus Scheduling and Venue Management hackathon product.

## Read in this order
1. [01 Product Requirements (PRD)](01_PRODUCT_REQUIREMENTS.md)
2. [02 System Requirements & Acceptance Criteria](02_SYSTEM_REQUIREMENTS.md)
3. [03 Architecture & Engineering Decisions](03_ARCHITECTURE.md)
4. [04 Domain Model & Data Dictionary](04_DOMAIN_MODEL_DATA_DICTIONARY.md)
5. [05 Scheduling & Optimization Engine](05_SCHEDULING_ENGINE.md)
6. [06 Exams Engine](06_EXAM_ENGINE.md)
7. [07 Venue Booking & Spectra Decision Engine](07_BOOKING_ENGINE.md)
8. [08 Disruption & Rescheduling Engine](08_DISRUPTION_ENGINE.md)
9. [09 AI Copilot & Natural Language Contract](09_AI_COPILOT.md)
10. [10 API Contracts](10_API_CONTRACTS.md)
11. [11 Security, RBAC & Approval Policy](11_SECURITY_RBAC.md)
12. [12 Testing & Validator Strategy](12_TESTING_VALIDATION.md)
13. [13 Delivery, Deployment & Submission](13_DELIVERY_SUBMISSION.md)
14. [14 AI Agent Build Instructions](14_AI_AGENT_INSTRUCTIONS.md)
15. [15 Decision Register & Risks](15_DECISIONS_AND_RISKS.md)

## Source hierarchy
- **S0 — Official Problem Statement.pdf:** requirements, constraints, roles, scoring, submission and disqualification rules. It wins whenever sources conflict.
- **S1 — Starter Pack README.md, cit_public.json, validator.py, examples:** actual data schema, time model, export format and executable scoring/validation behaviour. Treat the supplied validator as the final executable oracle for the published dataset.
- **S2 — CIT_Feature_Guide.pdf (teammate):** useful implementation proposals and optional additions. It is not an official requirement and must not override S0/S1.
- **S3 — This documentation:** product/engineering recommendations. Clearly marked `RECOMMENDED` or `OPTIONAL` where not mandated.

## Non-negotiable project facts
- Build from the provided dataset; do not hard-code the public solution.
- Create the public GitHub repository after the hackathon starts; preserve genuine commit history.
- Do not modify `validator.py` or organiser files.
- Generate `exports/schedule.json` and `exports/schedule_after.json` from the application.
- The app must handle judge-provided datasets/change files, not just the public examples.
- AI may interpret and explain; application code must decide validity.
- Every AI-generated proposal must be validated by deterministic code before it can change state.
- A public live deployment, four working demo roles, Admin demo reset, and a <=5-minute walkthrough video are required.

## Important corrections and interpretation notes
- Exam week is defined by `calendar.exam_week` in the dataset: MON–SAT, AM and PM. Do not assume exam week is Monday–Friday or use teaching periods for exam sessions.
- Event-only periods are P10–P13. Regular teaching sessions are P1–P9.
- An approved booking must fit wholly within a requested window. An `alternative_offered` may be outside the requested window and is scored at half weight by the validator.
- Role category caps are defined in `role_category_cap`; do not trust a requester-supplied category.
- `schedule.json` requires exams. For disruption validation with a baseline, the validator allows exams to be omitted from `schedule_after.json`.
- The teammate guide proposes drag/drop validation, conditional requests, LLM fallback and notifications. These are additions, not all explicit PS requirements; this pack incorporates them as recommended scope.

## Definition of done
A feature is not done because the UI works. It is done when its server-side contract, permissions, deterministic validation, tests, error paths, audit trail (where applicable), and required export behaviour work.
