#!/usr/bin/env python3
"""
CIT CampusOS Optimization & Validation API Service
Internal FastAPI service providing CP-SAT discrete optimization and canonical constraint validation.
"""

from typing import Dict, Any, Optional, List
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn

import sys
import os

# Add parent directory to sys.path so 'import optimizer.*' or local imports work uniformly
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from optimizer.timetable_solver import solve_timetable
    from optimizer.exam_solver import solve_exams
    from optimizer.booking_engine import solve_bookings
    from optimizer.disruption_solver import solve_disruption_repair, apply_disruption_payload
    from optimizer.canonical_validator import validate_schedule
except ImportError:
    from timetable_solver import solve_timetable
    from exam_solver import solve_exams
    from booking_engine import solve_bookings
    from disruption_solver import solve_disruption_repair, apply_disruption_payload
    from canonical_validator import validate_schedule

app = FastAPI(title="CIT CampusOS Optimization Service", version="1.0.0")


class ValidateRequest(BaseModel):
    dataset: Dict[str, Any]
    schedule: Dict[str, Any]
    baseline: Optional[Dict[str, Any]] = None


class TimetableSolveRequest(BaseModel):
    dataset: Dict[str, Any]
    timeout_seconds: Optional[int] = 120
    seed: Optional[int] = 42


class ExamSolveRequest(BaseModel):
    dataset: Dict[str, Any]
    timeout_seconds: Optional[int] = 60
    seed: Optional[int] = 42


class BookingSolveRequest(BaseModel):
    dataset: Dict[str, Any]
    timetable_assignments: List[Dict[str, Any]]


class DisruptionSolveRequest(BaseModel):
    dataset: Dict[str, Any]
    disruption: Dict[str, Any]
    baseline_schedule: Dict[str, Any]
    timeout_seconds: Optional[int] = 120
    seed: Optional[int] = 42


class ValidateMoveRequest(BaseModel):
    dataset: Dict[str, Any]
    current_schedule: Dict[str, Any]
    session_id: str
    target_day: str
    target_start_period: int
    target_room_id: str


@app.get("/internal/health")
def health_check():
    return {"status": "healthy", "service": "CIT CampusOS Optimizer"}


@app.post("/internal/validate")
def validate_endpoint(req: ValidateRequest):
    try:
        report = validate_schedule(req.dataset, req.schedule, req.baseline)
        return report
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/internal/solve/timetable")
def solve_timetable_endpoint(req: TimetableSolveRequest):
    try:
        res = solve_timetable(req.dataset, req.timeout_seconds, req.seed)
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/internal/solve/exams")
def solve_exams_endpoint(req: ExamSolveRequest):
    try:
        res = solve_exams(req.dataset, req.timeout_seconds, req.seed)
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/internal/solve/bookings")
def solve_bookings_endpoint(req: BookingSolveRequest):
    try:
        res = solve_bookings(req.dataset, req.timetable_assignments)
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/internal/solve/disruption")
def solve_disruption_endpoint(req: DisruptionSolveRequest):
    try:
        mutated_data = apply_disruption_payload(req.dataset, req.disruption)
        res = solve_disruption_repair(mutated_data, req.baseline_schedule, req.timeout_seconds, req.seed)
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/internal/validate-move")
def validate_move_endpoint(req: ValidateMoveRequest):
    """
    Drag & Drop pre-flight validation endpoint.
    Tests moving session_id to (target_day, target_start_period, target_room_id).
    """
    try:
        # Clone schedule and update session
        sched_copy = dict(req.current_schedule)
        sessions_copy = [dict(s) for s in sched_copy.get("sessions", [])]
        
        found = False
        for s in sessions_copy:
            if s["session_id"] == req.session_id:
                s["day"] = req.target_day
                s["start_period"] = req.target_start_period
                s["room_id"] = req.target_room_id
                found = True
                break
                
        if not found:
            sessions_copy.append({
                "session_id": req.session_id,
                "day": req.target_day,
                "start_period": req.target_start_period,
                "room_id": req.target_room_id
            })
            
        sched_copy["sessions"] = sessions_copy
        report = validate_schedule(req.dataset, sched_copy)
        
        # Filter violations specific to this session
        relevant_violations = [
            v for v in report.get("hard_violations", [])
            if req.session_id in v.get("detail", "") or req.target_room_id in v.get("detail", "")
        ]
        
        return {
            "valid": len(relevant_violations) == 0,
            "violations": relevant_violations,
            "total_hard_violations": report["hard_violation_count"],
            "soft_total": report["soft_total"]
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8001)

