# 11 — Security, RBAC & Approval Policy

## 1. Roles
Official roles: `admin`, `department_coordinator`, `faculty`, `club` (club representative).

## 2. Permission matrix
| Capability | Admin | Dept coordinator | Faculty | Club representative |
|---|---:|---:|---:|---:|
| Generate semester timetable | Yes | No | No | No |
| View all schedules | Yes | Department scope | Own timetable | Relevant group/event status only |
| Mark faculty unavailability | Yes | Department scope | Own | No |
| Request session changes | Yes | Own department | Own sessions | No |
| Submit venue booking | Yes | Department events | Guest lecture requests | Club events |
| Cancel own booking | Yes | Yes | Yes | Yes |
| Approve timetable changes | Yes | No | No | No |
| Approve booking that moves a class | Yes | No | No | No |
| Approve department lab booking | Yes | Own department | No | No |
| Change priority order | Yes | No | No | No |
| Import/export/reset demo data | Yes | No | No | No |

The PS permits department coordinators to approve bookings of their department's labs. Define the exact object scope and ensure a coordinator cannot approve outside their department. Admin retains authority for bookings displacing a class.

## 3. Approval invariants
- Nobody can approve their own request. Enforce server-side using authenticated actor ID compared with requester/creator ID.
- UI hiding an approval button is not security.
- Approval requires an authorized role and scope.
- Any booking that moves a class requires Admin approval.
- Schedule disruption proposal application requires Admin approval.
- Approver must review the exact immutable proposal version that is applied.
- Revalidate at approval time; stale proposals cannot be applied.

## 4. Authentication
Recommended: password hashing with Argon2id or bcrypt, secure HTTP-only session cookie or short-lived JWT with refresh strategy. For hackathon, choose one simple secure model and implement consistently. Never store plaintext passwords.

## 5. Authorization
- Deny by default.
- Check permissions in middleware and service layer.
- Scope faculty to their own faculty ID.
- Scope coordinator to department.
- Scope club representative to their own requests.
- Admin-only routes must be explicit.
- Do not trust role/department/user ID in request body; derive from authenticated principal.

## 6. Audit
Record actor, action, entity, timestamp, before/after snapshot or diff, reason, request ID. Audit at least: dataset import, timetable generation, manual move, booking decision, cancellation, disruption proposal, approval/rejection, activation, priority change, demo reset, export.

## 7. Data protection and operational safety
- Secrets only in environment variables; `.env.example` contains names/placeholders only.
- Never commit real API keys, DB passwords or tokens.
- Validate file uploads (size, content type, JSON structure); do not execute uploaded content.
- Rate-limit login and AI endpoints.
- Escape raw user text in UI; guard against XSS.
- Restrict CORS to deployed frontend origin.
- Use parameterized SQL/ORM; no string-concatenated SQL.
- Keep LLM provider keys on server.
