import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from optimizer.canonical_validator import resolve_room_conflict, ROOM_PRIORITY_ORDER

print("Testing Python 6-level Room Conflict Resolution...")

# 1. Exam vs Regular class
r1 = {"id": "MIDSEM-1", "role": "admin", "category": "exam"}
r2 = {"id": "CLASS-1", "role": "faculty", "category": "regular_session"}
res1 = resolve_room_conflict({}, r1, r2)
assert res1["winner_id"] == "MIDSEM-1"
assert res1["winner_rank"] == 1
assert res1["loser_rank"] == 2
print("[PASS] Scenario 1: Exam beats Regular class")

# 2. Regular class vs Institute event
r3 = {"id": "CLASS-2", "role": "faculty", "category": "regular_session"}
r4 = {"id": "SPECTRA-MAIN", "role": "admin", "category": "institute_event"}
res2 = resolve_room_conflict({}, r3, r4)
assert res2["winner_id"] == "CLASS-2"
assert res2["winner_rank"] == 2
assert res2["loser_rank"] == 3
print("[PASS] Scenario 2: Regular class beats Institute event")

# 3. Institute event vs Guest lecture
r5 = {"id": "CONVOCATION", "role": "admin", "category": "institute_event"}
r6 = {"id": "GUEST-DR-SMITH", "role": "faculty", "category": "guest_lecture"}
res3 = resolve_room_conflict({}, r5, r6)
assert res3["winner_id"] == "CONVOCATION"
assert res3["winner_rank"] == 3
assert res3["loser_rank"] == 4
print("[PASS] Scenario 3: Institute event beats Guest lecture")

# 4. Guest lecture vs Department event
r7 = {"id": "GUEST-SPEAKER", "role": "faculty", "category": "guest_lecture"}
r8 = {"id": "DEPT-EXPO", "role": "department_coordinator", "category": "department_event"}
res4 = resolve_room_conflict({}, r7, r8)
assert res4["winner_id"] == "GUEST-SPEAKER"
assert res4["winner_rank"] == 4
assert res4["loser_rank"] == 5
print("[PASS] Scenario 4: Guest lecture beats Department event")

# 5. Department event vs Club event
r9 = {"id": "DEPT-SEMINAR", "role": "department_coordinator", "category": "department_event"}
r10 = {"id": "ROBO-MEET", "role": "club", "category": "club_event"}
res5 = resolve_room_conflict({}, r9, r10)
assert res5["winner_id"] == "DEPT-SEMINAR"
assert res5["winner_rank"] == 5
assert res5["loser_rank"] == 6
print("[PASS] Scenario 5: Department event beats Club event")

# 6. Tie-breaker by submitted_at
r11 = {"id": "CLUB-MUSIC", "role": "club", "category": "club_event", "submitted_at": "2026-10-10T10:00:00Z"}
r12 = {"id": "CLUB-DANCE", "role": "club", "category": "club_event", "submitted_at": "2026-10-10T11:00:00Z"}
res6 = resolve_room_conflict({}, r11, r12)
assert res6["winner_id"] == "CLUB-MUSIC"
assert "earlier submission" in res6["reason"]
print("[PASS] Scenario 6: Equal rank resolved by earlier submitted_at")

print("\nPython Room Conflict Resolution Tests Passed!")

