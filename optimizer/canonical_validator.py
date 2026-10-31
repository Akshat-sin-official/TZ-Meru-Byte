#!/usr/bin/env python3
"""
CIT CampusOS Canonical Validator
100% parity with official validator.py
Single Source of Truth for all constraint validation across the platform.
"""

from collections import defaultdict
import copy

CAT_WEIGHT = {"institute_event": 5, "guest_lecture": 4, "department_event": 3, "club_event": 2}
MAX_PERIOD = 13
LAST_TEACHING = 9


def block(start: int, dur: int):
    return list(range(start, start + dur))


# Canonical 6-level room conflict resolution hierarchy:
# When two requests want the same room at the same time, this order decides who gets it:
# 1. Exams
# 2. Regular classes
# 3. Institute events (Spectra main events, convocation)
# 4. Guest lectures
# 5. Department events
# 6. Club events
ROOM_PRIORITY_ORDER = [
    "exam",              # 1. Exams
    "regular_session",   # 2. Regular classes
    "institute_event",   # 3. Institute events (Spectra main events, convocation)
    "guest_lecture",     # 4. Guest lectures
    "department_event",  # 5. Department events
    "club_event",        # 6. Club events
]

CATEGORY_NORMALIZATION = {
    "exam": "exam",
    "exams": "exam",
    "examination": "exam",
    "midsem": "exam",
    "endsem": "exam",
    "regular_session": "regular_session",
    "regular_class": "regular_session",
    "regular_classes": "regular_session",
    "class": "regular_session",
    "classes": "regular_session",
    "lecture": "regular_session",
    "session": "regular_session",
    "institute_event": "institute_event",
    "institute_events": "institute_event",
    "convocation": "institute_event",
    "spectra_main": "institute_event",
    "guest_lecture": "guest_lecture",
    "guest_lectures": "guest_lecture",
    "department_event": "department_event",
    "department_events": "department_event",
    "dept_event": "department_event",
    "club_event": "club_event",
    "club_events": "club_event",
    "club": "club_event",
}

CATEGORY_DISPLAY_NAMES = {
    "exam": "Exams",
    "regular_session": "Regular classes",
    "institute_event": "Institute events",
    "guest_lecture": "Guest lectures",
    "department_event": "Department events",
    "club_event": "Club events",
}


def normalize_category(cat: str) -> str:
    """Normalizes category string or alias to canonical hierarchy key."""
    if not cat:
        return "club_event"
    key = str(cat).strip().lower().replace(" ", "_")
    return CATEGORY_NORMALIZATION.get(key, key)


def effective_category(data: dict, req: dict) -> str:
    order = (data.get("priority_order") if data else None) or ROOM_PRIORITY_ORDER
    
    # Explicit exam or course session identifiers
    if req.get("exam_id") or req.get("examExternalId"):
        return "exam"
    if req.get("session_id") or req.get("sessionExternalId"):
        return "regular_session"

    raw_req = req.get("requested_category", req.get("category", "club_event"))
    requested = normalize_category(raw_req)
    role = str(req.get("role", "")).lower()

    # Academic entities (Exams & Regular classes) are not event-capped
    if requested == "exam" and (role in ("admin", "system", "exam_cell") or not role):
        return "exam"
    if requested == "regular_session" and (role in ("admin", "faculty", "academic_cell", "coordinator", "department_coordinator") or not role):
        return "regular_session"

    role_caps = data.get("role_category_cap", {}) if data else {
        "admin": "institute_event",
        "faculty": "guest_lecture",
        "department_coordinator": "department_event",
        "coordinator": "department_event",
        "club": "club_event"
    }
    cap = role_caps.get(role, "club_event")
    cap_normalized = normalize_category(cap)

    a = order.index(requested) if requested in order else len(order) - 1
    cap_idx = order.index(cap_normalized) if cap_normalized in order else len(order) - 1
    return order[max(a, cap_idx)]


def outranks(data: dict, r1: dict, r2: dict) -> bool:
    """True if request r1 has priority over r2 based on the 6-level hierarchy."""
    order = (data.get("priority_order") if data else None) or ROOM_PRIORITY_ORDER
    c1 = order.index(effective_category(data, r1)) if effective_category(data, r1) in order else len(order)
    c2 = order.index(effective_category(data, r2)) if effective_category(data, r2) in order else len(order)
    if c1 != c2:
        return c1 < c2
    return r1.get("submitted_at", "") < r2.get("submitted_at", "")


