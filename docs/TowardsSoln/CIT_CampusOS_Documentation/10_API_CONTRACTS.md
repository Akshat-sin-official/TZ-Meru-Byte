# 10 — API Contracts (Proposed)

These endpoints are an implementation proposal, not organiser-prescribed URLs. Keep request/response schemas versioned and typed in a shared TypeScript/Python contract package or generated OpenAPI spec.

## 1. Conventions
- Prefix: `/api/v1`.
- JSON request/response; ISO-8601 timestamps with offset.
- IDs are opaque strings.
- All mutation endpoints require authentication, authorization and audit context.
- Use `Idempotency-Key` for import, publish, approval and decision mutations.
- Errors use `{code, message, details, request_id}`.

## 2. Authentication / current user
- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/me`

## 3. Dataset management
- `POST /datasets/import` — Admin; accepts starter-pack JSON or disruption file; validate before activation.
- `GET /datasets/active`
- `GET /datasets/:id/validation-report`
- `POST /admin/demo-reset` — Admin only; restore known clean demo state and log reset.

## 4. Timetable
- `POST /schedules/generate` — Admin; starts solver job.
- `GET /solver-jobs/:jobId` — status/progress/result.
- `GET /schedules/active`
- `GET /schedules/:versionId`
- `GET /timetables/groups/:groupId`
- `GET /timetables/faculty/:facultyId`
- `GET /timetables/rooms/:roomId`
- `POST /schedules/validate-move` — preview only; accepts session/basket, target day/start/room and version ID.
- `POST /schedules/manual-move` — authorized mutation; server revalidates, creates new version or controlled proposal.

## 5. Exams
- `POST /exams/generate` — Admin; job-based.
- `GET /exams/schedule/:versionId`

## 6. Bookings
- `POST /bookings/parse` — optional AI; returns extraction only, no persistence/approval.
- `POST /bookings` — user submits confirmed structured request.
- `GET /bookings` — scoped by role.
- `GET /bookings/:id`
- `POST /bookings/:id/decide` — authorized approver; approve/reject/alternative with reason and placement.
- `POST /bookings/:id/cancel` — requester/authorized role, policy-controlled.
- `POST /bookings/evaluate-options` — evaluate ordered conditional options without committing.

## 7. Disruptions
- `POST /disruptions` — Admin/coordinator according to scope; import change file.
- `POST /disruptions/:id/solve` — starts repair job.
- `GET /disruptions/:id/proposal`
- `GET /disruptions/:id/diff`
- `POST /disruptions/:id/approve` — Admin only, not requester if same actor policy applies; checks base version and revalidates.
- `POST /disruptions/:id/reject` — Admin only.

## 8. AI assistant and explanations
- `POST /assistant/interpret-booking`
- `POST /assistant/interpret-change`
- `POST /assistant/explain-decision` — backend supplies facts/reason codes; LLM only rephrases.

## 9. Notifications / dashboard / export
- `GET /notifications`
- `PATCH /notifications/:id/read`
- `GET /dashboard/summary`
- `GET /exports/schedule.json`
- `GET /exports/schedule_after.json`
- `POST /exports/validate` — runs internal checks and official validator subprocess in controlled server environment.

## 10. Example validate-move contract
Request:
```json
{"schedule_version_id":"sv_123","session_id":"CS101-L1","day":"TUE","start_period":3,"room_id":"LH-2"}
```
Response:
```json
{"valid":false,"violations":[{"code":"ROOM_OCCUPIED","message":"LH-2 is occupied on TUE P3."}],"warnings":[]}
```

## 11. Example job response
```json
{"job_id":"job_123","status":"running","progress":35,"stage":"constraint_search","result_version_id":null,"error":null}
```
Progress is approximate; do not fake exact percentages if solver cannot report them. A stage/status is preferable to misleading progress.

## 12. Concurrency and transaction rules
- Schedule activation must compare `base_version_id` to current active version.
- Approval endpoint must verify role, scope, self-approval prohibition, current proposal status and fresh validation.
- A repeated idempotency key must not create duplicate decisions/versions.
- Never hold transaction open while solving or calling an LLM.
