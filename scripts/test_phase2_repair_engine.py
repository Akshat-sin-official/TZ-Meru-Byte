#!/usr/bin/env python3
"""
Test Suite for Phase 2: One-Tap Disruption Repair Engine
Verifies normalization, affected session identification, multi-candidate generation,
ranking, deduplication, canonical validation, and metric calculations.
"""

import sys
import os
import json
import time

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from optimizer.disruption_solver import (
    normalize_disruption,
    identify_affected_sessions,
    solve_ranked_disruption_repairs,
)
from optimizer.canonical_validator import validate_schedule


def run_tests():
    print("=== CIT Campora: Phase 2 Disruption Repair Engine Test Suite ===\n")
    passed = 0
    failed = 0

    def assert_test(cond, title):
        nonlocal passed, failed
        if cond:
            print(f"✅ [PASS] {title}")
            passed += 1
        else:
            print(f"❌ [FAIL] {title}")
            failed += 1

    # Load baseline dataset and schedule
    with open("docs/PS/CrunchWeek_StarterPack (1)/CrunchWeek_StarterPack/data/cit_public.json") as f:
        dataset = json.load(f)
    with open("exports/schedule.json") as f:
        baseline_sched = json.load(f)

    # -------------------------------------------------------------
    # Test Group 1: Disruption Normalization
    # -------------------------------------------------------------
    print("--- Group 1: Disruption Normalization ---")
    one_tap_fac = {
        "disruption_type": "faculty_unavailable",
        "target_id": "F07",
        "days": ["mon"],
        "periods": [1, 2, 3],
        "reason": "Conference travel",
        "preferences": {"avoid_room": "CR-102"}
    }
    norm1 = normalize_disruption(one_tap_fac)
    assert_test(len(norm1["changes"]) == 1, "1. Normalizes shorthand one-tap disruption")
    assert_test(norm1["changes"][0]["type"] == "faculty_unavailable", "2. Correct change type mapped")
    assert_test(norm1["changes"][0]["faculty_id"] == "F07", "3. Correct faculty ID extracted")
    assert_test(norm1["changes"][0]["days"] == ["MON"], "4. Days uppercase normalized")
    assert_test(norm1["preferences"].get("avoid_room") == "CR-102", "5. Room avoidance preference preserved")

    one_tap_room = {
        "disruption_type": "room_unavailable",
        "target_id": "LH-2",
        "days": ["MON", "TUE"],
        "periods": [1, 2]
    }
    norm2 = normalize_disruption(one_tap_room)
    assert_test(norm2["changes"][0]["type"] == "room_unavailable", "6. Room disruption mapped")
    assert_test(norm2["changes"][0]["room_id"] == "LH-2", "7. Room ID extracted")

    # -------------------------------------------------------------
    # Test Group 2: Affected Session Identification
    # -------------------------------------------------------------
    print("\n--- Group 2: Affected Session Identification ---")
    # F07 MON P1-P9 has 3 sessions
    f07_disr = {
        "changes": [{
            "type": "faculty_unavailable",
            "faculty_id": "F07",
            "days": ["MON"],
            "periods": list(range(1, 10)),
            "reason": "Conference"
        }]
    }
    aff_f07 = identify_affected_sessions(dataset, baseline_sched, f07_disr)
    assert_test(len(aff_f07) == 3, f"8. Identifies all 3 affected sessions for F07 MON P1-P9 (found {len(aff_f07)})")
    assert_test(all(a["faculty_id"] == "F07" for a in aff_f07), "9. All identified sessions belong to F07")
    assert_test(all(a["day"] == "MON" for a in aff_f07), "10. All identified sessions are on Monday")

    # LH-2 MON P1-P9 has 3 sessions
    lh2_disr = {
        "changes": [{
            "type": "room_unavailable",
            "room_id": "LH-2",
            "days": ["MON"],
            "periods": list(range(1, 10)),
            "reason": "Maintenance"
        }]
    }
    aff_lh2 = identify_affected_sessions(dataset, baseline_sched, lh2_disr)
    assert_test(len(aff_lh2) == 3, f"11. Identifies all 3 affected sessions for LH-2 MON P1-P9 (found {len(aff_lh2)})")
    assert_test(all(a["room_id"] == "LH-2" for a in aff_lh2), "12. All identified sessions in LH-2")

    # Off-schedule check (no sessions on SUN)
    none_disr = {
        "changes": [{
            "type": "faculty_unavailable",
            "faculty_id": "F07",
            "days": ["SUN"],
            "periods": [1, 2, 3]
        }]
    }
    aff_none = identify_affected_sessions(dataset, baseline_sched, none_disr)
    assert_test(len(aff_none) == 0, "13. Zero affected sessions for inactive window")

    # -------------------------------------------------------------
    # Test Group 3: Multi-Candidate Generation & Ranking
    # -------------------------------------------------------------
    print("\n--- Group 3: Multi-Candidate Repair Generation & Ranking ---")
    solve_res = solve_ranked_disruption_repairs(
        dataset,
        f07_disr,
        baseline_sched,
        preferences={"avoid_room": "CR-102"},
        timeout_per_option=20
    )

    assert_test(solve_res["status"] == "SUCCESS", "14. Ranked solver returns SUCCESS")
    assert_test(solve_res["options_count"] >= 2, f"15. Generates multiple repair options (count: {solve_res['options_count']})")

    options = solve_res["options"]
    opt_a = next((o for o in options if o["key"] == "fewest_changes"), None)
    assert_test(opt_a is not None, "16. Option A (Fewest Changes) present")
    if opt_a:
        assert_test(opt_a["sessions_moved"] == 3, f"17. Option A finds minimal 3 moves (found: {opt_a['sessions_moved']})")
        assert_test(opt_a["validation_status"] == "VALID", "18. Option A passes canonical validator (0 hard violations)")
        assert_test(opt_a["hard_violations_count"] == 0, "19. Option A has 0 hard violations")

    opt_b = next((o for o in options if o["key"] == "best_quality"), None)
    assert_test(opt_b is not None, "20. Option B (Best Quality / Preference) present")
    if opt_b:
        assert_test(opt_b["validation_status"] == "VALID", "21. Option B passes canonical validator (0 hard violations)")

    opt_c = next((o for o in options if o["key"] == "least_student_impact"), None)
    assert_test(opt_c is not None, "22. Option C (Least Student Impact) present")
    if opt_c:
        assert_test(opt_c["validation_status"] == "VALID", "23. Option C passes canonical validator (0 hard violations)")

    # -------------------------------------------------------------
    # Test Group 4: Deduplication & Metric Verification
    # -------------------------------------------------------------
    print("\n--- Group 4: Deduplication & Metric Calculations ---")
    fingerprints = [
        tuple(sorted((a["session_id"], a["day"], a["start_period"], a["room_id"]) for a in o["assignments"]))
        for o in options
    ]
    assert_test(len(fingerprints) == len(set(fingerprints)), "24. No duplicate assignment plans returned")

    for idx, opt in enumerate(options, 1):
        assert_test("sessions_moved" in opt, f"25.{idx}a Metric sessions_moved computed for {opt['name']}")
        assert_test("students_affected" in opt, f"25.{idx}b Metric students_affected computed for {opt['name']}")
        assert_test("soft_delta" in opt, f"25.{idx}c Metric soft_delta computed for {opt['name']}")
        assert_test("time_changes" in opt, f"25.{idx}d Metric time_changes computed for {opt['name']}")
        assert_test("room_only_changes" in opt, f"25.{idx}e Metric room_only_changes computed for {opt['name']}")

    print("\n=======================================================")
    print(f"Phase 2 Test Results: {passed} Passed, {failed} Failed")
    print("=======================================================\n")
    return failed == 0


if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
