#!/usr/bin/env python3
"""
CIT CampusOS Timetable Solver
Powered by Google OR-Tools CP-SAT
Solves the 189 sessions across 27 rooms with 0 hard violations and minimized soft penalties.
"""

from collections import defaultdict
import time
from ortools.sat.python import cp_model

LAST_TEACHING = 9
LUNCH_PERIOD = 5


def solve_timetable(data: dict, timeout_seconds: int = 120, seed: int = 42) -> dict:
    """
    Builds and solves the CP-SAT model for CIT regular weekly timetable.
    Returns:
      {
        "status": "OPTIMAL" | "FEASIBLE" | "INFEASIBLE",
        "solve_time": float,
        "assignments": [ {"session_id": sid, "day": day, "start_period": p, "room_id": rid} ],
        "statistics": { ... }
      }
    """
    start_time = time.time()
    model = cp_model.CpModel()

    days = data["calendar"]["days"]
    lab_starts = set(data["calendar"]["lab_start_periods"])
    rooms = {r["id"]: r for r in data["rooms"]}
    faculty = {f["id"]: f for f in data["faculty"]}
    groups = {g["id"]: g for g in data["student_groups"]}
    sessions = {s["id"]: s for s in data["sessions"]}

    # Faculty & Room unavailabilities
    fac_un = defaultdict(set)
    for f in data["faculty"]:
        for u in f.get("unavailable", []):
            for p in u["periods"]:
                fac_un[f["id"]].add((u["day"], p))

    room_un = defaultdict(set)
    for u in data.get("room_unavailability", []):
        for p in u["periods"]:
            room_un[u["room_id"]].add((u["day"], p))

    # Pre-filtering & variable creation
    # x[s_id, d, p, r_id]
    x = {}
    session_slots = defaultdict(list)
    slot_sessions = defaultdict(list)  # (r_id, d, t) -> list of (var, sid)
    fac_slots = defaultdict(list)      # (f_id, d, t) -> list of (var, sid)
    grp_slots = defaultdict(list)      # (g_id, d, t) -> list of (var, sid, is_basket)
    fac_day_vars = defaultdict(list)   # (f_id, d) -> list of (var, duration)
    basket_sessions = defaultdict(list) # basket_slot -> list of sid

    for s_id, s in sessions.items():
        dur = s["duration"]
        bslot = s.get("basket_slot")
        if bslot:
            basket_sessions[bslot].append(s_id)

        fx = s.get("fixed_slot")
        allowed_types = set(s.get("room_types", []))
        needs_acc = s.get("needs_accessible", False)
        size = s["size"]
        f_id = s["faculty_id"]

        for d in days:
            if fx and fx.get("day") != d:
                continue

            for p in range(1, LAST_TEACHING - dur + 2):
                if fx and fx.get("start_period") != p:
                    continue

                # Lunch crossing check (H9)
                per = list(range(p, p + dur))
                if per[0] <= LUNCH_PERIOD < per[-1]:
                    continue

                # Lab start period check (H9)
                if s.get("kind") == "lab" and p not in lab_starts:
                    continue

                # Faculty unavailability check (H7)
                if any((d, pt) in fac_un[f_id] for pt in per):
                    continue

                for r_id, r in rooms.items():
                    # Capacity check (H5)
                    if r["capacity"] < size:
                        continue
                    # Room type check (H6)
                    if r["type"] not in allowed_types:
                        continue
                    # Accessibility check (H10)
                    if needs_acc and not r.get("accessible"):
                        continue
                    # Room unavailability check (H8)
                    if any((d, pt) in room_un[r_id] for pt in per):
                        continue

                    # Valid candidate slot!
                    var = model.NewBoolVar(f"x_{s_id}_{d}_{p}_{r_id}")
                    x[(s_id, d, p, r_id)] = var
                    session_slots[s_id].append((d, p, r_id, var))

                    # Track occupancy across all periods occupied by this session
                    for pt in per:
                        slot_sessions[(r_id, d, pt)].append(var)
                        fac_slots[(f_id, d, pt)].append(var)
                        for g in s["groups"]:
                            grp_slots[(g, d, pt)].append((var, s_id, bool(bslot), bslot))

                    fac_day_vars[(f_id, d)].append((var, dur))

    # ── Constraint H1: Exactly one assignment per session ──
    for s_id in sessions:
        vars_for_s = [v for (_, _, _, v) in session_slots[s_id]]
        if not vars_for_s:
            raise ValueError(f"No valid slots possible for session {s_id}")
        model.AddExactlyOne(vars_for_s)

    # ── Constraint H4: Room double-booking prevention ──
    for (r_id, d, pt), var_list in slot_sessions.items():
        if len(var_list) > 1:
            model.Add(sum(var_list) <= 1)

    # ── Constraint H2: Faculty double-booking prevention ──
    for (f_id, d, pt), var_list in fac_slots.items():
        if len(var_list) > 1:
            model.Add(sum(var_list) <= 1)

    # ── Constraint H3: Student group double-booking prevention ──
    for (g_id, d, pt), entries in grp_slots.items():
        # Sessions in the same basket slot do not clash with each other for groups
        # Separate entries by basket vs non-basket
        non_basket_vars = [var for (var, sid, is_b, bslot) in entries if not is_b]
        baskets_present = set(bslot for (var, sid, is_b, bslot) in entries if is_b)

        if not baskets_present:
            if len(non_basket_vars) > 1:
                model.Add(sum(non_basket_vars) <= 1)
        else:
            for bslot in baskets_present:
                basket_vars = [var for (var, sid, is_b, b) in entries if b == bslot]
                b_active = model.NewBoolVar(f"b_act_{g_id}_{bslot}_{d}_{pt}")
                model.Add(sum(basket_vars) >= b_active)
                model.Add(sum(basket_vars) <= len(basket_vars) * b_active)
                # Group can have either non-basket session or one basket
                model.Add(sum(non_basket_vars) + b_active <= 1)

    # ── Constraint H11: Elective Basket Synchronization ──
    # All sessions in basket bslot must share exact (day, start_period)
    for bslot, sids in basket_sessions.items():
        ref_sid = sids[0]
        for other_sid in sids[1:]:
            for d in days:
                for p in range(1, LAST_TEACHING + 1):
                    ref_vars = [v for (day_c, p_c, _, v) in session_slots[ref_sid] if day_c == d and p_c == p]
                    other_vars = [v for (day_c, p_c, _, v) in session_slots[other_sid] if day_c == d and p_c == p]
                    if ref_vars and other_vars:
                        model.Add(sum(ref_vars) == sum(other_vars))
                    elif ref_vars and not other_vars:
                        model.Add(sum(ref_vars) == 0)
                    elif other_vars and not ref_vars:
                        model.Add(sum(other_vars) == 0)

    # ── Constraint H12: Faculty Daily Teaching Limits ──
    for (f_id, d), var_dur_pairs in fac_day_vars.items():
        max_h = faculty[f_id].get("max_hours_per_day", 4)
        model.Add(sum(v * dur for (v, dur) in var_dur_pairs) <= max_h)

    # ── Objective: Minimize Soft Penalties ──
    objective_terms = []

    # S1: Faculty avoided preferences (2 pts per avoided period)
    for (s_id, d, p, r_id), var in x.items():
        s = sessions[s_id]
        f = faculty[s["faculty_id"]]
        per = list(range(p, p + s["duration"]))
        for pref in f.get("preferences", []):
            if pref.get("type") == "avoid" and d in pref.get("days", days):
                avoided_count = sum(1 for pt in per if pt in pref.get("periods", []))
                if avoided_count > 0:
                    objective_terms.append(2 * avoided_count * var)

    # S5: Room utilization < 40% (1 pt)
    for (s_id, d, p, r_id), var in x.items():
        s = sessions[s_id]
        r = rooms[r_id]
        if r["capacity"] and (s["size"] / r["capacity"]) < 0.4:
            objective_terms.append(1 * var)

    # S6: Late teaching in Period 9 (1 pt)
    for (s_id, d, p, r_id), var in x.items():
        s = sessions[s_id]
        if (p + s["duration"] - 1) == LAST_TEACHING:
            objective_terms.append(1 * var)

    model.Minimize(sum(objective_terms))

    # ── Solver Configuration ──
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = float(timeout_seconds)
    solver.parameters.random_seed = seed
    solver.parameters.num_workers = 8

    status_code = solver.Solve(model)
    solve_duration = time.time() - start_time

    status_map = {
        cp_model.OPTIMAL: "OPTIMAL",
        cp_model.FEASIBLE: "FEASIBLE",
        cp_model.INFEASIBLE: "INFEASIBLE",
        cp_model.MODEL_INVALID: "MODEL_INVALID",
        cp_model.UNKNOWN: "UNKNOWN"
    }

    status_str = status_map.get(status_code, "UNKNOWN")

    if status_code in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        assignments = []
        for (s_id, d, p, r_id), var in x.items():
            if solver.Value(var) == 1:
                assignments.append({
                    "session_id": s_id,
                    "day": d,
                    "start_period": p,
                    "room_id": r_id
                })

        return {
            "status": status_str,
            "solve_time": round(solve_duration, 2),
            "assignments": assignments,
            "objective_value": solver.ObjectiveValue(),
            "best_bound": solver.BestObjectiveBound()
        }
    else:
        return {
            "status": status_str,
            "solve_time": round(solve_duration, 2),
            "assignments": [],
            "error": "Could not find a feasible timetable within constraint bounds."
        }

