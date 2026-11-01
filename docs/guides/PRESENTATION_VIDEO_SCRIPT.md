# 🎬 CAMPORA — Final 5-Minute Presentation Video Script & Demonstration Guide

**Live Platform URL:** [https://cit.saubhagyalabs.tech](https://cit.saubhagyalabs.tech)  
**Live WhatsApp Bot Number:** `+91 7985013913` (Evolution-Go Powered)  
**Canonical Dataset Status:** 27 Rooms | 40 Faculty | 14 Student Cohorts | 62 Courses | 189 Sessions | 25 Spectra Bookings | 41 Midsem Exams  
**Validator Benchmark:** **0 Hard Violations** | **274 Soft Penalty** | **Minimal Movement Disruption (11 moves)**  

---

## ⏱️ Video Breakdown at a Glance (5:00 Total)

| Timestamp | Section | Key Screen / Feature | What to Show |
| :--- | :--- | :--- | :--- |
| **0:00 – 0:40** | **1. Overview & Architecture** | Dashboard Overview (`/`) | Platform branding (**Campora**), real-time KPI metrics, CP-SAT solver + Gemini architecture. |
| **0:40 – 1:30** | **2. Timetable Generation & Views** | Timetable Grid (`/timetable`) | 3-way multi-view (Cohort CSE-Y2-A, Faculty F19, Room AUD/LH-1), 0 clashes, 2h lab blocks, lunch break. |
| **1:30 – 2:30** | **3. AI Copilot & WhatsApp Bot** | Chat Copilot (`/chat`) + Phone Screen | Inbound natural language & Hinglish booking request. Smart room upgrade to AUD. WhatsApp bot interaction. |
| **2:30 – 3:15** | **4. Spectra Week Bookings** | Spectra Bookings (`/spectra`) | 6-Tier priority adjudication (Academic > Student Fest > External). Explainability modal explaining why a request was approved or rejected. |
| **3:15 – 4:10** | **5. Rescheduling & Disruptions** | Disruption Recovery (`/disruptions`) | Faculty leave / room closure. CP-SAT stability optimization (only 11 sessions moved). Admin commit action. |
| **4:10 – 5:00** | **6. Midsem Exams & Validator Proof** | Exams (`/exams`) & Authority Hub (`/datahub`) | 50% capacity exam split across rooms. Live click of "Run Official Validator" showing **0 Hard Violations** & valid `schedule.json` export. |

---

## 🎙️ Word-for-Word Script & Screen Actions

### [0:00 – 0:40] Part 1: Introduction & Architecture
**Screen:** Open `https://cit.saubhagyalabs.tech` and log in as `admin@cit.ac.in` (Password: `admin123`). Show the Campora dashboard overview.

> **Speaker:**  
> "Hello everyone. Welcome to **Campora**, the intelligent campus orchestration platform built specifically for Chilika Institute of Technology.  
> Campora automates the complex mathematical nightmare of university scheduling — combining Google OR-Tools CP-SAT discrete optimization with Google Gemini reasoning.  
> 
> As you can see on the live dashboard, Campora manages CIT's canonical dataset: 27 diverse campus venues, 40 faculty members, 14 student cohorts across all 3 years, and 189 weekly sessions without a single clash.  
> 
> Let's dive straight into the master timetable."

---

### [0:40 – 1:30] Part 2: Master Timetable Generation & Multi-Views
**Screen:** Navigate to **Timetable** (`/timetable`).  
1. Select **Student Group View**: Click dropdown and select `CSE-Y2-A`.
2. Select **Faculty View**: Select `F19`.
3. Select **Room View**: Select `LH-1` or `AUD`.

> **Speaker:**  
> "Here is our Master Timetable grid. Campora supports instant multi-perspective viewing:  
> First, by **Student Group** — looking at Computer Science Year 2 Section A: notice how all 10 hard constraints are strictly adhered to. Lectures are strictly single periods, practical labs run in contiguous 2-period blocks in designated computing laboratories, and lunch hours between 12:00 and 14:00 are cleanly preserved.  
> 
> Switching to **Faculty View** for Professor F19: you'll see zero overlaps, no violations of faculty daily teaching limits, and strict respect for faculty unavailability windows.  
> 
> And in the **Room View**, every venue from LH-1 to the open-air theatre shows realistic utilization without any room double-booking."

---

### [1:30 – 2:30] Part 3: AI Copilot & Live WhatsApp Intake
**Screen:** Open **AI Assistant** (`/chat`). Type or demonstrate the copilot prompt, then show the live WhatsApp interface on mobile or desktop.

> **Speaker:**  
> "Campora eliminates tedious form-filling with an intelligent dual-channel intake — both inside the web app and directly over WhatsApp.  
> Let's test a real, messy natural language request in Hinglish:  
> 
> *'Mujhe kal Seminar Hall chahiye 2 ghante ke liye for Coding Club hackathon, around 900 students aayenge. Mic aur projector hona chahiye.'*  
> 
> Watch how Campora's Gemini-powered parser processes this:  
> 1. It identifies the 900 attendee count and realizes Seminar Hall only holds 200 — automatically suggesting an upgrade to the Auditorium!  
> 2. It structures the booking with required AV equipment and duration.  
> 3. It generates an editable structured card before any commitment occurs.  
> 
> Furthermore, Campora connects directly to CIT's official WhatsApp Bot on `+91 7985013913`. A club coordinator or professor can text in plain Hinglish from their phone, receive structured conflict validation, and reply 'HAAN' or 'YES' to submit the request instantly into the administrative pipeline."

---

### [2:30 – 3:15] Part 4: Spectra Week Priority Adjudication & Explainability
**Screen:** Navigate to **Spectra Bookings** (`/spectra`). Click on any Approved or Rejected card to open the **Explainability Modal**.

> **Speaker:**  
> "During CIT's annual Spectra week, venue demand spikes dramatically. Campora implements the strict 6-tier priority hierarchy mandated by CIT rules:  
> Academic exams take top priority, followed by department academic events, student fest flagship programs, club activities, and finally external bookings.  
> 
> Out of the 25 booking requests in the canonical dataset, Campora evaluates every single request with deterministic fairness.  
> Notice our Explainability engine: clicking on any rejected booking shows the exact mathematical justification — for example: *'Rejected due to priority conflict with higher-tier Department Hackathon in AUD, and Seminar Hall is under scheduled maintenance during period 10-11.'*  
> Every stakeholder gets transparency, zero human bias."

---

### [3:15 – 4:10] Part 5: Disruption Recovery & Minimal-Movement Rescheduling
**Screen:** Navigate to **Disruptions** (`/disruptions`). Show the preloaded disruption or load `sample_disruption.json`. Show the change diff table. Click **Commit Timetable Changes**.

> **Speaker:**  
> "Real campus life is unpredictable — faculty fall sick, or AC maintenance shuts down an entire lecture hall.  
> When a disruption file is applied, Campora does not throw away the whole timetable. That would cause campus-wide chaos.  
> 
> Instead, our CP-SAT solver uses a **Stability Objective function** that penalizes session movements.  
> In this sample disruption where multiple faculty are on emergency leave:  
> Out of 189 sessions, Campora moves **only 11 sessions** to restore complete 100% feasibility!  
> 
> You see a crystal-clear audit diff: exactly which sessions moved, from which room and time to where.  
> Most importantly, following strict institutional governance, changes are staged in a draft state and applied **only after the Admin clicks 'Commit Timetable Changes'**."

---

### [4:10 – 5:00] Part 6: Midsem Exams, Official Validator Proof & Conclusion
**Screen:**  
1. Navigate to **Exams** (`/exams`). Show the split seating arrangements.  
2. Navigate to **Data & Export** (`/datahub`). Show the official validator scorecard and download `schedule.json`.

> **Speaker:**  
> "For midsem exams, Campora automatically schedules all 41 course exams with strict 50% anti-cheating room capacity limits, automatically partitioning large batches across adjacent lecture halls with synchronized time slots.  
> 
> Finally, let's look at the ultimate verification. In the Authority Hub, we run the starter pack's official `validator.py` directly against our live database export.  
> 
> Look at the live terminal output:  
> **Hard Constraint Violations: 0 (Zero!)**  
> **Soft Constraint Penalty: 274** — one of the best optimization scores achievable.  
> All 189 sessions scheduled, midsem exams verified, and complete `schedule.json` exported with one click.  
> 
> Campora is production-ready, beautiful, responsive, and deployed live at `cit.saubhagyalabs.tech`.  
> Thank you!"

---

## 📱 WhatsApp Live Demonstration Guide

To demonstrate the WhatsApp Bot during the video or to judges:

1. **Send a WhatsApp message to:** `+91 7985013913`
2. **Sample Message (Hinglish):**
   ```text
   Mujhe kal Seminar Hall chahiye 2 ghante ke liye for Robotics Club workshop, around 100 students aayenge. Projector chahiye.
   ```
3. **What the Bot replies:**
   - Detects requester role.
   - Proposes available window and venue.
   - Prompts: `Reply *YES* or *HAAN* to confirm this booking draft.`
4. **Send reply:**
   ```text
   YES
   ```
5. **Bot confirmation:**
   - Confirms booking request created in the Campora database (`BR-xx`).
   - The new booking immediately appears under `/spectra` or `/bookings` on the web dashboard!

---

## 🔑 Demo Credentials Reference

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@cit.ac.in` | `admin123` |
| **Academic Coordinator** | `f1@cit.ac.in` | `faculty123` |
| **Club President** | `robotics@cit.ac.in` | `club123` |

