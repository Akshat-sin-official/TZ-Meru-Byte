# 01 — Domain Rules, Constraints & Exact Scoring Specification

> **Status:** Canonical Specification  
> **Source of Truth:** Problem Statement, `cit_public.json`, `validator.py`  
> **Rule Coverage:** H1–H14 (Hard), B1–B3 (Bookings), E1–E2 (Exams), S1–S6 (Soft Penalties)

---

## 1. Domain Entities & Dataset Scope

The system operates strictly on the data model declared in `cit_public.json`. Any dataset injected during judging adheres to this same schema:

| Entity | Public Count | Key Attributes & Characteristics |
|---|:---:|---|
| **Rooms** | 27 | `id`, `name`, `building`, `type`, `capacity`, `features`, `accessible`, `allowed_uses`. Types: `classroom`, `lecture_hall`, `auditorium`, `seminar_hall`, `outdoor`, `lab_cs`, `lab_elec`, `lab_phy`, `workshop`, `lab_civil`. Note: Seminar halls and OAT never take regular classes (`"allowed_uses"` does not contain `"lecture"` or `"tutorial"`). |
| **Room Unavailability** | 2 | Scheduled maintenance intervals: `room_id`, `day`, `periods`, `reason`. |
| **Faculty** | 40 | `id`, `name`, `department`, `max_hours_per_day` (hard limit, default 4), `needs_accessible` (boolean), `unavailable` (hard intervals), `preferences` (soft avoid intervals). |
| **Student Groups** | 14 | `id`, `name`, `year` (1–3), `department`, `size`, `needs_accessible` (e.g., ME-2 requires accessibility). |
| **Courses** | 62 | `id`, `name`, `department`, `year`, `lecture_hours`, `tutorial_hours`, `lab_blocks`. Reference metadata. |
| **Sessions** | 189 | Unit of scheduling (243 total teaching hours). `id`, `course_id`, `kind` (`lecture`, `tutorial`, `lab`), `groups`, `faculty_id`, `size`, `duration`, `room_types`, `needs_accessible`, `basket_slot`, `fixed_slot`. |
| **Booking Requests** | 25 | Spectra Week (Week 7) requests: `id`, `submitted_at`, `requester`, `role` (`admin`, `department_coordinator`, `faculty`, `club`), `requested_category`, `title`, `attendance`, `duration_periods`, `windows`, `room_types`, `needs`, `requested_room`, `mandatory_for_groups`, `series_id`, `raw_text`. |
| **Cancellations** | 1 | `request_id`, `cancelled_at`, `by`, `note`. Formally withdrawn requests (e.g. BR-04) that **must never be approved**. |
| **Midsem Exams** | 41 | `id`, `course_ids`, `groups`, `size`, `duration_hours`. Scheduled during exam week at 50% room capacity. |

---

## 2. Definitive Time Model

### 2.1 Weekly Timetable Calendar
- **Teaching Days:** `MON`, `TUE`, `WED`, `THU`, `FRI` (5 days).
- **Teaching Periods:** `1` to `9` (9 one-hour slots per day):
  - P1: 08:00 – 09:00
  - P2: 09:00 – 10:00 *(Valid Lab Start Slot)*
  - P3: 10:00 – 11:00
  - P4: 11:00 – 12:00
  - P5: 12:00 – 13:00
  - **LUNCH BREAK:** 13:00 – 14:00 (Between P5 and P6). **Strictly no sessions may cross lunch.**
  - P6: 14:00 – 15:00 *(Valid Lab Start Slot)*
  - P7: 15:00 – 16:00
  - P8: 16:00 – 17:00
  - P9: 17:00 – 18:00
- **Event-Only Periods:** `10` to `13` (4 one-hour slots per day, 18:00 – 22:00). Regular teaching classes are **forbidden** in P10–P13.
- **Total Operational Periods:** `1` to `13`.
- **Laboratory Constraints:** Every lab session (`kind: "lab"`, duration 3 periods) must start at either **P2** (P2–P4) or **P6** (P6–P8).

### 2.2 Midsem Examination Calendar
- **Exam Days:** `MON`, `TUE`, `WED`, `THU`, `FRI`, `SAT` (6 days, defined in `calendar.exam_week.days`).
- **Exam Sessions:**
  - `AM`: 09:30 – 11:30
  - `PM`: 14:00 – 16:00
- **Capacity Rules:** Rooms seat only **half of their nominal capacity** (`capacity // 2`) to ensure distance between examinees. Exams may be split across multiple rooms to meet total cohort size.