def resolve_room_conflict(data: dict, r1: dict, r2: dict) -> dict:
    """
    When two requests want the same room at the same time, this order decides who gets it:
    1. Exams
    2. Regular classes
    3. Institute events (Spectra main events, convocation)
    4. Guest lectures
    5. Department events
    6. Club events

    Ties are broken by earlier submitted_at timestamp.
    """
    order = (data.get("priority_order") if data else None) or ROOM_PRIORITY_ORDER
    cat1 = effective_category(data or {}, r1)
    cat2 = effective_category(data or {}, r2)
    rank1 = order.index(cat1) + 1 if cat1 in order else len(order)
    rank2 = order.index(cat2) + 1 if cat2 in order else len(order)

    id1 = r1.get("id") or r1.get("external_id") or r1.get("session_id") or "Request 1"
    id2 = r2.get("id") or r2.get("external_id") or r2.get("session_id") or "Request 2"
    sub1 = r1.get("submitted_at", "")
    sub2 = r2.get("submitted_at", "")

    label1 = CATEGORY_DISPLAY_NAMES.get(cat1, cat1.replace("_", " ").title())
    label2 = CATEGORY_DISPLAY_NAMES.get(cat2, cat2.replace("_", " ").title())

    if rank1 < rank2:
        winner, loser = r1, r2
        reason = f"{label1} (Rank {rank1}) takes precedence over {label2} (Rank {rank2})."
    elif rank2 < rank1:
        winner, loser = r2, r1
        reason = f"{label2} (Rank {rank2}) takes precedence over {label1} (Rank {rank1})."
    else:
        # Same priority level -> earlier submitted_at wins
        if sub1 and sub2 and sub1 != sub2:
            if sub1 < sub2:
                winner, loser = r1, r2
                reason = f"Both are {label1} (Rank {rank1}). Winner resolved by earlier submission: {id1} ({sub1}) beat {id2} ({sub2})."
            else:
                winner, loser = r2, r1
                reason = f"Both are {label2} (Rank {rank2}). Winner resolved by earlier submission: {id2} ({sub2}) beat {id1} ({sub1})."
        else:
            winner, loser = r1, r2
            reason = f"Both are {label1} (Rank {rank1}) with equal or unrecorded submission time. First listed request gets the room."

    return {
        "winner_id": winner.get("id") or winner.get("external_id") or winner.get("session_id") or "winner",
        "loser_id": loser.get("id") or loser.get("external_id") or loser.get("session_id") or "loser",
        "winner": winner,
        "loser": loser,
        "winner_rank": rank1 if winner == r1 else rank2,
        "loser_rank": rank2 if winner == r1 else rank1,
        "winner_category": cat1 if winner == r1 else cat2,
        "loser_category": cat2 if winner == r1 else cat1,
        "reason": reason,
        "hierarchy": [
            {"rank": i + 1, "category": k, "label": CATEGORY_DISPLAY_NAMES.get(k, k)}
            for i, k in enumerate(order)
        ]
    }


class ValidationContext:
    def __init__(self, data: dict):
        self.data = data
        self.days = data["calendar"]["days"]
        self.lab_starts = set(data["calendar"]["lab_start_periods"])
        self.lunch = data["calendar"]["lunch"]["after_period"]
        self.rooms = {r["id"]: r for r in data["rooms"]}
        self.fac = {f["id"]: f for f in data["faculty"]}
        self.groups = {g["id"]: g for g in data["student_groups"]}
        self.sessions = {s["id"]: s for s in data["sessions"]}
        self.req = {b["id"]: b for b in data.get("booking_requests", [])}
        self.cancelled = {c["request_id"] for c in data.get("cancellations", [])}
        
        self.fac_un = defaultdict(set)
        for f in data["faculty"]:
            for u in f.get("unavailable", []):
                for p in u["periods"]:
                    self.fac_un[f["id"]].add((u["day"], p))
                    
        self.room_un = defaultdict(set)
        for u in data.get("room_unavailability", []):
            for p in u["periods"]:
                self.room_un[u["room_id"]].add((u["day"], p))


