#!/usr/bin/env python3
"""
CIT CampusOS Disruption Repair Pipeline Test
Applies sample_disruption.json, repairs schedule with CP-SAT stability solver,
validates against canonical_validator and official validator.py with baseline comparison.
"""

import json
import subprocess
import time
from optimizer.canonical_validator import validate_schedule
from optimizer.disruption_solver import solve_disruption_repair, apply_disruption_payload

DATA_PATH = "docs/PS/CrunchWeek_StarterPack (1)/CrunchWeek_StarterPack/data/cit_public.json"
DISRUPTION_PATH = "docs/PS/CrunchWeek_StarterPack (1)/CrunchWeek_StarterPack/examples/sample_disruption.json"
OFFICIAL_VALIDATOR = "docs/PS/CrunchWeek_StarterPack (1)/CrunchWeek_StarterPack/validator.py"
SCHEDULE_PATH = "exports/schedule.json"
SCHEDULE_AFTER_PATH = "exports/schedule_after.json"


def main():
    print("=" * 60)
    print("CIT CampusOS Disruption Repair Verification")
    print("=" * 60)

    with open(DATA_PATH, encoding="utf-8") as f:
        data = json.load(f)
    with open(DISRUPTION_PATH, encoding="utf-8") as f:
        disruption = json.load(f)
    with open(SCHEDULE_PATH, encoding="utf-8") as f:
        baseline_sched = json.load(f)

    print(f"Applying disruption '{disruption['id']}' with {len(disruption['changes'])} changes...")
    mutated_data = apply_disruption_payload(data, disruption)

    print(f"Mutated dataset has {len(mutated_data['sessions'])} sessions (was {len(data['sessions'])})")

    # Solve Disruption Repair
    print("\nSolving schedule repair with 2-stage CP-SAT solver (stability-weighted)...")
    t0 = time.time()
    rep_res = solve_disruption_repair(mutated_data, baseline_sched, timeout_seconds=120)
    print(f"  Status: {rep_res['status']} in {rep_res['solve_time']}s (assignments: {len(rep_res['assignments'])})")
    assert rep_res["status"] in ("OPTIMAL", "FEASIBLE"), "Disruption solver failed!"

    schedule_after = {
        "team": "CIT CampusOS Team",
        "dataset_id": data["dataset_id"],
        "sessions": rep_res["assignments"]
    }

    # Validate with Canonical Validator
    print("\nRunning Canonical Validator on repaired schedule...")
    rep_report = validate_schedule(mutated_data, schedule_after, baseline=baseline_sched)
    print(f"  Valid: {rep_report['valid']}")
    print(f"  Hard Violations: {rep_report['hard_violation_count']}")
    if rep_report["hard_violations"]:
        for v in rep_report["hard_violations"]:
            print(f"    - [{v['rule']}] {v['detail']}")
    print(f"  Stability: {rep_report['stability']}")
    print(f"  Soft Penalty Total: {rep_report['soft_total']}")

    with open(SCHEDULE_AFTER_PATH, "w", encoding="utf-8") as f:
        json.dump(schedule_after, f, indent=2)
    print(f"\nSaved {SCHEDULE_AFTER_PATH}")

    # Run official validator against disruption with baseline
    print("\n[ORACLE] Running official validator.py on schedule_after.json with baseline...")
    cmd = [
        "python", OFFICIAL_VALIDATOR,
        "--data", DATA_PATH,
        "--schedule", SCHEDULE_AFTER_PATH,
        "--disruption", DISRUPTION_PATH,
        "--baseline", SCHEDULE_PATH
    ]
    proc = subprocess.run(cmd, capture_output=True, text=True)
    print(proc.stdout)
    if proc.stderr:
        print("STDERR:", proc.stderr)

    print("=" * 60)
    print("Disruption Verification Completed!")
    print("=" * 60)


if __name__ == "__main__":
    main()

