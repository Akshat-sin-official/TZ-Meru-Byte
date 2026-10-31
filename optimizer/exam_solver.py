#!/usr/bin/env python3
"""
CIT CampusOS Midsem Examination Solver
Powered by Google OR-Tools CP-SAT
Allocates 41 midsem exams across MON-SAT (AM/PM) at half room capacity.
"""

from collections import defaultdict
import time
from ortools.sat.python import cp_model


def solve_exams(data: dict, timeout_seconds: int = 60, seed: int = 42) -> dict:
    """
    Solves midsem exam allocations matching E1-E2 and minimizing group multi-exam days.
    """
    start_time = time.time()
    model = cp_model.CpModel()

    cal = data["calendar"]["exam_week"]
    days = cal["days"]  # MON to SAT
    sessions_list = [s["id"] for s in cal["sessions"]]  # ["AM", "PM"]
    exams = {e["id"]: e for e in data.get("exams", [])}
    
    # Filter rooms allowed for exams
    exam_rooms = {r["id"]: r for r in data["rooms"] if "exam" in r.get("allowed_uses", [])}

    slots = [(d, sess) for d in days for sess in sessions_list]

    # Variables:
    # z[eid, slot] -> Bool: exam eid placed in slot
    # w[eid, slot, rid] -> Bool: exam eid uses room rid in slot
    z = {}
    w = {}

    for eid in exams:
        for slot in slots:
            z[(eid, slot)] = model.NewBoolVar(f"z_{eid}_{slot[0]}_{slot[1]}")
            for rid in exam_rooms:
                w[(eid, slot, rid)] = model.NewBoolVar(f"w_{eid}_{slot[0]}_{slot[1]}_{rid}")
                # Room can only be used if exam is in that slot
                model.Add(w[(eid, slot, rid)] <= z[(eid, slot)])

    # ── Constraint E1: Every exam scheduled exactly once ──
    for eid in exams:
        model.AddExactlyOne([z[(eid, slot)] for slot in slots])

    # ── Constraint H5: Half-capacity seating ──
    for eid, ex in exams.items():
        needed_seats = ex["size"]
        for slot in slots:
            model.Add(
                sum(w[(eid, slot, rid)] * (exam_rooms[rid]["capacity"] // 2) for rid in exam_rooms)
                >= needed_seats * z[(eid, slot)]
            )

    # ── Constraint H4: Room double-booking prevention ──
    for slot in slots:
        for rid in exam_rooms:
            model.Add(sum(w[(eid, slot, rid)] for eid in exams) <= 1)

    # ── Constraint H3: Student group double-booking prevention in same slot ──
    for slot in slots:
        for g in data["student_groups"]:
            gid = g["id"]
            exams_for_g = [eid for eid, ex in exams.items() if gid in ex["groups"]]
            if exams_for_g:
                model.Add(sum(z[(eid, slot)] for eid in exams_for_g) <= 1)

    # ── Objective: Minimize multiple exams for same group on same day ──
    penalty_terms = []
    for d in days:
        for g in data["student_groups"]:
            gid = g["id"]
            exams_for_g = [eid for eid, ex in exams.items() if gid in ex["groups"]]
            if len(exams_for_g) > 1:
                # Count exams for group on day d across AM and PM
                day_exam_vars = [z[(eid, (d, sess))] for eid in exams_for_g for sess in sessions_list]
                excess_var = model.NewIntVar(0, len(exams_for_g), f"excess_{gid}_{d}")
                model.Add(sum(day_exam_vars) - 1 <= excess_var)
                penalty_terms.append(5 * excess_var)

    model.Minimize(sum(penalty_terms))

    # Solve
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = float(timeout_seconds)
    solver.parameters.random_seed = seed
    solver.parameters.num_workers = 4

    status_code = solver.Solve(model)
    solve_duration = time.time() - start_time

    if status_code in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        allocations = []
        for eid in exams:
            for slot in slots:
                if solver.Value(z[(eid, slot)]) == 1:
                    assigned_rooms = [rid for rid in exam_rooms if solver.Value(w[(eid, slot, rid)]) == 1]
                    allocations.append({
                        "exam_id": eid,
                        "day": slot[0],
                        "session": slot[1],
                        "rooms": sorted(assigned_rooms)
                    })
        return {
            "status": "OPTIMAL" if status_code == cp_model.OPTIMAL else "FEASIBLE",
            "solve_time": round(solve_duration, 2),
            "allocations": allocations,
            "penalty": solver.ObjectiveValue()
        }
    else:
        return {
            "status": "INFEASIBLE",
            "solve_time": round(solve_duration, 2),
            "allocations": [],
            "error": "Failed to schedule all midsem exams without conflicts."
        }