---

## 3. Official Hard Constraints (H1–H14)

Every published timetable must produce **0 violations** against these rules:

| Code | Constraint Description | Mathematical / Logical Formulation |
|---|---|---|
| **H1** | Session Completeness & Valid Identifiers | Every session in dataset must be assigned exactly once: $sid \in ctx.sessions \implies \exists! (day, start, room)$. No unknown session IDs, duplicate assignments, invalid days ($day \in ctx.days$), or unknown rooms. |
| **H2** | Faculty Collision Avoidance | For each faculty $f$, day $d$, period $p$: $\sum_{s \in S(f, d, p)} 1 \le 1$. Faculty cannot teach two classes simultaneously. |
| **H3** | Student Group Collision Avoidance | For each group $g$, day $d$, period $p$: $\sum_{k \in K(g, d, p)} 1 \le 1$, where $k$ is either a standard session $sid$ or an elective basket slot. (Sessions in the same basket slot do not clash with each other for groups). |
| **H4** | Room Double-Booking Prevention | For each room $r$, day $d$, period $p$: $\sum_{s \in S(r, d, p)} 1 \le 1$. A room can hold at most one session at any time. |
| **H5** | Room Capacity Compliance | For every scheduled session $(s, r)$: $s.size \le r.capacity$. (For exams: $\sum_{r \in R(e)} \lfloor r.capacity / 2 \rfloor \ge e.size$). |
| **H6** | Room Type Compatibility | For every scheduled session $(s, r)$: $r.type \in s.room\_types$. Classrooms/lecture halls cannot host labs; specific labs (`lab_cs`, `lab_elec`, `workshop`, etc.) must match session requirements. |
| **H7** | Faculty Unavailability | If $(d, p) \in ctx.fac\_un[s.faculty\_id]$, no session for that faculty may occupy $(d, p)$. |
| **H8** | Room Unavailability | If $(d, p) \in ctx.room\_un[r.id]$, no session may occupy $(r, d, p)$. |
| **H9** | Period Bounds, Lunch & Lab Starts | $1 \le start$ and $start + s.duration - 1 \le 9$. A session cannot span across lunch ($start \le 5 < start + s.duration - 1$ is illegal). Lab sessions ($s.kind == "lab"$) must have $start \in \{2, 6\}$. |
| **H10** | Accessibility Compliance | If $s.needs\_accessible == \text{true}$ (e.g. ME-2 group or faculty F26), then $r.accessible == \text{true}$. |
| **H11** | Elective Basket Synchronization | For all sessions $s_i, s_j$ having the same $basket\_slot$: $s_i.day == s_j.day \land s_i.start\_period == s_j.start\_period$. They must run concurrently in separate rooms. |
| **H12** | Faculty Daily Workload Limit | For every faculty member $f$ and day $d$: $\sum_{s \in S(f, d)} s.duration \le f.max\_hours\_per\_day$ (default 4 hours). |
| **H13** | Spectra Booking Validity | Any approved booking must satisfy: duration, allowed use (`"event"`), room type match, capacity, feature match (`needs \subseteq features \cup \{accessible\}`), requested window containment, room availability, and freedom from mandatory group class conflicts. |
| **H14** | Fixed Slot Enforcement | If $s.fixed\_slot$ is defined, session must be placed at exactly $(s.fixed\_slot.day, s.fixed\_slot.start\_period)$. |

---

## 4. Midsem Exam Constraints (E1–E2)

| Code | Constraint Description | Formulation |
|---|---|---|
| **E1** | Exam Schedule Completeness & Valid Slots | Every midsem exam must be scheduled exactly once: $eid \in ctx.exams \implies \exists! (day, session, rooms)$. $day \in calendar.exam\_week.days$ (`MON`–`SAT`), $session \in \{AM, PM\}$. |
| **E2** | Exam Room Eligibility | Every room assigned to an exam must have `"exam" \in r.allowed\_uses`. |

- **Collisions in Exams:**
  - Room double-booking: A room cannot be used by more than one exam in the same $(day, session)$. (Violates **H4**).
  - Student group double-booking: A group cannot write two exams in the same $(day, session)$. (Violates **H3**).
  - Capacity: Aggregate half-capacity of assigned rooms must be $\ge e.size$. (Violates **H5**).

---

## 5. Spectra Week Booking Rules (B1–B3) & Priority Calculus

