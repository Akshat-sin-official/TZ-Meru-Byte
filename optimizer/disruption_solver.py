#!/usr/bin/env python3
"""
Campora Disruption Repair Solver
Powered by Google OR-Tools CP-SAT
Solves the disrupted schedule while minimizing moved sessions (time changed >> room only changed).
"""

from collections import defaultdict
import copy
import time
from ortools.sat.python import cp_model

LAST_TEACHING = 9
LUNCH_PERIOD = 5


def apply_disruption_payload(data: dict, disruption: dict) -> dict:
    """Applies a disruption change payload to dataset dict."""
    d = copy.deepcopy(data)
    fac = {f["id"]: f for f in d["faculty"]}
    for ch in disruption.get("changes", []):
        t = ch["type"]
        if t == "faculty_unavailable":
            for day in ch["days"]:
                fac[ch["faculty_id"]]["unavailable"].append({
                    "day": day, "periods": ch["periods"], "reason": ch.get("reason", "")
                })
        elif t == "room_unavailable":
            for day in ch["days"]:
                d.setdefault("room_unavailability", []).append({
                    "room_id": ch["room_id"], "day": day, "periods": ch["periods"], "reason": ch.get("reason", "")
                })
        elif t == "add_faculty":
            d["faculty"].append(ch["faculty"])
            fac[ch["faculty"]["id"]] = ch["faculty"]
        elif t == "add_session":
            d["sessions"].append(ch["session"])
        elif t == "remove_session":
            d["sessions"] = [s for s in d["sessions"] if s["id"] != ch["session_id"]]
        else:
            raise ValueError(f"Unknown change type: {t}")
    return d


def solve_disruption_repair(mutated_data: dict, baseline_schedule: dict, timeout_seconds: int = 120, seed: int = 42) -> dict:
    """
    Solves for a repaired schedule minimizing divergence from baseline_schedule.
    """
    start_time = time.time()
    model = cp_model.CpModel()

    days = mutated_data["calendar"]["days"]
    lab_starts = set(mutated_data["calendar"]["lab_start_periods"])
    rooms = {r["id"]: r for r in mutated_data["rooms"]}
    faculty = {f["id"]: f for f in mutated_data["faculty"]}
    sessions = {s["id"]: s for s in mutated_data["sessions"]}

    # Baseline assignments
    baseline_map = {}
    for entry in baseline_schedule.get("sessions", []):
        baseline_map[entry["session_id"]] = (entry["day"], entry["start_period"], entry["room_id"])

    # Faculty & Room unavailabilities
    fac_un = defaultdict(set)
    for f in mutated_data["faculty"]:
        for u in f.get("unavailable", []):
            for p in u["periods"]:
                fac_un[f["id"]].add((u["day"], p))

    room_un = defaultdict(set)
    for u in mutated_data.get("room_unavailability", []):
        for p in u["periods"]:
            room_un[u["room_id"]].add((u["day"], p))

    x = {}
    session_slots = defaultdict(list)
    slot_sessions = defaultdict(list)
    fac_slots = defaultdict(list)
    grp_slots = defaultdict(list)
    fac_day_vars = defaultdict(list)
    basket_sessions = defaultdict(list)

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

                per = list(range(p, p + dur))
                if per[0] <= LUNCH_PERIOD < per[-1]:
                    continue
                if s.get("kind") == "lab" and p not in lab_starts:
                    continue
                if any((d, pt) in fac_un[f_id] for pt in per):
                    continue

                for r_id, r in rooms.items():
                    if r["capacity"] < size:
                        continue
                    if r["type"] not in allowed_types:
                        continue
                    if needs_acc and not r.get("accessible"):
                        continue
                    if any((d, pt) in room_un[r_id] for pt in per):
                        continue

                    var = model.NewBoolVar(f"x_{s_id}_{d}_{p}_{r_id}")
                    x[(s_id, d, p, r_id)] = var
                    session_slots[s_id].append((d, p, r_id, var))

                    for pt in per:
                        slot_sessions[(r_id, d, pt)].append(var)
                        fac_slots[(f_id, d, pt)].append(var)
                        for g in s["groups"]:
                            grp_slots[(g, d, pt)].append((var, s_id, bool(bslot), bslot))

                    fac_day_vars[(f_id, d)].append((var, dur))

    # Constraints H1, H4, H2, H3, H11, H12
    for s_id in sessions:
        vars_for_s = [v for (_, _, _, v) in session_slots[s_id]]
        if not vars_for_s:
            return {"status": "INFEASIBLE", "error": f"Session {s_id} has no valid slots after disruption."}
        model.AddExactlyOne(vars_for_s)

    for (r_id, d, pt), var_list in slot_sessions.items():
        if len(var_list) > 1:
            model.Add(sum(var_list) <= 1)

    for (f_id, d, pt), var_list in fac_slots.items():
        if len(var_list) > 1:
            model.Add(sum(var_list) <= 1)

    for (g_id, d, pt), entries in grp_slots.items():
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
                model.Add(sum(non_basket_vars) + b_active <= 1)

    for bslot, sids in basket_sessions.items():
        ref_sid = sids[0]
        for other_sid in sids[1:]:
            for d in days:
                for p in range(1, LAST_TEACHING + 1):
                    ref_vars = [v for (day_c, p_c, _, v) in session_slots[ref_sid] if day_c == d and p_c == p]
                    other_vars = [v for (day_c, p_c, _, v) in session_slots[other_sid] if day_c == d and p_c == p]
                    if ref_vars and other_vars:
                        model.Add(sum(ref_vars) == sum(other_vars))

    for (f_id, d), var_dur_pairs in fac_day_vars.items():
        max_h = faculty[f_id].get("max_hours_per_day", 4)
        model.Add(sum(v * dur for (v, dur) in var_dur_pairs) <= max_h)

    # ── STABILITY OBJECTIVE: Heavily penalize moving from baseline ──
    stability_terms = []
    for (s_id, d, p, r_id), var in x.items():
        if s_id in baseline_map:
            b_day, b_start, b_room = baseline_map[s_id]
            if d != b_day or p != b_start:
                # Time changed -> heavy penalty (100)
                stability_terms.append(100 * var)
            elif r_id != b_room:
                # Same time, room changed -> light penalty (10)
                stability_terms.append(10 * var)
            # If same time & room -> 0 penalty

    model.Minimize(sum(stability_terms))

    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = float(timeout_seconds)
    solver.parameters.random_seed = seed
    solver.parameters.num_workers = 8

    status_code = solver.Solve(model)
    solve_duration = time.time() - start_time

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
            "status": "OPTIMAL" if status_code == cp_model.OPTIMAL else "FEASIBLE",
            "solve_time": round(solve_duration, 2),
            "assignments": assignments
        }
    else:
        return {
            "status": "INFEASIBLE",
            "solve_time": round(solve_duration, 2),
            "assignments": [],
            "error": "Could not repair timetable without hard violations."
        }

