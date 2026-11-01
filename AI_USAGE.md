# AI_USAGE.md — Artificial Intelligence Disclosure

This document provides complete, transparent disclosure of all Artificial Intelligence (AI) technologies, models, and tools used both inside the CIT CampusOS runtime application and during development, in strict compliance with **Section 6 (Implementation Rules)** of the Hackathon Problem Statement.

---

## 1. Runtime AI Tools & Models (Inside the Product)

### Models & APIs Called
- **Model / Service**: CIT Copilot NLP Engine (Dual-Architecture: Google Gemini API integration with deterministic fallback semantic parser).
- **Endpoint**: `POST /api/assistant/chat`, `POST /api/assistant/parse-booking`, `POST /api/assistant/explain-decision`.
- **Purpose**:
  1. **Plain-Language Parsing (Section 2 #3)**: Converts unstructured English and Hinglish messages into structured booking specifications matching `sample_requests.md`.
  2. **Conflict & Accessibility Detection**: Detects room accessibility conflicts (e.g. `SH-2` on upper floor without elevator -> recommends `SH-1`).
  3. **Vague Query Clarification**: Identifies missing parameters (e.g. "after lunch" -> defaults to P6 and asks clarifying follow-up).
  4. **Schedule Change Translation (Section 2 #7)**: Converts faculty unavailability prompts (e.g. "Faculty F07 unavailable on Monday") into formal disruption specifications.
  5. **Decision Explainability (Section 2 #8)**: Explains why bookings were rejected (e.g. BR-09 attendance exceeding auditorium capacity) or why classes are scheduled at 08:00 AM (room occupancy, H6 faculty daily limits, H7 lab block locks).

### Prompt Location
- System prompts, parsing heuristics, and semantic rules are located in:
  - `server/src/routes/assistant.ts`
  - `client/src/components/campus/AICopilotDrawer.tsx`

---

## 2. Strict Architectural Boundary: What AI is NOT Allowed to Decide

In strict adherence to the problem statement rule (*"The LLM can read requests, ask follow-up questions, fill in forms and explain decisions. It can't be what decides whether a schedule or booking is valid"*):

| Capability | CIT Copilot (LLM / NLU) | Python Solver / Validator (Code Authority) |
| :--- | :---: | :---: |
| Understand English & Hinglish prompts | **Allowed** | N/A |
| Suggest structured parameters (Pax, Slot, Room) | **Allowed** | N/A |
| Ask clarifying follow-up questions | **Allowed** | N/A |
| Explain scheduling decisions from DB facts | **Allowed** | N/A |
| **Declare a timetable valid** | **FORBIDDEN** | **Exclusively decided by Python CP-SAT / validator.py** |
| **Approve a venue booking** | **FORBIDDEN** | **Exclusively decided by Priority Engine (Section 4)** |
| **Override room capacity or features** | **FORBIDDEN** | **Exclusively enforced by Rule H4 & H5** |
| **Write directly to live active schedules** | **FORBIDDEN** | **Requires Human Admin Approval & DB Commit** |

**Failsafe Guarantee**: If the LLM API fails, is blocked, or runs out of credits, the deterministic NLU parser and manual scheduling forms continue to function with 100% operational availability.

---

## 3. AI Tools Used During Development

- **Google Antigravity / Claude 3.5 Sonnet / Gemini 2.5 Pro**: Used as an AI pair-programming assistant to assist with architectural planning, TypeScript type definitions, Tailwind CSS UI components, and writing test suites.
- **Commit History**: All development steps, solver mathematical models, and UI refinements were verified against the official `validator.py` with 0 hard violations.

