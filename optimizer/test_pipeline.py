#!/usr/bin/env python3
"""
CIT CampusOS End-to-End Pipeline Test
Generates timetable, midsem exams, Spectra bookings, validates against canonical_validator
and tests against official validator.py!
"""

import json
import os
import subprocess
import time
from optimizer.timetable_solver import solve_timetable
from optimizer.exam_solver import solve_exams
from optimizer.booking_engine import solve_bookings
from optimizer.canonical_validator import validate_schedule

DATA_PATH = "docs/PS/CrunchWeek_StarterPack (1)/CrunchWeek_StarterPack/data/cit_public.json"
OFFICIAL_VALIDATOR = "docs/PS/CrunchWeek_StarterPack (1)/CrunchWeek_StarterPack/validator.py"

def main():
    print("=" * 60)
    print("CIT CampusOS Optimizer Verification")
    print("=" * 60)

    with open(DATA_PATH, encoding="utf-8") as f:
        data = json.load(f)

    print(f"Loaded dataset: {data['dataset_id']} ({len(data['sessions'])} sessions, {len(data['rooms'])} rooms, {len(data['exams'])} exams)")

    # 1. Timetable Generation
    print("\n[1/4] Solving weekly timetable with Google OR-Tools CP-SAT...")
    t0 = time.time()
    tt_res = solve_timetable(data, timeout_seconds=120)
    print(f"  Status: {tt_res['status']} in {tt_res['solve_time']}s (assignments: {len(tt_res['assignments'])})")
    assert tt_res["status"] in ("OPTIMAL", "FEASIBLE"), "Timetable solver failed!"

    # 2. Midsem Exams
    print("\n[2/4] Solving midsem exams...")
    exam_res = solve_exams(data, timeout_seconds=60)
    print(f"  Status: {exam_res['status']} in {exam_res['solve_time']}s (allocated: {len(exam_res['allocations'])})")
    assert exam_res["status"] in ("OPTIMAL", "FEASIBLE"), "Exam solver failed!"

    # 3. Spectra Week Bookings
    print("\n[3/4] Solving Spectra Week venue bookings...")
    book_res = solve_bookings(data, tt_res["assignments"])
    print(f"  Decisions rendered: {len(book_res['bookings'])}, Session overrides: {len(book_res['session_overrides'])}")

    # Assemble schedule.json payload
    full_schedule = {
        "team": "CIT CampusOS Team",
        "dataset_id": data["dataset_id"],
        "sessions": tt_res["assignments"],
        "fest_week": {
            "bookings": book_res["bookings"],
            "session_overrides": book_res["session_overrides"]
        },
        "exams": exam_res["allocations"]
    }

    # 4. Canonical Validator Test
    print("\n[4/4] Running Canonical Validator...")
    report = validate_schedule(data, full_schedule)
    print(f"  Valid: {report['valid']}")
    print(f"  Hard Violations: {report['hard_violation_count']}")
    if report['hard_violations']:
        for v in report['hard_violations'][:10]:
            print(f"    - [{v['rule']}] {v['detail']}")
    print(f"  Soft Penalty Total: {report['soft_total']} {report['soft_penalties']}")
    if "bookings" in report:
        b = report["bookings"]
        print(f"  Booking Score: {b['booking_score']} / {b['booking_score_max_if_all_approved']}")
        print(f"  Approved: {b['approved']}, Alternatives: {b['alternatives']}, Rejected: {b['rejected']}, Overrides: {b['session_overrides']}")
        print(f"  Priority Inversions: {len(b['priority_inversions'])}")
        for inv in b["priority_inversions"]:
            print(f"    - {inv}")
    if "exam_soft_penalty" in report:
        print(f"  Exam Soft Penalty: {report['exam_soft_penalty']}")

    # Save to exports/schedule.json
    os.makedirs("exports", exist_ok=True)
    with open("exports/schedule.json", "w", encoding="utf-8") as f:
        json.dump(full_schedule, f, indent=2)
    print("\nSaved exports/schedule.json")

    # Run official validator.py
    print("\n[ORACLE] Running official validator.py against exports/schedule.json...")
    cmd = ["python", OFFICIAL_VALIDATOR, "--data", DATA_PATH, "--schedule", "exports/schedule.json"]
    proc = subprocess.run(cmd, capture_output=True, text=True)
    print(proc.stdout)
    if proc.stderr:
        print("STDERR:", proc.stderr)

    print("=" * 60)
    print("Pipeline Verification Completed!")
    print("=" * 60)

if __name__ == "__main__":
    main()

