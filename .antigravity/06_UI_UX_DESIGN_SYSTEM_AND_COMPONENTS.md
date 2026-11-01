# 06 — UI/UX Design System, Typography & Component Standards

> **Status:** Canonical Specification  
> **Source Reference:** Copied and adapted directly from `docs/UI/app-ui`  
> **Design Philosophy:** Enterprise clarity, refined HSL color system, Poppins typography, rich Radix/shadcn components, and interactive visual feedback.

---

## 1. Design Tokens & Styling Architecture (from `docs/UI/app-ui`)

All styles, color variables, typography, and elevation rules are mirrored directly from the reference codebase (`docs/UI/app-ui/src/index.css` & `tailwind.config.ts`).

### 1.1 Typography Hierarchy
- **Google Fonts Import:**
  ```css
  @import url("https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap");
  ```
- **Font Families:**
  - **Headings & Key UI (`font-poppins`):** `"Poppins", sans-serif`
  - **Body Text (`font-sans`):** `'Franca DEMO', 'Plus Jakarta Sans', 'Space Grotesk', ui-sans-serif, system-ui, -apple-system, sans-serif`
  - **Code & Slot Period Indicators (`font-mono`):** `'Space Mono', ui-monospace, SFMono-Regular, monospace`

### 1.2 HSL Color Palette (Tailwind & CSS Variables)
All color tokens strictly use HSL values for seamless opacity modifiers and theme transitions:

```css
:root {
  /* Core Brand Tokens */
  --background: 0 0% 100%;
  --foreground: 222 47% 11%;
  
  --primary: 272 81% 56%;             /* CIT Vivid Royal Purple #8B2CF5 */
  --primary-foreground: 0 0% 100%;
  
  --secondary: 210 40% 96%;
  --secondary-foreground: 222 47% 11%;
  
  --muted: 210 40% 96%;
  --muted-foreground: 215 16% 47%;
  
  --accent: 210 40% 96%;
  --accent-foreground: 222 47% 11%;
  
  --destructive: 0 84% 60%;          /* Soft Coral Red */
  --destructive-foreground: 210 40% 98%;
  
  --border: 214 32% 91%;
  --input: 214 32% 91%;
  --ring: 272 81% 56%;
  
  --radius: 0.75rem;                  /* 12px rounded-xl */

  /* Navigation & Sidebar Tokens */
  --sidebar-background: 240 20% 98%;
  --sidebar-foreground: 222 47% 11%;
  --sidebar-primary: 272 81% 56%;
  --sidebar-primary-foreground: 0 0% 100%;
  --sidebar-accent: 240 4.8% 95.9%;
  --sidebar-border: 220 13% 91%;

  /* Status Colors */
  --success: 142 71% 45%;            /* Emerald Green */
  --warning: 38 92% 50%;             /* Amber Warning */
  --info: 217 91% 60%;               /* Sky Blue */
}

.dark {
  --background: 222 47% 11%;
  --foreground: 210 40% 98%;
  --card: 222 47% 11%;
  --card-foreground: 210 40% 98%;
  --primary: 272 81% 65%;
  --primary-foreground: 0 0% 100%;
  --border: 217.2 32.6% 17.5%;
  --sidebar-background: 224 71% 4%;
  --sidebar-border: 217.2 32.6% 17.5%;
}
```

### 1.3 Elevation & Shadows
- `--shadow-xs`: `0 1px 2px 0 rgb(0 0 0 / 0.05)`
- `--shadow-sm`: `0 1px 3px 0 rgb(0 0 0 / 0.1)`
- `--shadow-md`: `0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)`
- `--shadow-lg`: `0 10px 15px -3px rgb(0 0 0 / 0.1)`
- `--shadow-xl`: `0 20px 25px -5px rgb(0 0 0 / 0.1)`

---

## 2. Core Layout & Navigation Structure