def check_timetable(ctx: ValidationContext, assign: dict, label: str):
    """
    assign: session_id -> (day, start, room_id)
    Returns list of hard violations V and grp_occ mapping.
    """
    V = []
    def v(rule, msg):
        V.append({"rule": rule, "where": label, "detail": msg})

    room_occ = defaultdict(list)
    fac_occ = defaultdict(list)
    grp_occ = defaultdict(set)
    fac_day = defaultdict(int)
    basket_time = defaultdict(set)

    for sid in ctx.sessions:
        if sid not in assign:
            v("H1", f"Session {sid} is not scheduled")
            
    for sid, (day, start, rid) in assign.items():
        s = ctx.sessions.get(sid)
        if s is None:
            v("H1", f"Unknown session id {sid}")
            continue
        if day not in ctx.days:
            v("H1", f"{sid}: invalid day {day}")
            continue
        if not isinstance(start, int) or start < 1 or start + s["duration"] - 1 > LAST_TEACHING:
            v("H9", f"{sid}: start period {start} with duration {s['duration']} runs outside P1-P9")
            continue
        r = ctx.rooms.get(rid)
        if r is None:
            v("H1", f"{sid}: unknown room {rid}")
            continue
            
        per = block(start, s["duration"])
        if per[0] <= ctx.lunch < per[-1]:
            v("H9", f"{sid}: crosses lunch ({day} P{per[0]}-P{per[-1]})")
        if s.get("kind") == "lab" and start not in ctx.lab_starts:
            v("H9", f"{sid}: lab must start at P2 or P6, starts at P{start}")
            
        fx = s.get("fixed_slot")
        if fx and (fx.get("day") != day or fx.get("start_period") != start):
            v("H14", f"{sid}: fixed at {fx['day']} P{fx['start_period']}, placed at {day} P{start}")
            
        if r["capacity"] < s["size"]:
            v("H5", f"{sid}: size {s['size']} > {rid} capacity {r['capacity']}")
        if r["type"] not in s.get("room_types", []):
            v("H6", f"{sid}: needs {s.get('room_types')}, {rid} is {r['type']}")
        if s.get("needs_accessible") and not r.get("accessible"):
            v("H10", f"{sid}: needs an accessible room, {rid} is not")
            
        f = s["faculty_id"]
        for p in per:
            room_occ[(rid, day, p)].append(sid)
            fac_occ[(f, day, p)].append(sid)
            key = s.get("basket_slot") or sid
            for g in s["groups"]:
                grp_occ[(g, day, p)].add(key)
            if (day, p) in ctx.fac_un[f]:
                v("H7", f"{sid}: {f} unavailable {day} P{p}")
            if (day, p) in ctx.room_un[rid]:
                v("H8", f"{sid}: {rid} unavailable {day} P{p}")
                
        fac_day[(f, day)] += s["duration"]
        if s.get("basket_slot"):
            basket_time[s["basket_slot"]].add((day, start))

    for (rid, day, p), sids in room_occ.items():
        if len(sids) > 1:
            v("H4", f"{rid} double-booked {day} P{p}: {', '.join(sorted(sids))}")
    for (f, day, p), sids in fac_occ.items():
        if len(sids) > 1:
            v("H2", f"{f} double-booked {day} P{p}: {', '.join(sorted(sids))}")
    for (g, day, p), keys in grp_occ.items():
        if len(keys) > 1:
            v("H3", f"Group {g} double-booked {day} P{p}: {', '.join(sorted(keys))}")
    for b, times in basket_time.items():
        if len(times) > 1:
            v("H11", f"Basket {b} sessions are not at the same time: {sorted(times)}")
    for (f, day), h in fac_day.items():
        mx = ctx.fac[f].get("max_hours_per_day", 4)
        if h > mx:
            v("H12", f"{f} teaches {h} hours on {day} (max {mx})")
            
    return V, grp_occ


