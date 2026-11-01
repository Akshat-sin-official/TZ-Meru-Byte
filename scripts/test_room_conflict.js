import assert from 'assert';
import { resolveRoomConflict, getEffectiveCategory, ROOM_PRIORITY_ORDER } from '../server/dist/utils/priority.js';

console.log('Testing Canonical 6-level Room Conflict Resolution:');
console.log('1. Exams');
console.log('2. Regular classes');
console.log('3. Institute events');
console.log('4. Guest lectures');
console.log('5. Department events');
console.log('6. Club events\n');

// 1. Exam vs Regular class
const res1 = resolveRoomConflict(
  { id: 'MIDSEM-CS101', role: 'admin', requestedCategory: 'exam' },
  { id: 'LEC-CS201', role: 'faculty', requestedCategory: 'regular_session' }
);
assert.strictEqual(res1.winnerId, 'MIDSEM-CS101');
assert.strictEqual(res1.winnerRank, 1);
assert.strictEqual(res1.loserRank, 2);
console.log('[PASS] Scenario 1: Exam beats Regular class (Rank 1 > Rank 2)');

// 2. Regular class vs Institute event
const res2 = resolveRoomConflict(
  { id: 'LEC-EE301', role: 'faculty', requestedCategory: 'regular_session' },
  { id: 'SPECTRA-MAIN', role: 'admin', requestedCategory: 'institute_event' }
);
assert.strictEqual(res2.winnerId, 'LEC-EE301');
assert.strictEqual(res2.winnerRank, 2);
assert.strictEqual(res2.loserRank, 3);
console.log('[PASS] Scenario 2: Regular class beats Institute event (Rank 2 > Rank 3)');

// 3. Institute event vs Guest lecture
const res3 = resolveRoomConflict(
  { id: 'CONVOCATION', role: 'admin', requestedCategory: 'institute_event' },
  { id: 'GUEST-PROF-X', role: 'faculty', requestedCategory: 'guest_lecture' }
);
assert.strictEqual(res3.winnerId, 'CONVOCATION');
assert.strictEqual(res3.winnerRank, 3);
assert.strictEqual(res3.loserRank, 4);
console.log('[PASS] Scenario 3: Institute event beats Guest lecture (Rank 3 > Rank 4)');

// 4. Guest lecture vs Department event
const res4 = resolveRoomConflict(
  { id: 'GUEST-TALK', role: 'faculty', requestedCategory: 'guest_lecture' },
  { id: 'DEPT-SYMPOSIUM', role: 'coordinator', requestedCategory: 'department_event' }
);
assert.strictEqual(res4.winnerId, 'GUEST-TALK');
assert.strictEqual(res4.winnerRank, 4);
assert.strictEqual(res4.loserRank, 5);
console.log('[PASS] Scenario 4: Guest lecture beats Department event (Rank 4 > Rank 5)');

// 5. Department event vs Club event
const res5 = resolveRoomConflict(
  { id: 'CSE-HACK-DEPT', role: 'coordinator', requestedCategory: 'department_event' },
  { id: 'DRAMA-REHEARSAL', role: 'club', requestedCategory: 'club_event' }
);
assert.strictEqual(res5.winnerId, 'CSE-HACK-DEPT');
assert.strictEqual(res5.winnerRank, 5);
assert.strictEqual(res5.loserRank, 6);
console.log('[PASS] Scenario 5: Department event beats Club event (Rank 5 > Rank 6)');

// 6. Tie-breaker: Same priority (two club events), earlier submission wins
const res6 = resolveRoomConflict(
  { id: 'CLUB-A', role: 'club', requestedCategory: 'club_event', submittedAt: '2026-10-01T10:00:00Z' },
  { id: 'CLUB-B', role: 'club', requestedCategory: 'club_event', submittedAt: '2026-10-01T11:00:00Z' }
);
assert.strictEqual(res6.winnerId, 'CLUB-A');
assert.strictEqual(res6.winnerRank, 6);
assert.strictEqual(res6.loserRank, 6);
assert.match(res6.reason, /earlier submission/);
console.log('[PASS] Scenario 6: Equal rank tie-breaker resolved by submitted_at');

// 7. Role Capping: Club attempting to claim institute_event gets capped to club_event
const clubEff = getEffectiveCategory({ role: 'club', requestedCategory: 'institute_event' });
assert.strictEqual(clubEff, 'club_event');
console.log('[PASS] Scenario 7: Role cap prevents club from claiming institute_event');

console.log('\nAll 7 room conflict arbiter test scenarios passed successfully!');

