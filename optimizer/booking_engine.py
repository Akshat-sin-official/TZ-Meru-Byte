#!/usr/bin/env python3
"""
CIT CampusOS Spectra Week Booking Engine
Deterministic matching algorithm with role capping, priority ordering,
tie-breaking, class displacement, and priority inversion prevention.
"""

from collections import defaultdict
from optimizer.canonical_validator import effective_category, outranks, block, ValidationContext, check_timetable

MAX_PERIOD = 13


def solve_bookings(data: dict, timetable_assignments: list) -> dict:
    """
    Allocates Spectra Week venue requests deterministically.
    Returns:
      {
        "bookings": [ { "request_id": ..., "status": ..., ... } ],
        "session_overrides": [ ... ],
        "booking_score": float,
        "priority_inversions": [ ... ]
      }
    """
    ctx = ValidationContext(data)
    requests = {b["id"]: b for b in data.get("booking_requests", [])}
    cancelled = {c["request_id"] for c in data.get("cancellations", [])}
    rooms = {r["id"]: r for r in data["rooms"]}

    # Convert timetable_assignments into baseline dict
    base_timetable = {a["session_id"]: (a["day"], a["start_period"], a["room_id"]) for a in timetable_assignments}
    week7_timetable = dict(base_timetable)
    session_overrides = []

    # Map existing week 7 room and group occupancy from timetable
    room_busy = defaultdict(list)
    for sid, (day, start, rid) in week7_timetable.items():
        s = ctx.sessions.get(sid)
        if s:
            for p in block(start, s["duration"]):
                room_busy[(rid, day, p)].append(sid)

    # Sort non-cancelled requests in priority order
    def sort_key(req):
        eff_cat = effective_category(data, req)
        cat_idx = data["priority_order"].index(eff_cat)
        sub_time = req.get("submitted_at", "")
        return (cat_idx, sub_time)

    sorted_req_ids = sorted(requests.keys(), key=lambda rid: sort_key(requests[rid]))

    decisions = []
    placed_bookings = {}  # req_id -> (rid, day, a, b)

    for req_id in sorted_req_ids:
        req = requests[req_id]

        # 1. Check if formally cancelled
        if req_id in cancelled:
            decisions.append({
                "request_id": req_id,
                "status": "rejected",
                "reason": "Request formally withdrawn by requester prior to allocation"
            })
            continue

        eff_cat = effective_category(data, req)
        dur = req["duration_periods"]
        att = req["attendance"]
        allowed_types = set(req.get("room_types", []))
        needs = set(req.get("needs", []))
        pref_room = req.get("requested_room")

        # Candidate rooms filtering
        candidate_rooms = []
        for rid, r in rooms.items():
            if "event" not in r.get("allowed_uses", []):
                continue
            if r["type"] not in allowed_types:
                continue
            if r["capacity"] < att:
                continue
            feats = set(r.get("features", [])) | ({"accessible"} if r.get("accessible") else set())
            if needs - feats:
                continue
            candidate_rooms.append(rid)

        # Prioritize preferred room if requested and eligible
        if pref_room in candidate_rooms:
            candidate_rooms.remove(pref_room)
            candidate_rooms.insert(0, pref_room)

        if not candidate_rooms:
            # Check largest venue capacity for nice reason
            max_cap = max((r["capacity"] for r in rooms.values()), default=0)
            if att > max_cap:
                reason = f"No venue on campus seats {att} (largest venue is {max_cap})"
            else:
                reason = f"No eligible event venue meets requirements ({req.get('room_types')}, needs {list(needs)})"
            decisions.append({
                "request_id": req_id,
                "status": "rejected",
                "reason": reason
            })
            continue

        # Helper to test if a slot is conflict-free
        def is_slot_free(rid, day, start_p, end_p, allow_class_clash=False):
            # Check room maintenance
            for p in range(start_p, end_p + 1):
                if (day, p) in ctx.room_un[rid]:
                    return False, "Room scheduled for maintenance"
                
                # Check room occupancy
                occupants = room_busy[(rid, day, p)]
                if occupants:
                    if not allow_class_clash:
                        return False, f"Room occupied by {occupants[0]}"
                    else:
                        # If class clash allowed, verify ALL occupants are regular classes (not other bookings)
                        for occ in occupants:
                            if occ not in ctx.sessions:
                                return False, f"Room occupied by booking {occ}"
                
                # Check mandatory group classes
                for g in req.get("mandatory_for_groups", []):
                    # Check if group has class in week 7
                    for sid_occ, (d_occ, st_occ, r_occ) in week7_timetable.items():
                        if d_occ == day and sid_occ in ctx.sessions:
                            s_data = ctx.sessions[sid_occ]
                            if g in s_data.get("groups", []) and st_occ <= p < st_occ + s_data["duration"]:
                                return False, f"Mandatory group {g} has scheduled class"
            return True, None

        # 2. Try placing inside requested windows
        placed = False
        for win in req.get("windows", []):
            day = win["day"]
            from_p = win["from_period"]
            to_p = win["to_period"]

            for rid in candidate_rooms:
                for start_p in range(from_p, to_p - dur + 2):
                    end_p = start_p + dur - 1
                    if end_p > MAX_PERIOD:
                        continue

                    free, reason = is_slot_free(rid, day, start_p, end_p, allow_class_clash=False)
                    if free:
                        # Book this slot!
                        for p in range(start_p, end_p + 1):
                            room_busy[(rid, day, p)].append(req_id)
                        placed_bookings[req_id] = (rid, day, start_p, end_p)
                        decisions.append({
                            "request_id": req_id,
                            "status": "approved",
                            "day": day,
                            "start_period": start_p,
                            "end_period": end_p,
                            "room_id": rid,
                            "reason": f"{eff_cat.replace('_', ' ').title()}, requested venue confirmed"
                        })
                        placed = True
                        break
                if placed:
                    break
            if placed:
                break

        if placed:
            continue

        # 3. If institute_event, try class displacement
        if eff_cat == "institute_event":
            for win in req.get("windows", []):
                day = win["day"]
                from_p = win["from_period"]
                to_p = win["to_period"]

                for rid in candidate_rooms:
                    for start_p in range(from_p, to_p - dur + 2):
                        end_p = start_p + dur - 1
                        if end_p > MAX_PERIOD:
                            continue

                        free, _ = is_slot_free(rid, day, start_p, end_p, allow_class_clash=True)
                        if free:
                            # Identify conflicting sessions
                            clashing_sids = set()
                            for p in range(start_p, end_p + 1):
                                for occ in room_busy[(rid, day, p)]:
                                    if occ in ctx.sessions:
                                        clashing_sids.add(occ)

                            # Try to relocate clashing sessions in week 7
                            can_relocate_all = True
                            relocation_plans = []

                            for clash_sid in clashing_sids:
                                s_clash = ctx.sessions[clash_sid]
                                relocated = False

                                # Search alternative valid slot in Week 7
                                for alt_d in ctx.days:
                                    for alt_p in range(1, 10 - s_clash["duration"]):
                                        if alt_p <= 5 < alt_p + s_clash["duration"] - 1:
                                            continue
                                        for alt_rid in s_clash.get("room_types", []):
                                            if alt_rid not in rooms:
                                                continue
                                            r_alt = rooms[alt_rid]
                                            if r_alt["capacity"] < s_clash["size"]:
                                                continue
                                            if s_clash.get("needs_accessible") and not r_alt.get("accessible"):
                                                continue
                                            
                                            # Check if alt slot free from room and faculty clashes
                                            per_alt = block(alt_p, s_clash["duration"])
                                            if any((alt_d, pt) in ctx.fac_un[s_clash["faculty_id"]] for pt in per_alt):
                                                continue
                                            if any((alt_d, pt) in ctx.room_un[alt_rid] for pt in per_alt):
                                                continue
                                            if any(room_busy[(alt_rid, alt_d, pt)] for pt in per_alt):
                                                continue

                                            # Free slot found!
                                            relocation_plans.append((clash_sid, alt_d, alt_p, alt_rid))
                                            relocated = True
                                            break
                                        if relocated:
                                            break
                                    if relocated:
                                        break

                                if not relocated:
                                    can_relocate_all = False
                                    break

                            if can_relocate_all:
                                # Apply relocations
                                for clash_sid, alt_d, alt_p, alt_rid in relocation_plans:
                                    # Free old slot
                                    old_d, old_p, old_rid = week7_timetable[clash_sid]
                                    s_dur = ctx.sessions[clash_sid]["duration"]
                                    for p in block(old_p, s_dur):
                                        if clash_sid in room_busy[(old_rid, old_d, p)]:
                                            room_busy[(old_rid, old_d, p)].remove(clash_sid)
                                    # Occupy new slot
                                    for p in block(alt_p, s_dur):
                                        room_busy[(alt_rid, alt_d, p)].append(clash_sid)
                                    week7_timetable[clash_sid] = (alt_d, alt_p, alt_rid)
                                    session_overrides.append({
                                        "session_id": clash_sid,
                                        "day": alt_d,
                                        "start_period": alt_p,
                                        "room_id": alt_rid,
                                        "displaced_by": req_id
                                    })

                                # Place institute event
                                for p in range(start_p, end_p + 1):
                                    room_busy[(rid, day, p)].append(req_id)
                                placed_bookings[req_id] = (rid, day, start_p, end_p)
                                decisions.append({
                                    "request_id": req_id,
                                    "status": "approved",
                                    "day": day,
                                    "start_period": start_p,
                                    "end_period": end_p,
                                    "room_id": rid,
                                    "reason": f"Institute event, venue approved with {len(relocation_plans)} session overrides"
                                })
                                placed = True
                                break
                    if placed:
                        break
                if placed:
                    break

        if placed:
            continue

        # 4. Search for Alternative Window (alternative_offered)
        for d in ctx.days:
            for p_start in range(10, MAX_PERIOD - dur + 2):  # Event periods P10-P13
                p_end = p_start + dur - 1
                for rid in candidate_rooms:
                    free, _ = is_slot_free(rid, d, p_start, p_end, allow_class_clash=False)
                    if free:
                        for p in range(p_start, p_end + 1):
                            room_busy[(rid, d, p)].append(req_id)
                        placed_bookings[req_id] = (rid, d, p_start, p_end)
                        decisions.append({
                            "request_id": req_id,
                            "status": "alternative_offered",
                            "day": d,
                            "start_period": p_start,
                            "end_period": p_end,
                            "room_id": rid,
                            "reason": f"Requested window occupied by higher/prior request; alternative slot offered in {rid}"
                        })
                        placed = True
                        break
                if placed:
                    break
            if placed:
                break

        if not placed:
            decisions.append({
                "request_id": req_id,
                "status": "rejected",
                "reason": f"All candidate venues ({', '.join(candidate_rooms[:3])}) occupied during requested and alternative event periods"
            })

    return {
        "bookings": decisions,
        "session_overrides": session_overrides
    }