def soft_score(ctx: ValidationContext, assign: dict):
    pen = defaultdict(int)
    grp_day = defaultdict(set)
    grp_hours = defaultdict(int)
    grp_course = defaultdict(int)
    seen_basket = set()

    for sid, (day, start, rid) in assign.items():
        s = ctx.sessions.get(sid)
        r = ctx.rooms.get(rid)
        if s is None or r is None:
            continue
        per = block(start, s["duration"])
        for pref in ctx.fac.get(s["faculty_id"], {}).get("preferences", []):
            if pref.get("type") == "avoid" and day in pref.get("days", ctx.days):
                pen["S1"] += 2 * sum(1 for p in per if p in pref.get("periods", []))
        if r["capacity"] and s["size"] / r["capacity"] < 0.4:
            pen["S5"] += 1
        if LAST_TEACHING in per:
            pen["S6"] += 1

        for g in s["groups"]:
            for p in per:
                grp_day[(g, day)].add(p)
            if s.get("basket_slot"):
                if (g, s["basket_slot"]) in seen_basket:
                    continue
                seen_basket.add((g, s["basket_slot"]))
            grp_hours[(g, day)] += s["duration"]
            if s.get("kind") == "lecture" and not s.get("basket_slot"):
                grp_course[(g, day, s["course_id"])] += 1

    for (g, day), ps in grp_day.items():
        pen["S2"] += sum(1 for p in range(min(ps), max(ps) + 1) if p not in ps)
    for k, h in grp_hours.items():
        if h > 6:
            pen["S3"] += 3 * (h - 6)
    for k, c in grp_course.items():
        if c > 1:
            pen["S4"] += 3 * (c - 1)

    # Basket lectures of the same course twice in a day
    bc = defaultdict(int)
    for sid, (day, start, rid) in assign.items():
        s = ctx.sessions.get(sid)
        if s and s.get("basket_slot"):
            bc[(s["course_id"], day)] += 1
    for k, c in bc.items():
        if c > 1:
            pen["S4"] += 3 * (c - 1)

    for k in ("S1", "S2", "S3", "S4", "S5", "S6"):
        pen.setdefault(k, 0)
    return dict(sorted(pen.items())), sum(pen.values())


