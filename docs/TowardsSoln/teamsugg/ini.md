# CIT CampusOS — Final RBAC Matrix

This is the recommended implementation baseline. It follows the Problem Statement, incorporates the Feature Guide and starter-pack rules, and resolves unspecified permissions using least-privilege access and practical campus workflows.

The four roles are Admin, Department Coordinator, Faculty and Club Representative.

### Permission legend

- ✅ Full permission within the stated scope.
- 🔶 Restricted permission or permission requiring approval.
- ❌ No permission.
- All = institute-wide.
- Department = the coordinator's assigned department.
- Own = the user's own timetable, requests or records.

## 1. Timetable and academic scheduling

| Capability                          | Admin | Dept Coordinator               | Faculty                          | Club Rep |
| ----------------------------------- | ----- | ------------------------------ | -------------------------------- | -------- |
| View all timetables                 | ✅ All | ❌                              | ❌                                | ❌        |
| View department timetable           | ✅ All | ✅ Own department               | ❌                                | ❌        |
| View personal faculty timetable     | ✅ All | ✅ Own department               | ✅ Own                            | ❌        |
| View timetable by room              | ✅ All | ✅ Rooms relevant to department | ❌                                | ❌        |
| Generate weekly timetable           | ✅     | ❌                              | ❌                                | ❌        |
| Generate midsem exam timetable      | ✅     | ❌                              | ❌                                | ❌        |
| Request session addition            | ✅     | 🔶 Own department              | 🔶 Own teaching responsibilities | ❌        |
| Request session rescheduling        | ✅     | 🔶 Own department              | 🔶 Own teaching responsibilities | ❌        |
| Manually move academic sessions     | ✅ All | ❌                              | ❌                                | ❌        |
| Manually schedule department events | ✅ All | ✅ Own department               | ❌                                | ❌        |
| Approve timetable changes           | ✅     | ❌                              | ❌                                | ❌        |
| Publish approved timetable          | ✅     | ❌                              | ❌                                | ❌        |

Decision: Department Coordinators and Faculty submit academic scheduling requests, but do not directly modify the published academic timetable. Admin controls timetable generation, approval and publication. Coordinators may manually place department events, subject to the scheduling rules.

The PS explicitly grants Admin timetable generation and approval, Coordinator department session-change requests, and Faculty requests for extra or moved sessions. The exact manual-event role scope is supplemented by the Feature Guide.&#x20;

Problem statement.pdf

CIT_Feature_Guide.pdf



## 2. Availability and disruption management

| Capability                                  | Admin | Dept Coordinator                 | Faculty                          | Club Rep |
| ------------------------------------------- | ----- | -------------------------------- | -------------------------------- | -------- |
| Mark own unavailability                     | ✅     | ✅                                | ✅                                | ❌        |
| Mark another faculty member unavailable     | ✅ All | ❌                                | ❌                                | ❌        |
| Submit faculty leave/unavailability request | ✅ All | 🔶 Report for department faculty | ✅ Own                            | ❌        |
| Report/request room closure                 | ✅ All | 🔶 Department-related rooms      | 🔶 Report only                   | ❌        |
| Request a new academic session              | ✅ All | 🔶 Own department                | 🔶 Own teaching responsibilities | ❌        |
| Request removal of an academic session      | ✅ All | 🔶 Own department                | ❌                                | ❌        |
| Generate disruption repair proposal         | ✅     | ❌                                | ❌                                | ❌        |
| View disruption proposals                   | ✅ All | ✅ Own department impact          | 🔶 Own timetable impact          | ❌        |
| Approve disruption proposal                 | ✅     | ❌                                | ❌                                | ❌        |
| Apply approved disruption                   | ✅     | ❌                                | ❌                                | ❌        |
| View disruption impact and changes          | ✅ All | ✅ Department impact              | ✅ Own timetable impact           | ❌        |

Decision: Faculty can declare their own unavailability. Coordinators can raise departmental operational issues, but cannot activate timetable disruptions. Admin owns disruption processing and approval.

A submitted report is not an applied disruption. Every proposed repair must be validated and approved by Admin before becoming active.

## 3. Spectra Week venue bookings

| Capability                               | Admin | Dept Coordinator | Faculty                 | Club Rep                |
| ---------------------------------------- | ----- | ---------------- | ----------------------- | ----------------------- |
| Submit venue booking request             | ✅     | ✅                | ✅                       | ✅                       |
| Submit institute event request           | ✅     | ❌                | ❌                       | ❌                       |
| Submit department event request          | ✅     | ✅                | ❌                       | ❌                       |
| Submit guest lecture request             | ✅     | ❌                | ✅                       | ❌                       |
| Submit club event request                | ✅     | ❌                | ❌                       | ✅                       |
| Cancel own booking request               | ✅     | ✅                | ✅                       | ✅                       |
| Cancel another user's request            | ✅     | ❌                | ❌                       | ❌                       |
| View own booking status                  | ✅     | ✅                | ✅                       | ✅                       |
| View own booking decision reason         | ✅     | ✅                | ✅                       | ✅                       |
| View all venue requests                  | ✅     | ❌                | ❌                       | ❌                       |
| View department venue requests           | ✅     | ✅ Own department | ❌                       | ❌                       |
| View room availability for booking       | ✅ All | ✅                | 🔶 Eligible event rooms | 🔶 Eligible event rooms |
| Manually allocate department event venue | ✅ All | ✅ Own department | ❌                       | ❌                       |
| Approve department lab bookings          | ✅ All | ✅ Own department | ❌                       | ❌                       |
| Approve booking that displaces a class   | ✅     | ❌                | ❌                       | ❌                       |
| Change booking priority order            | ✅     | ❌                | ❌                       | ❌                       |

