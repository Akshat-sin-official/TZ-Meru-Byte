#!/usr/bin/env python3
"""
Campora Disruption Repair Solver
Powered by Google OR-Tools CP-SAT
Solves the disrupted schedule while minimizing moved sessions (time changed >> room only changed)
and generates multiple ranked repair plans (Fewest Changes, Best Quality, Least Student Impact).
"""

from collections import defaultdict
import copy
import time
from ortools.sat.python import cp_model

try:
    from optimizer.canonical_validator import validate_schedule
except ImportError:
    from canonical_validator import validate_schedule

LAST_TEACHING = 9
LUNCH_PERIOD = 5


def normalize_disruption(payload: dict) -> dict:
    """
    Normalizes a disruption payload from raw changes or one-tap shorthand format.
    """
    if not payload:
        return {"changes": [], "preferences": {}}

    if "changes" in payload and isinstance(payload["changes"], list):
        norm_changes = []
        for ch in payload["changes"]:
            c = dict(ch)
            if "days" in c and isinstance(c["days"], list):
                c["days"] = [d.upper() for d in c["days"]]
            if "periods" in c and isinstance(c["periods"], list):
                c["periods"] = [int(p) for p in c["periods"]]
            norm_changes.append(c)
        return {
            "changes": norm_changes,
            "preferences": payload.get("preferences", {})
        }

    # One-Tap format normalization
    dtype = payload.get("disruption_type") or payload.get("type")
    target = payload.get("target_id") or payload.get("faculty_id") or payload.get("room_id")
    days = [d.upper() for d in payload.get("days", ["MON"])]
    periods = [int(p) for p in payload.get("periods", list(range(1, 10)))]
    reason = payload.get("reason", "Operational disruption")

    changes = []
    if dtype in ("faculty_unavailable", "faculty"):
        changes.append({
            "type": "faculty_unavailable",
            "faculty_id": target,
            "days": days,
            "periods": periods,
            "reason": reason
        })
    elif dtype in ("room_unavailable", "room"):
        changes.append({
            "type": "room_unavailable",
            "room_id": target,
            "days": days,
            "periods": periods,
            "reason": reason
        })

    prefs = payload.get("preferences", {})
    if "avoid_room" in payload and "avoid_room" not in prefs:
        prefs["avoid_room"] = payload["avoid_room"]

    return {
        "changes": changes,
        "preferences": prefs
    }


def identify_affected_sessions(dataset: dict, baseline_schedule: dict, disruption: dict) -> list:
    """
    Identifies all sessions in baseline_schedule directly conflicting with the disruption.
    """
    norm = normalize_disruption(disruption)
    sessions = {s["id"]: s for s in dataset.get("sessions", [])}
    fac_un = defaultdict(set)
    room_un = defaultdict(set)

    for ch in norm.get("changes", []):
        t = ch.get("type")
        if t == "faculty_unavailable" and "faculty_id" in ch:
            for d in ch.get("days", []):
                for p in ch.get("periods", []):
                    fac_un[ch["faculty_id"]].add((d, p))
        elif t == "room_unavailable" and "room_id" in ch:
            for d in ch.get("days", []):
                for p in ch.get("periods", []):
                    room_un[ch["room_id"]].add((d, p))

    affected = []
    for entry in baseline_schedule.get("sessions", []):
        s_id = entry["session_id"]
        s = sessions.get(s_id)
        if not s:
            continue
        d = entry["day"]
        start = entry["start_period"]
        dur = s.get("duration", 1)
        room = entry["room_id"]
        f_id = s.get("faculty_id", "")
        pers = list(range(start, start + dur))

        is_affected = False
        reasons = []
        if any((d, pt) in fac_un[f_id] for pt in pers):
            is_affected = True
            reasons.append(f"Faculty {f_id} unavailable on {d} during session")
        if any((d, pt) in room_un[room] for pt in pers):
            is_affected = True
            reasons.append(f"Room {room} unavailable on {d} during session")

        if is_affected:
            affected.append({
                "session_id": s_id,
                "course_id": s.get("course_id", ""),
                "faculty_id": f_id,
                "groups": s.get("groups", []),
                "day": d,
                "start_period": start,
                "duration": dur,
                "room_id": room,
                "reasons": reasons
            })

    return affected


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
    Maintained for direct single-repair calls and backward compatibility.
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

    # STABILITY OBJECTIVE: Heavily penalize moving from baseline
    stability_terms = []
    for (s_id, d, p, r_id), var in x.items():
        if s_id in baseline_map:
            b_day, b_start, b_room = baseline_map[s_id]
            if d != b_day or p != b_start:
                stability_terms.append(100 * var)
            elif r_id != b_room:
                stability_terms.append(10 * var)

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


