async function testAll() {
  const loginRes = await fetch('https://cit.saubhagyalabs.tech/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@cit.edu', password: 'CitAdmin2027!' })
  });
  const { token } = await loginRes.json();
  const headers = { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' };

  const getTests = [
    { name: 'Auth /me', path: '/api/auth/me' },
    { name: 'Timetable /schedules/active', path: '/api/schedules/active' },
    { name: 'Exams /exams/active', path: '/api/exams/active' },
    { name: 'Bookings /bookings', path: '/api/bookings' },
    { name: 'Disruptions /disruptions/latest', path: '/api/disruptions/latest' },
    { name: 'Datasets /datasets/current', path: '/api/datasets/current' },
    { name: 'Exports /exports/schedule.json', path: '/api/exports/schedule.json' },
    { name: 'Exports /exports/schedule_after.json', path: '/api/exports/schedule_after.json' },
    { name: 'Exports /exports/exam_schedule.json', path: '/api/exports/exam_schedule.json' },
    { name: 'Exports /exports/spectra_allocations.json', path: '/api/exports/spectra_allocations.json' },
    { name: 'Exports /exports/verify', path: '/api/exports/verify', method: 'POST' },
    { name: 'Optimizer Validation Move', path: '/api/schedules/validate-move', method: 'POST', body: { sessionId: 'S_CS101_L1', newDay: 'MON', newPeriod: 1, newRoomId: 'CR-101' } },
    { name: 'Assistant Chat', path: '/api/assistant/chat', method: 'POST', body: { message: 'Can I book LH-1 on Friday morning?', role: 'admin' } },
    { name: 'Reset Demo Data', path: '/api/datasets/reset-demo', method: 'POST' }
  ];

  for (const t of getTests) {
    try {
      const res = await fetch('https://cit.saubhagyalabs.tech' + t.path, {
        method: t.method || 'GET',
        headers,
        body: t.body ? JSON.stringify(t.body) : undefined
      });
      const text = await res.text();
      console.log(`[${res.status}] ${t.name} -> ${res.ok ? 'SUCCESS' : text.slice(0, 80)}`);
    } catch (err) {
      console.error(`[FAIL] ${t.name}:`, err.message);
    }
  }
}
testAll();