def check_bookings(ctx: ValidationContext, base: dict, fest: dict):
    V, W = [], []
    data = ctx.data
    overrides = fest.get("session_overrides", [])
    decisions = fest.get("bookings", [])
    dec_by = {}
    for d in decisions:
        if d.get("request_id") in dec_by:
            V.append({"rule": "B1", "where": "fest_week", "detail": f"Two decisions for {d['request_id']}"})
        dec_by[d.get("request_id")] = d

    week = dict(base)
    for o in overrides:
        sid = o.get("session_id")
        if sid not in ctx.sessions:
            V.append({"rule": "B2", "where": "fest_week", "detail": f"Override for unknown session {sid}"})
            continue
        disp = dec_by.get(o.get("displaced_by"))
        req = ctx.req.get(o.get("displaced_by"))
        if not req or not disp or disp.get("status") != "approved":
            V.append({"rule": "B2", "where": "fest_week", "detail": f"Override of {sid} names {o.get('displaced_by')}, which is not an approved booking"})
        elif data["priority_order"].index(effective_category(data, req)) > data["priority_order"].index("institute_event"):
            V.append({"rule": "B2", "where": "fest_week", "detail": f"{o['displaced_by']} ({effective_category(data, req)}) is not allowed to displace a regular session"})
        week[sid] = (o["day"], o["start_period"], o["room_id"])
        
    wv, wgrp = check_timetable(ctx, week, "fest_week")
    V += wv

    room_busy = defaultdict(list)
    for sid, (day, start, rid) in week.items():
        s = ctx.sessions.get(sid)
        if s:
            for p in block(start, s["duration"]):
                room_busy[(rid, day, p)].append(sid)

    score, max_score = 0.0, 0
    placed = {}
    for rid_, req in ctx.req.items():
        if rid_ not in ctx.cancelled:
            max_score += CAT_WEIGHT[effective_category(data, req)]

    for req_id, req in ctx.req.items():
        d = dec_by.get(req_id)
        if d is None:
            W.append(f"No decision for {req_id}")
            continue
        st = d.get("status")
        if req_id in ctx.cancelled:
            if st in ("approved", "alternative_offered"):
                V.append({"rule": "B3", "where": "fest_week", "detail": f"{req_id} was cancelled but is {st}"})
            continue
        if st not in ("approved", "rejected", "alternative_offered"):
            V.append({"rule": "B1", "where": "fest_week", "detail": f"{req_id}: unknown status {st}"})
            continue
        if st in ("rejected", "alternative_offered") and not str(d.get("reason", "")).strip():
            W.append(f"{req_id}: {st} without a reason")
        if st == "rejected":
            continue

        ok = True
        def bad(msg):
            nonlocal ok
            ok = False
            V.append({"rule": "H13", "where": "fest_week", "detail": f"{req_id}: {msg}"})

        room = ctx.rooms.get(d.get("room_id"))
        day, a, b = d.get("day"), d.get("start_period"), d.get("end_period")
        if room is None:
            bad(f"unknown room {d.get('room_id')}"); continue
        if day not in ctx.days or not isinstance(a, int) or not isinstance(b, int) or a < 1 or b > MAX_PERIOD or b < a:
            bad(f"invalid time {day} P{a}-P{b}"); continue
        if b - a + 1 != req["duration_periods"]:
            bad(f"booked {b-a+1} periods, request needs {req['duration_periods']}")
        if "event" not in room.get("allowed_uses", []):
            bad(f"{room['id']} cannot host events")
        if room["type"] not in req.get("room_types", []):
            bad(f"{room['id']} ({room['type']}) is not one of {req.get('room_types')}")
        if room["capacity"] < req["attendance"]:
            bad(f"{room['id']} seats {room['capacity']}, request needs {req['attendance']}")
        feats = set(room.get("features", [])) | ({"accessible"} if room.get("accessible") else set())
        miss = set(req.get("needs", [])) - feats
        if miss:
            bad(f"{room['id']} lacks {sorted(miss)}")
        if st == "approved":
            inside = any(w["day"] == day and w["from_period"] <= a and b <= w["to_period"] for w in req.get("windows", []))
            if not inside:
                bad(f"approved at {day} P{a}-P{b}, outside the requested windows (use alternative_offered)")
        for p in range(a, b + 1):
            if (day, p) in ctx.room_un[room["id"]]:
                bad(f"{room['id']} unavailable {day} P{p}")
            if room_busy[(room["id"], day, p)]:
                bad(f"{room['id']} {day} P{p} already used by {', '.join(room_busy[(room['id'], day, p)])}")
            for g in req.get("mandatory_for_groups", []):
                if wgrp.get((g, day, p)):
                    bad(f"mandatory for {g}, who have class {day} P{p}")
        if ok:
            for p in range(a, b + 1):
                room_busy[(room["id"], day, p)].append(req_id)
            placed[req_id] = (room["id"], day, a, b)
            score += CAT_WEIGHT[effective_category(data, req)] * (1 if st == "approved" else 0.5)

    # Priority Inversions
    inversions = []
    for req_id, req in ctx.req.items():
        d = dec_by.get(req_id)
        if req_id in ctx.cancelled or not d or d.get("status") != "rejected":
            continue
        for other_id, (rid, day, a, b) in placed.items():
            other = ctx.req[other_id]
            if dec_by[other_id].get("status") != "approved" or not outranks(data, req, other):
                continue
            room = ctx.rooms[rid]
            feats = set(room.get("features", [])) | ({"accessible"} if room.get("accessible") else set())
            if room["type"] not in req.get("room_types", []) or room["capacity"] < req["attendance"] or set(req.get("needs", [])) - feats:
                continue
            for w in req.get("windows", []):
                if w["day"] != day:
                    continue
                for s0 in range(w["from_period"], w["to_period"] - req["duration_periods"] + 2):
                    per = range(s0, s0 + req["duration_periods"])
                    if per[-1] > MAX_PERIOD or not any(a <= p <= b for p in per):
                        continue
                    clash = False
                    for p in per:
                        if (day, p) in ctx.room_un[rid]:
                            clash = True
                        if [x for x in room_busy[(rid, day, p)] if x != other_id]:
                            clash = True
                        for g in req.get("mandatory_for_groups", []):
                            if wgrp.get((g, day, p)):
                                clash = True
                    if not clash:
                        inversions.append(f"{req_id} rejected, but {other_id} (lower priority) holds {rid} {day} P{a}-P{b} that {req_id} could use")
                        break
                else:
                    continue
                break

    return V, W, {
        "booking_score": score,
        "booking_score_max_if_all_approved": max_score,
        "approved": sum(1 for x in decisions if x.get("status") == "approved"),
        "alternatives": sum(1 for x in decisions if x.get("status") == "alternative_offered"),
        "rejected": sum(1 for x in decisions if x.get("status") == "rejected"),
        "session_overrides": len(overrides),
        "priority_inversions": inversions
    }


