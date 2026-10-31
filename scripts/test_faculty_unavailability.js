/**
 * Comprehensive Automated Test Suite: Faculty Unavailability & Conflict-Free Rescheduling
 */

const API_BASE = 'http://localhost:5000/api';

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

async function login(email, password) {
  const res = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(`Login failed for ${email}: ${JSON.stringify(res.data)}`);
  return res.data.token;
}

async function runTests() {
  console.log('=== CIT CampusOS: Faculty Unavailability Test Suite ===\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}${details ? ` -> ${details}` : ''}`);
      failed++;
    }
  }

  try {
    // 1. Authenticate users
    console.log('--- Step 1: Authentication ---');
    const facultyToken = await login('faculty.f19@cit.edu', 'CitFaculty2027!');
    const adminToken = await login('admin@cit.edu', 'CitAdmin2027!');
    const clubToken = await login('dramatics@cit.edu', 'CitClub2027!');

    assert(Boolean(facultyToken), '1. Faculty authentication succeeds');
    assert(Boolean(adminToken), '2. Admin authentication succeeds');
    assert(Boolean(clubToken), '3. Club authentication succeeds');

    // 2. Unauthenticated access check
    console.log('\n--- Step 2: Unauthenticated & Unauthorized Gates ---');
    const unauthRes = await request('/faculty/unavailability', {
      method: 'POST',
      body: JSON.stringify({ days: ['MON'], periods: [1] }),
    });
    assert(unauthRes.status === 401, '4. Unauthenticated submission returns HTTP 401');

    const clubRes = await request('/faculty/unavailability', {
      method: 'POST',
      headers: { Authorization: `Bearer ${clubToken}` },
      body: JSON.stringify({ days: ['MON'], periods: [1] }),
    });
    assert(clubRes.status === 403, '5. Club Representative cannot submit faculty unavailability (HTTP 403)');

    // 3. Faculty spoofing another professor's ID
    const spoofRes = await request('/faculty/unavailability', {
      method: 'POST',
      headers: { Authorization: `Bearer ${facultyToken}` },
      body: JSON.stringify({ facultyId: 'F01', days: ['MON'], periods: [1] }),
    });
    assert(spoofRes.status === 403, '6. Faculty cannot submit unavailability on behalf of another faculty member (HTTP 403)');

    // 4. Invalid input handling
    const invalidDaysRes = await request('/faculty/unavailability', {
      method: 'POST',
      headers: { Authorization: `Bearer ${facultyToken}` },
      body: JSON.stringify({ days: ['INVALID_DAY'], periods: [1] }),
    });
    assert(invalidDaysRes.status === 400, '7. Invalid day returns HTTP 400');

    const invalidPeriodsRes = await request('/faculty/unavailability', {
      method: 'POST',
      headers: { Authorization: `Bearer ${facultyToken}` },
      body: JSON.stringify({ days: ['MON'], periods: [99] }),
    });
    assert(invalidPeriodsRes.status === 400, '8. Invalid period returns HTTP 400');

    // 5. Submit valid faculty unavailability (F19 has MA101-AB-L3 on MON P1)
    console.log('\n--- Step 3: Submission & Automatic Rescheduling ---');
    const submitRes = await request('/faculty/unavailability', {
      method: 'POST',
      headers: { Authorization: `Bearer ${facultyToken}` },
      body: JSON.stringify({
        days: ['MON'],
        periods: [1, 2],
        reason: 'National Mathematics Symposium & Academic Committee',
      }),
    });

    assert(submitRes.status === 201, '9. Valid faculty unavailability returns HTTP 201 Created');
    const subData = submitRes.data;
    assert(Boolean(subData.unavailabilityId), '10. Returns unavailablityId');
    assert(Boolean(subData.proposalId), '11. Returns linked ScheduleVersion proposalId');
    assert(subData.status === 'pending_approval', '12. Proposal status is pending_approval (not immediately active)');

    console.log(`   Affected Sessions Detected: ${subData.totalAffected}`);
    console.log(`   Relocated Sessions in Plan: ${subData.totalMoved}`);
    assert(subData.totalAffected > 0, '13. Successfully identifies affected sessions during unavailable periods');
    assert(subData.totalMoved >= subData.totalAffected, '14. Rescheduling engine relocates affected sessions');

    const unavailId = subData.unavailabilityId;
    const proposalId = subData.proposalId;

    // 6. Inspect affected sessions endpoint
    console.log('\n--- Step 4: Endpoint Inspections & Scoping ---');
    const affectedRes = await request(`/faculty/unavailability/${unavailId}/affected-sessions`, {
      headers: { Authorization: `Bearer ${facultyToken}` },
    });
    assert(affectedRes.ok && affectedRes.data.affectedSessions.length > 0, '15. GET affected-sessions returns session list');

    // 7. Inspect proposal endpoint
    const proposalRes = await request(`/faculty/unavailability/${unavailId}/proposal`, {
      headers: { Authorization: `Bearer ${facultyToken}` },
    });
    assert(proposalRes.ok && proposalRes.data.proposal.status === 'pending_approval', '16. GET proposal returns proposal diff');

    // 8. Prevent self-approval (Faculty cannot approve proposal)
    console.log('\n--- Step 5: Approval Governance & Atomic Activation ---');
    const facultyApproveRes = await request(`/schedules/proposals/${proposalId}/approve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${facultyToken}` },
    });
    assert(facultyApproveRes.status === 403, '17. Faculty cannot approve their own proposal (HTTP 403)');

    // 9. Admin checks pending proposals
    const pendingRes = await request('/schedules/proposals/pending', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(pendingRes.ok && pendingRes.data.proposals.some((p) => p.id === proposalId), '18. Admin can list pending proposals');

    // 10. Admin approves and activates
    const adminApproveRes = await request(`/schedules/proposals/${proposalId}/approve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(adminApproveRes.ok, '19. Admin approval succeeds and activates schedule version');

    // 11. Verify timetable status updated
    const activeRes = await request('/schedules/active');
    assert(activeRes.ok && activeRes.data.schedule.id === proposalId, '20. Newly approved proposal is now the active timetable');

    // 12. Verify that F19 has 0 sessions on MON P1-P2 in the active timetable!
    const activeAssignments = activeRes.data.schedule.assignments;
    const activeSessions = activeRes.data.metadata.sessions;
    const f19SessionIds = new Set(activeSessions.filter((s) => s.facultyId === 'F19').map((s) => s.externalId));

    const f19ConflictingSessions = activeAssignments.filter(
      (a) => f19SessionIds.has(a.sessionExternalId) && a.day === 'MON' && [1, 2].includes(a.startPeriod)
    );
    assert(
      f19ConflictingSessions.length === 0,
      '21. Active timetable has ZERO sessions assigned to F19 during MON P1-P2 (Hard Constraint H7 Preserved!)'
    );

    console.log(`\n========================================`);
    console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
    console.log(`========================================`);
  } catch (err) {
    console.error('Test execution error:', err);
  }
}

runTests();