### Booking category limits

These are taken from the starter-pack `role_category_cap` configuration.

| Role                   | Maximum booking category |
| ---------------------- | ------------------------ |
| Admin                  | `institute_event`        |
| Department Coordinator | `department_event`       |
| Faculty                | `guest_lecture`          |
| Club Representative    | `club_event`             |

A user cannot increase their privilege by selecting a higher category. The effective category must be capped by the dataset configuration.

For example, a Club Representative attempting to submit an `institute_event` request is treated as a `club_event` request.

Booking approval workflow:

1. The booking engine processes requests using the configured priority order and feasibility rules.
2. Normal feasible requests receive their deterministic booking decision.
3. A Department Coordinator can approve bookings of their department's labs.
4. Any booking that displaces a regular class requires Admin approval.
5. Only an approved institute event may displace a regular class, and the displaced class must be rescheduled rather than removed.

The coordinator's lab-booking approval does not replace the Admin approval required for class displacement.&#x20;

Problem statement.pdf



## 4. AI assistant and natural-language requests

| Capability                                         | Admin | Dept Coordinator      | Faculty         | Club Rep       |
| -------------------------------------------------- | ----- | --------------------- | --------------- | -------------- |
| Natural-language venue request parsing             | ✅     | ✅                     | ✅               | ✅              |
| Review/edit parsed venue request before submission | ✅     | ✅                     | ✅               | ✅              |
| AI assistant for academic schedule changes         | ❌     | ❌                     | ✅               | ❌              |
| Ask why a timetable decision was made              | ✅     | ✅ Department scope    | ✅ Own timetable | ❌              |
| Ask why a booking was rejected                     | ✅ All | ✅ Department requests | ✅ Own requests  | ✅ Own requests |
| Accept AI output without validation                | ❌     | ❌                     | ❌               | ❌              |

Decision: Natural-language venue booking is available to every role that can submit a venue request. The academic scheduling copilot is provided to Faculty, as specifically requested by the PS.

AI can parse, clarify and explain. It cannot approve requests, make final scheduling decisions or bypass validation.&#x20;

Problem statement.pdf



## 5. Dataset, administration and system controls

| Capability                        | Admin | Dept Coordinator | Faculty         | Club Rep       |
| --------------------------------- | ----- | ---------------- | --------------- | -------------- |
| Load/import dataset               | ✅     | ❌                | ❌               | ❌              |
| Import disruption change files    | ✅     | ❌                | ❌               | ❌              |
| Export `schedule.json`            | ✅     | ❌                | ❌               | ❌              |
| Export `schedule_after.json`      | ✅     | ❌                | ❌               | ❌              |
| Reset demo data                   | ✅     | ❌                | ❌               | ❌              |
| View global conflicts             | ✅     | ❌                | ❌               | ❌              |
| View department conflicts         | ✅     | ✅ Own department | 🔶 Own sessions | ❌              |
| View global room utilisation      | ✅     | ❌                | ❌               | ❌              |
| View department room utilisation  | ✅     | ✅ Relevant rooms | ❌               | ❌              |
| View global pending approvals     | ✅     | ❌                | ❌               | ❌              |
| View department pending approvals | ✅     | ✅ Own department | ❌               | ❌              |
| View audit logs                   | ✅ All | 🔶 Own actions   | 🔶 Own actions  | 🔶 Own actions |

Admin-only dataset loading, exports and demo reset are explicitly required by the PS and Feature Guide.&#x20;

Problem statement.pdf

CIT_Feature_Guide.pdf



## 6. Mandatory authorization rules

These rules apply globally, regardless of the role.

| Rule                      | Implementation                                                                                                     |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| No self-approval          | A user cannot approve a request they submitted.                                                                    |
| Server-side authorization | Every write action must validate permissions on the backend.                                                       |
| Department isolation      | Department Coordinators can only modify/request actions within their assigned department.                          |
| Faculty isolation         | Faculty can only declare their own unavailability and request changes involving their teaching responsibilities.   |
| Club isolation            | Club Representatives can only access and cancel their own venue requests.                                          |
| Category enforcement      | Booking category is derived using the dataset's `role_category_cap`, never trusted from the frontend.              |
| Scheduling validation     | Every manual placement, AI proposal and solver output must pass backend constraint validation.                     |
| Class displacement        | Only an approved institute event can displace a regular session, with Admin approval and a valid session override. |
| Approval separation       | The requester and approver must be different authenticated users.                                                  |
| Audit trail               | Record every approval, rejection, cancellation, manual change, import, reset and publication.                      |

### Special approval fallback

When a request requires approval but its creator is the only eligible approver, it must remain pending or be escalated to another eligible user. Never bypass the self-approval rule.

For example:

- A Coordinator cannot approve their own department lab booking.
- An Admin cannot approve their own class-displacing booking.
- A Faculty member cannot approve their own schedule-change request.

## 7. Final implementation decisions

These are the defaults I recommend the development team adopts:

1. Admin: Institute-wide authority over scheduling, exams, disruptions, data, approvals and configuration.
2. Department Coordinator: Department-scoped scheduling requests, department events, departmental lab approvals and relevant operational visibility.
3. Faculty: Personal timetable, personal availability, own teaching-session change requests, guest lecture requests and AI scheduling assistant.
4. Club Representative: Club venue requests, cancellation, booking status and decision explanations.
5. Booking engine: Automatically processes booking requests using category caps, priority and room constraints. It does not replace required human approvals.
6. No frontend-only RBAC: Hiding a button is not authorization. Backend services enforce every permission.

One important implementation detail: keep the category limits and booking priority order in the imported dataset/configuration. Do not hardcode them into role middleware.

This is the matrix I would use as the authoritative RBAC contract for CIT CampusOS.