def check_exams(ctx: ValidationContext, exams_out: list):
    data = ctx.data
    V, pen = [], 0
    ex = {e["id"]: e for e in data.get("exams", [])}
    cal = data["calendar"]["exam_week"]
    sess_ids = {s["id"] for s in cal["sessions"]}
    room_use, grp_use, grp_day = defaultdict(list), defaultdict(list), defaultdict(set)
    seen = set()

    for e in exams_out:
        eid = e.get("exam_id")
        if eid not in ex:
            V.append({"rule": "E1", "where": "exams", "detail": f"Unknown exam {eid}"}); continue
        if eid in seen:
            V.append({"rule": "E1", "where": "exams", "detail": f"{eid} scheduled twice"})
        seen.add(eid)
        if e.get("day") not in cal["days"] or e.get("session") not in sess_ids:
            V.append({"rule": "E1", "where": "exams", "detail": f"{eid}: invalid slot"}); continue
        seats = 0
        for rid in e.get("rooms", []):
            r = ctx.rooms.get(rid)
            if r is None or "exam" not in r.get("allowed_uses", []):
                V.append({"rule": "E2", "where": "exams", "detail": f"{eid}: {rid} cannot host exams"}); continue
            seats += r["capacity"] // 2
            room_use[(rid, e["day"], e["session"])].append(eid)
        if seats < ex[eid]["size"]:
            V.append({"rule": "H5", "where": "exams", "detail": f"{eid}: {seats} seats at half capacity for {ex[eid]['size']} students"})
        for g in ex[eid]["groups"]:
            grp_use[(g, e["day"], e["session"])].append(eid)
            grp_day[(g, e["day"])].add(eid)

    for eid in ex:
        if eid not in seen:
            V.append({"rule": "E1", "where": "exams", "detail": f"{eid} not scheduled"})
    for k, v in room_use.items():
        if len(v) > 1:
            V.append({"rule": "H4", "where": "exams", "detail": f"{k[0]} has {v} in {k[1]} {k[2]}"})
    for k, v in grp_use.items():
        if len(v) > 1:
            V.append({"rule": "H3", "where": "exams", "detail": f"Group {k[0]} has {v} in {k[1]} {k[2]}"})
    for k, v in grp_day.items():
        if len(v) > 1:
            pen += 5 * (len(v) - 1)
    return V, pen


def to_assign(sched: dict):
    out = {}
    dup = []
    for e in sched.get("sessions", []):
        sid = e.get("session_id")
        if sid in out:
            dup.append(sid)
        out[sid] = (e.get("day"), e.get("start_period"), e.get("room_id"))
    return out, dup


def validate_schedule(data: dict, sched: dict, baseline: dict = None) -> dict:
    """
    Main entry point for validation.
    Returns authoritative validation report.
    """
    ctx = ValidationContext(data)
    report = {
        "dataset_id": data.get("dataset_id"),
        "schedule_dataset_id": sched.get("dataset_id"),
        "team": sched.get("team")
    }
    assign, dup = to_assign(sched)
    V, _ = check_timetable(ctx, assign, "timetable")
    for d in dup:
        V.append({"rule": "H1", "where": "timetable", "detail": f"Session {d} appears more than once"})
        
    soft, total = soft_score(ctx, assign)
    report["soft_penalties"] = soft
    report["soft_total"] = total
    W = []

    if "fest_week" in sched:
        bv, bw, bstats = check_bookings(ctx, assign, sched["fest_week"])
        V += bv
        W += bw
        report["bookings"] = bstats

    if data.get("exams") and (baseline is None or sched.get("exams")):
        ev, epen = check_exams(ctx, sched.get("exams") or [])
        V += ev
        report["exam_soft_penalty"] = epen

    if baseline is not None:
        b, _ = to_assign(baseline)
        moved = [sid for sid in assign if sid in b and sid in ctx.sessions and tuple(assign[sid]) != tuple(b[sid])]
        report["stability"] = {
            "sessions_moved": len(moved),
            "time_changed": sum(1 for s in moved if assign[s][:2] != b[s][:2]),
            "room_only_changed": sum(1 for s in moved if assign[s][:2] == b[s][:2]),
            "moved_ids": sorted(moved)
        }

    seen, uniq = set(), []
    for x in V:
        k = (x["rule"], x["detail"])
        if k not in seen:
            seen.add(k)
            uniq.append(x)
    V = uniq

    report["valid"] = (len(V) == 0)
    report["hard_violations"] = V
    report["hard_violation_count"] = len(V)
    report["hard_by_rule"] = {}
    for x in V:
        report["hard_by_rule"][x["rule"]] = report["hard_by_rule"].get(x["rule"], 0) + 1
    report["warnings"] = W
    return report