```
+-------------------------------------------------------------------------------------------------+
| Campora | Active Dataset: cit-public-v1 | Role: Admin [F37] | 🔔 Notifications | 👤 Profile |
+------------------+------------------------------------------------------------------------------+
| 📊 Dashboard     | [Filter: CSE-2 v] [Room: All v] [Faculty: All v]        [Export schedule.json] |
| 📅 Timetable     |                                                                              |
| 📝 Midsem Exams  | +-----+--------+--------+--------+--------+--------+--------+--------+--------+ |
| 🏛️ Spectra Week  | | DAY | P1     | P2     | P3     | P4     | P5     | P6     | P7     | P8     | |
| ⚡ Disruptions   | +-----+--------+--------+--------+--------+--------+--------+--------+--------+ |
| 🤖 AI Copilot    | | MON | CS201  | [---- CS291 Lab ----] | LUNCH  | CS203  | EE201  | Free   | |
| 📜 Audit Log     | | TUE | Free   | CS202  | CS204  | Free   | LUNCH  | HS201  | Free   | Free   | |
| ⚙️ Admin Reset   | +-----+--------+--------+--------+--------+--------+--------+--------+--------+ |
+------------------+------------------------------------------------------------------------------+
```

### Navigation Links & Role Visibility:
- **Admin**: Complete access (Generation, Approvals, Disruptions, Reset, Audit).
- **Department Coordinator**: Department timetables, exam room checks, alumni booking approvals.
- **Faculty**: Personal timetable, preference views, guest lecture booking requests.
- **Club Representative**: Venue booking requests, Spectra week room calendar, AI booking assistant.

---

## 3. Interactive Timetable Grid & Drag & Drop Validation

### 3.1 Visual Slot Rendering
- **Lecture Session Cards**: Compact card displaying `Course Code`, `Course Name`, `Room ID`, and `Faculty Name`.
- **Lab Blocks**: Spans 3 contiguous columns (e.g., P2–P4 or P6–P8) with distinct accent borders and a computer/beaker icon.
- **Lunch Break Divider**: Fixed vertical separator between P5 (12:00–13:00) and P6 (14:00–15:00) with label *"13:00 – 14:00 Lunch Recess"*. No sessions may be dropped across this line.

### 3.2 Drag-and-Drop Live Feedback Engine
When a user begins dragging a session card:
1. **Interactive Dropzones**: Every grid cell activates as a drop target.
2. **Debounced Pre-Flight Validation**:
   - As the cursor hovers over target $(day, period, room)$, the client checks feasibility via local rule cache or debounced `/internal/validate` call.
3. **Color-Coded Feedback**:
   - 🟢 **Valid Slot (Green Outline & Subtle Fill):** 0 hard violations.
   - 🔴 **Invalid Slot (Red Outline & Alert Indicator):** Target slot causes a violation.
4. **Rich Hover Tooltip:**
   Hovering over an invalid red slot immediately displays the exact violation reason:
   - `⚠️ Faculty F02 avoids Period 1 (Soft Penalty +2)`
   - `❌ Room LH-1 is double-booked by EE201-L1`
   - `❌ ME-2 requires wheelchair accessibility (CR-201 is inaccessible)`

---

## 4. Disruption Diff Viewer & Impact Summary

When reviewing a disruption repair proposal:
- **Side-by-Side Comparison**: Highlights sessions that remained static (slate), changed rooms only (amber), or shifted times (purple pulse).
- **Metric Cards:**
  - 🔄 **Sessions Moved:** Total sessions affected.
  - ⏱️ **Time Changes:** High-impact shifts (penalized heavily).
  - 🚪 **Room-Only Changes:** Low-impact shifts.
  - 🛡️ **Hard Violations:** Prominently displays `0 (Zero Violations)`.
  - 📉 **Soft Score:** Comparative before/after score.
- **One-Click Approval:** Primary Purple Button: `Approve & Activate Disrupted Schedule`.

---

## 5. UI Component Library (Radix / shadcn Reference)

Copied from `docs/UI/app-ui/src/components/ui`:
- `button.tsx`: Variants (`default`, `destructive`, `outline`, `secondary`, `ghost`, `link`).
- `badge.tsx`: Used for role tags, room features, and violation codes.
- `dialog.tsx` & `sheet.tsx`: Used for AI Copilot slide-out drawer and booking detail modals.
- `sonner.tsx` / `toast.tsx`: Real-time feedback for background solver jobs and validation alerts.
- `table.tsx`: Filterable tables for Spectra booking requests, exams, and audit logs.
- `Preloader.tsx`: Animated purple spinner during dataset reload and CP-SAT solver execution.

