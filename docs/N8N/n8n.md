# n8n Workflow Integration – CIT CampusOS

## Overview
CIT CampusOS integrates Google Gemini AI with n8n Cloud to provide natural-language booking assistance, schedule-change request processing, and booking decision explanations.

**n8n Cloud URL:** https://techzephyr.app.n8n.cloud

## 1. WF01 – AI Booking Intake
**Webhook:** `POST /webhook/cit/ai/booking-intake`

**Functionality:**
- Accepts natural-language booking requests in English, Hindi and Hinglish.
- Uses Gemini to extract booking details such as venue, date, time, event type, purpose and expected attendance.
- Identifies missing or ambiguous information.
- Supports multi-turn conversations using previous booking drafts supplied by the backend.
- Returns a structured booking draft and clarification message.

**Output:** Booking draft, status, missing fields and assistant message.

**Safety:** Does not approve or create bookings. Final validation and availability checks remain with the deterministic backend.

## 2. WF02 – AI Schedule Change
**Webhook:** `POST /webhook/cit/ai/schedule-change`

**Functionality:**
- Understands faculty unavailability and room-closure requests.
- Extracts affected faculty, room, date, change type and reason.
- Identifies whether backend optimization is required.
- Sends structured disruption information to the Express backend.
- Backend maps records and communicates with the Python CP-SAT optimizer.

**Output:** Structured schedule-change request, status and clarification message.

**Safety:** Does not directly modify the timetable. Proposed changes require deterministic validation and coordinator approval.

## 3. WF03 – AI Decision Explainer
**Webhook:** `POST /webhook/cit/ai/explain-decision`

**Functionality:**
- Receives authoritative booking decisions from the backend.
- Uses Gemini to explain rejection or approval outcomes in simple language.
- Supports English, Hindi and Hinglish.
- Explains supplied reason codes and booking details.

**Output:** Assistant explanation, decision status and reason codes.

**Safety:** Cannot modify, approve or reject backend decisions. It only explains the supplied result.

## 4. Backend Integration
The Node.js Express backend communicates with n8n using Axios through:

`server/src/utils/n8nClient.ts`

API endpoints:
- `POST /api/ai/booking-intake`
- `POST /api/ai/schedule-change`
- `POST /api/ai/decision-explainer`
- `GET /api/ai/conversations/:id`

Authentication:
- Header: `x-cit-webhook-secret`
- Secret stored in environment variables.
- Frontend never receives the webhook secret.

## 5. Conversation Memory
- MySQL stores AI conversations and messages.
- Booking drafts are accumulated across multiple messages.
- Conversations are scoped to authenticated user IDs.
- Backend supplies previous drafts to WF01 for context.

## 6. Error Handling and Fallback
- Invalid input returns validation errors.
- Gemini or n8n failures return sanitized errors.
- Backend supports deterministic/manual fallback for AI failures.
- AI failures must never prevent manual booking operations.

## 7. AI Execution Modes
CIT Copilot provides three modes:
- **n8n Only:** Sends requests through n8n workflows.
- **Gemini Only:** Uses the direct Gemini integration.
- **Compare Both:** Runs both paths to compare responses.

## 8. Technology Stack
- Google Gemini AI – Natural-language understanding and explanations.
- n8n Cloud – Workflow orchestration.
- Node.js and Express – Backend API and validation.
- Axios – Backend-to-n8n communication.
- MySQL and Prisma – Persistent conversation storage.
- Python FastAPI and OR-Tools CP-SAT – Deterministic scheduling optimization.

## 9. Important Design Principle
**AI assists; deterministic systems decide.**

Gemini understands user requests and generates explanations. n8n orchestrates AI workflows. The backend and CP-SAT optimizer remain responsible for authoritative validation, scheduling decisions and approval controls.