def solve_ranked_disruption_repairs(
    dataset: dict,
    disruption: dict,
    baseline_schedule: dict,
    preferences: dict = None,
    timeout_per_option: int = 15,
    seed: int = 42
) -> dict:
    """
    Generates up to 3 distinct, ranked repair plans:
    Option A: Fewest Changes (minimum moves)
    Option B: Best Timetable Quality / Avoid Room Preference (up to A + k moves)
    Option C: Least Student Impact (minimizes student cohort time disruptions)
    Validates every candidate plan against canonical_validator and calculates all Section 6 metrics.
    """
    start_time = time.time()
    norm_disruption = normalize_disruption(disruption)
    preferences = preferences or norm_disruption.get("preferences", {})
    avoid_room = preferences.get("avoid_room")

    # Apply disruption to dataset
    mutated_data = apply_disruption_payload(dataset, norm_disruption)

    # Identify affected sessions
    affected_sessions_list = identify_affected_sessions(dataset, baseline_schedule, norm_disruption)
    affected_ids = set(a["session_id"] for a in affected_sessions_list)

    # Baseline map
    baseline_map = {
        entry["session_id"]: (entry["day"], entry["start_period"], entry["room_id"])
        for entry in baseline_schedule.get("sessions", [])
    }

    # Baseline soft score
    baseline_val = validate_schedule(dataset, baseline_schedule)
    baseline_soft = baseline_val.get("soft_total", 0) or 0

    days = mutated_data["calendar"]["days"]
    lab_starts = set(mutated_data["calendar"]["lab_start_periods"])
    rooms = {r["id"]: r for r in mutated_data["rooms"]}
    faculty = {f["id"]: f for f in mutated_data["faculty"]}
    sessions = {s["id"]: s for s in mutated_data["sessions"]}
    group_sizes = {g["id"]: g.get("size", 0) for g in mutated_data.get("student_groups", [])}

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

    def solve_for_objective(mode: str, option_seed: int):
        model = cp_model.CpModel()
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

            for day_c in days:
                if fx and fx.get("day") != day_c:
                    continue
                for p in range(1, LAST_TEACHING - dur + 2):
                    if fx and fx.get("start_period") != p:
                        continue
                    per = list(range(p, p + dur))
                    if per[0] <= LUNCH_PERIOD < per[-1]:
                        continue
                    if s.get("kind") == "lab" and p not in lab_starts:
                        continue
                    if any((day_c, pt) in fac_un[f_id] for pt in per):
                        continue

                    for r_id, r in rooms.items():
                        if r["capacity"] < size:
                            continue
                        if r["type"] not in allowed_types:
                            continue
                        if needs_acc and not r.get("accessible"):
                            continue
                        if any((day_c, pt) in room_un[r_id] for pt in per):
                            continue

                        var = model.NewBoolVar(f"x_{s_id}_{day_c}_{p}_{r_id}")
                        x[(s_id, day_c, p, r_id)] = var
                        session_slots[s_id].append((day_c, p, r_id, var))

                        for pt in per:
                            slot_sessions[(r_id, day_c, pt)].append(var)
                            fac_slots[(f_id, day_c, pt)].append(var)
                            for g in s["groups"]:
                                grp_slots[(g, day_c, pt)].append((var, s_id, bool(bslot), bslot))

                        fac_day_vars[(f_id, day_c)].append((var, dur))

        # Constraints H1-H13
        for s_id in sessions:
            vars_for_s = [v for (_, _, _, v) in session_slots[s_id]]
            if not vars_for_s:
                return None, "INFEASIBLE"
            model.AddExactlyOne(vars_for_s)

        for (r_id, day_c, pt), var_list in slot_sessions.items():
            if len(var_list) > 1:
                model.Add(sum(var_list) <= 1)

        for (f_id, day_c, pt), var_list in fac_slots.items():
            if len(var_list) > 1:
                model.Add(sum(var_list) <= 1)

        for (g_id, day_c, pt), entries in grp_slots.items():
            non_basket_vars = [var for (var, sid, is_b, bslot) in entries if not is_b]
            baskets_present = set(bslot for (var, sid, is_b, bslot) in entries if is_b)
            if not baskets_present:
                if len(non_basket_vars) > 1:
                    model.Add(sum(non_basket_vars) <= 1)
            else:
                for bslot in baskets_present:
                    basket_vars = [var for (var, sid, is_b, b) in entries if b == bslot]
                    b_active = model.NewBoolVar(f"b_act_{g_id}_{bslot}_{day_c}_{pt}")
                    model.Add(sum(basket_vars) >= b_active)
                    model.Add(sum(basket_vars) <= len(basket_vars) * b_active)
                    model.Add(sum(non_basket_vars) + b_active <= 1)

        for bslot, sids in basket_sessions.items():
            ref_sid = sids[0]
            for other_sid in sids[1:]:
                for day_c in days:
                    for p in range(1, LAST_TEACHING + 1):
                        ref_vars = [v for (d_c, p_c, _, v) in session_slots[ref_sid] if d_c == day_c and p_c == p]
                        other_vars = [v for (d_c, p_c, _, v) in session_slots[other_sid] if d_c == day_c and p_c == p]
                        if ref_vars and other_vars:
                            model.Add(sum(ref_vars) == sum(other_vars))

        for (f_id, day_c), var_dur_pairs in fac_day_vars.items():
            max_h = faculty[f_id].get("max_hours_per_day", 4)
            model.Add(sum(v * dur for (v, dur) in var_dur_pairs) <= max_h)

        # Objective configuration
        obj_terms = []
        for (s_id, day_c, p, r_id), var in x.items():
            s = sessions[s_id]
            if s_id in baseline_map:
                b_day, b_start, b_room = baseline_map[s_id]
                is_time_diff = (day_c != b_day or p != b_start)
                is_room_diff = (r_id != b_room)

                if mode == "fewest_changes":
                    if is_time_diff:
                        obj_terms.append(100 * var)
                    elif is_room_diff:
                        obj_terms.append(10 * var)

                elif mode == "best_quality":
                    if is_time_diff:
                        obj_terms.append(50 * var)
                    elif is_room_diff:
                        obj_terms.append(10 * var)
                    if avoid_room and r_id == avoid_room:
                        obj_terms.append(500 * var)

                elif mode == "least_student_impact":
                    cohort_size = sum(group_sizes.get(g, 0) for g in s["groups"])
                    if is_time_diff:
                        obj_terms.append((100 + cohort_size // 2) * var)
                    elif is_room_diff:
                        obj_terms.append(2 * var)

        model.Minimize(sum(obj_terms))

        solver = cp_model.CpSolver()
        solver.parameters.max_time_in_seconds = float(timeout_per_option)
        solver.parameters.random_seed = option_seed
        solver.parameters.num_workers = 8

        status_code = solver.Solve(model)
        if status_code in (cp_model.OPTIMAL, cp_model.FEASIBLE):
            assigns = []
            for (s_id, day_c, p, r_id), var in x.items():
                if solver.Value(var) == 1:
                    assigns.append({
                        "session_id": s_id,
                        "day": day_c,
                        "start_period": p,
                        "room_id": r_id
                    })
            status_str = "OPTIMAL" if status_code == cp_model.OPTIMAL else "FEASIBLE"
            return assigns, status_str
        else:
            return None, "INFEASIBLE"

    # Step 1: Option A (Fewest Changes)
    optA_assigns, optA_status = solve_for_objective("fewest_changes", seed)
    if not optA_assigns:
        return {
            "status": "INFEASIBLE",
            "error": "Unable to find conflict-free timetable repair.",
            "affected_sessions": affected_sessions_list,
            "options": []
        }

    # Step 2: Option B (Best Quality / Room Preference)
    optB_assigns, optB_status = solve_for_objective("best_quality", seed + 1)

    # Step 3: Option C (Least Student Impact)
    optC_assigns, optC_status = solve_for_objective("least_student_impact", seed + 2)

    candidates_raw = [
        ("fewest_changes", "Fewest Changes", "Option 1 — Fewest Changes", optA_assigns, optA_status),
        ("best_quality", f"Avoid {avoid_room}" if avoid_room else "Best Timetable Quality", f"Option 2 — {f'Avoid {avoid_room}' if avoid_room else 'Best Timetable Quality'}", optB_assigns, optB_status),
        ("least_student_impact", "Least Student Impact", "Option 3 — Least Student Impact", optC_assigns, optC_status)
    ]

    seen_fingerprints = set()
    ranked_options = []

    for key, name, label, assigns, solver_st in candidates_raw:
        if not assigns:
            continue
        fingerprint = tuple(sorted((a["session_id"], a["day"], a["start_period"], a["room_id"]) for a in assigns))
        if fingerprint in seen_fingerprints:
            continue
        seen_fingerprints.add(fingerprint)

        moved_sessions = []
        time_changes = 0
        room_only_changes = 0
        affected_groups_set = set()

        for a in assigns:
            sid = a["session_id"]
            if sid in baseline_map:
                b_day, b_start, b_room = baseline_map[sid]
                if b_day != a["day"] or b_start != a["start_period"] or b_room != a["room_id"]:
                    is_time = (b_day != a["day"] or b_start != a["start_period"])
                    if is_time:
                        time_changes += 1
                        for g in sessions[sid]["groups"]:
                            affected_groups_set.add(g)
                    else:
                        room_only_changes += 1

                    if sid in affected_ids:
                        reason = "Directly affected by disruption window"
                    else:
                        reason = "Relocated to vacate slot for affected session"

                    moved_sessions.append({
                        "session_id": sid,
                        "course_id": sessions[sid].get("course_id", ""),
                        "faculty_id": sessions[sid].get("faculty_id", ""),
                        "groups": sessions[sid].get("groups", []),
                        "old_slot": {"day": b_day, "start_period": b_start, "room_id": b_room},
                        "new_slot": {"day": a["day"], "start_period": a["start_period"], "room_id": a["room_id"]},
                        "type": "time_changed" if is_time else "room_only_changed",
                        "is_direct_affected": sid in affected_ids,
                        "reason": reason
                    })

        students_affected = sum(group_sizes.get(g, 0) for g in affected_groups_set)

        # Validate complete schedule with canonical_validator using mutated_data
        cand_sched = {
            "sessions": assigns,
            "fest_week": baseline_schedule.get("fest_week", {}),
            "exams": baseline_schedule.get("exams", [])
        }
        val_report = validate_schedule(mutated_data, cand_sched, baseline_schedule)
        hard_violations = [v for v in val_report.get("hard_violations", []) if v.get("rule", "").startswith("H") or v.get("where") == "timetable"]
        cand_soft = val_report.get("soft_total", 0) or 0
        soft_delta = cand_soft - baseline_soft

        ranked_options.append({
            "key": key,
            "name": name,
            "label": label,
            "sessions_moved": len(moved_sessions),
            "time_changes": time_changes,
            "room_only_changes": room_only_changes,
            "soft_delta": soft_delta,
            "students_affected": students_affected,
            "affected_student_groups": list(affected_groups_set),
            "affected_sessions": len(affected_ids),
            "additional_sessions_moved": len(moved_sessions) - len(affected_ids.intersection(set(m["session_id"] for m in moved_sessions))),
            "solver_status": solver_st,
            "validation_status": "VALID" if len(hard_violations) == 0 else "INVALID",
            "hard_violations_count": len(hard_violations),
            "hard_violations": hard_violations,
            "moved_sessions": moved_sessions,
            "assignments": assigns
        })

    return {
        "status": "SUCCESS" if ranked_options else "INFEASIBLE",
        "solve_duration": round(time.time() - start_time, 2),
        "affected_sessions": affected_sessions_list,
        "affected_count": len(affected_sessions_list),
        "options_count": len(ranked_options),
        "options": ranked_options
    }