### 5.1 Booking Rules (B1–B3)
| Code | Constraint Description | Details |
|---|---|---|
| **B1** | Unique Valid Decisions | Every request must receive exactly one decision with $status \in \{approved, rejected, alternative\_offered\}$. |
| **B2** | Valid Session Overrides | A session override in Week 7 may only be displaced by an approved booking whose effective category is `institute_event`. The displaced session must be relocated within Week 7, not dropped. |
| **B3** | Cancellation Adherence | Any request listed in `cancellations.csv` (e.g. BR-04) that receives `approved` or `alternative_offered` is a hard violation. It must be `rejected` (or marked cancelled). |

### 5.2 Category Weights & Role Capping
The system strictly enforces `role_category_cap`:
$$\text{Effective Category} = \text{priority\_order}[\max(\text{index}(\text{requested\_category}), \text{index}(\text{role\_category\_cap}[\text{role}]))]$$

| Requester Role | Maximum Allowed Category | Points If Approved | Points If Alternative Offered |
|---|---|:---:|:---:|
| `admin` | `institute_event` | **5** | **2.5** |
| `faculty` | `guest_lecture` | **4** | **2.0** |
| `department_coordinator` | `department_event` | **3** | **1.5** |
| `club` | `club_event` | **2** | **1.0** |

*Note: If a club asks for `institute_event`, it is clamped to `club_event` (weight 2).*

### 5.3 Priority Ordering & Tie-Breaking
Requests are sorted by:
1. `priority_order` index: `exam` (0) > `regular_session` (1) > `institute_event` (2) > `guest_lecture` (3) > `department_event` (4) > `club_event` (5).
2. `submitted_at` timestamp in ascending order (earlier submission wins).

### 5.4 Priority Inversions
A **priority inversion** occurs if:
- A higher-priority request $R_A$ is `rejected`, BUT
- A lower-priority request $R_B$ was `approved` for a slot/room that $R_A$ could have validly occupied during one of its requested windows.
- The engine guarantees **zero priority inversions** by evaluating candidates in strict priority order.

---

## 6. Official Soft Penalties (S1–S6 & Exam Penalty)

The objective function of the scheduling optimizer minimizes the total weighted soft penalties:

$$Score_{soft} = \sum_{k=1}^6 S_k + Pen_{exam}$$

| Penalty Code | Description | Metric & Unit Cost |
|---|---|---|
| **S1** | Faculty Preference Avoidance | **2 points** per hour taught during an avoided $(day, period)$ listed in faculty preferences. |
| **S2** | Student Schedule Gaps | **1 point** per idle period between the first and last class for each group on each day: $\sum_{g, d} \left( \max(P_{g, d}) - \min(P_{g, d}) + 1 - |P_{g, d}| \right)$. |
| **S3** | Excessive Group Daily Load | **3 points** per teaching hour in excess of 6 hours for any group on any day: $\sum_{g, d} 3 \times \max(0, Hours(g, d) - 6)$. |
| **S4** | Repeated Same-Day Lectures | **3 points** for each additional lecture of the same course taught to the same group on the same day: $\sum_{g, d, c} 3 \times \max(0, Count(g, d, c) - 1)$. (Also applies to multiple basket lectures on the same day). |
| **S5** | Poor Room Utilization | **1 point** for each session placed in a room where utilization is below 40%: $\frac{s.size}{r.capacity} < 0.4$. |
| **S6** | Late Afternoon Sessions (Period 9) | **1 point** for each session running in Period 9 (17:00–18:00). |
| **Exam Penalty** | Multiple Exams Per Group Per Day | **5 points** for each additional exam assigned to the same student group on the same day: $5 \times (Count(g, day) - 1)$. |

---

## 7. Disruption & Rescheduling Metrics

When a disruption is applied to an existing baseline timetable, the engine must preserve stability:

$$\text{Sessions Moved} = \{ s \mid s \in \text{Baseline} \land s \in \text{After} \land (s.day_{after}, s.start_{after}, s.room_{after}) \ne (s.day_{base}, s.start_{base}, s.room_{base}) \}$$

The validator categorizes moves into:
1. **Time Changed**: $(day, start) \ne (day_{base}, start_{base})$. Major disruption to faculty and students.
2. **Room Only Changed**: $day == day_{base} \land start == start_{base}$, but $room \ne room_{base}$. Minor disruption.

**Optimization Goal:** Solve for **0 hard violations**, then minimize $10 \times \text{time\_changed} + 1 \times \text{room\_only\_changed}$, and finally minimize soft penalties.

