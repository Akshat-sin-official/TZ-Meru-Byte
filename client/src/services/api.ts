import axios from 'axios';

export const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cit_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'department_coordinator' | 'faculty' | 'club';
  department?: string;
  facultyId?: string;
  clubName?: string;
}

export const campusApi = {
  // Auth
  login: async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    return res.data;
  },
  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },

  // Dataset & Demo Reset
  getDataset: async () => {
    const res = await api.get('/datasets/current');
    return res.data;
  },
  resetDemoData: async () => {
    const res = await api.post('/datasets/reset-demo');
    return res.data;
  },

  // Timetable
  getActiveTimetable: async () => {
    const res = await api.get('/schedules/active');
    return res.data;
  },
  generateTimetable: async () => {
    const res = await api.post('/schedules/generate');
    return res.data;
  },
  validateMove: async (params: {
    session_id: string;
    target_day: string;
    target_start_period: number;
    target_room_id: string;
  }) => {
    const res = await api.post('/schedules/validate-move', params);
    return res.data;
  },
  batchValidateMoves: async (params: {
    session_id: string;
    candidates: Array<{ target_day: string; target_start_period: number; target_room_id: string }>;
  }) => {
    const res = await api.post('/schedules/batch-validate-moves', params);
    return res.data;
  },
  approveProposal: async (id: string) => {
    const res = await api.post(`/schedules/proposals/${id}/approve`);
    return res.data;
  },

  // Exams
  getActiveExams: async () => {
    const res = await api.get('/exams/active');
    return res.data;
  },
  generateExams: async () => {
    const res = await api.post('/exams/generate');
    return res.data;
  },
  rescheduleExam: async (params: {
    examExternalId: string;
    newDay: string;
    newSession: string;
    newRooms?: string[];
  }) => {
    const res = await api.post('/exams/reschedule-exam', params);
    return res.data;
  },

  // Bookings
  getBookings: async () => {
    const res = await api.get('/bookings');
    return res.data;
  },
  solveBookings: async () => {
    const res = await api.post('/bookings/solve');
    return res.data;
  },
  submitBookingRequest: async (data: any) => {
    const res = await api.post('/bookings/requests', data);
    return res.data;
  },
  checkRoomConflict: async (requestA: any, requestB: any) => {
    const res = await api.post('/bookings/conflict-check', { request_a: requestA, request_b: requestB });
    return res.data;
  },

  // Disruptions
  getLatestDisruption: async () => {
    const res = await api.get('/disruptions/latest');
    return res.data;
  },
  submitDisruption: async (disruptionPayload: any) => {
    const res = await api.post('/disruptions/submit', disruptionPayload);
    return res.data;
  },

  // AI Assistant
  chatWithAssistant: async (message: string, role?: string) => {
    const res = await api.post('/assistant/chat', { message, role });
    return res.data;
  },
  parseBookingPrompt: async (message: string) => {
    const res = await api.post('/assistant/parse-booking', { message });
    return res.data;
  },
  explainDecision: async (params: any) => {
    const res = await api.post('/assistant/explain-decision', params);
    return res.data;
  },

  // Manual Moves (PS #10)
  applyMove: async (params: {
    session_id: string;
    target_day: string;
    target_start_period: number;
    target_room_id: string;
  }) => {
    const res = await api.post('/schedules/apply-move', params);
    return res.data;
  },

  // Exports & Oracle
  verifyExport: async () => {
    const res = await api.post('/exports/verify');
    return res.data;
  },

  // Explain Scheduling Decision (PS §2 #8)
  explainSession: async (sessionId: string) => {
    const res = await api.get(`/schedules/explain/${sessionId}`);
    return res.data;
  },

  // Faculty Unavailability & Rescheduling
  submitFacultyUnavailability: async (data: {
    facultyId?: string;
    days: string[];
    periods: number[];
    reason?: string;
  }) => {
    const res = await api.post('/faculty/unavailability', data);
    return res.data;
  },
  getFacultyUnavailabilities: async () => {
    const res = await api.get('/faculty/unavailability');
    return res.data;
  },
  getFacultyAffectedSessions: async (id: string) => {
    const res = await api.get(`/faculty/unavailability/${id}/affected-sessions`);
    return res.data;
  },
  getFacultyUnavailabilityProposal: async (id: string) => {
    const res = await api.get(`/faculty/unavailability/${id}/proposal`);
    return res.data;
  },
  getPendingProposals: async () => {
    const res = await api.get('/schedules/proposals/pending');
    return res.data;
  },
  rejectProposal: async (id: string) => {
    const res = await api.post(`/schedules/proposals/${id}/reject`);
    return res.data;
  },

  // WhatsApp Gateway
  getWhatsAppStatus: async () => {
    const res = await api.get('/whatsapp/status');
    return res.data;
  },
  connectWhatsApp: async () => {
    const res = await api.post('/whatsapp/connect');
    return res.data;
  },
  getWhatsAppContacts: async () => {
    const res = await api.get('/whatsapp/contacts');
    return res.data;
  },
  addWhatsAppContact: async (data: { phone: string; name?: string; role?: string; userId?: string }) => {
    const res = await api.post('/whatsapp/contacts', data);
    return res.data;
  },
  deleteWhatsAppContact: async (id: string) => {
    const res = await api.delete(`/whatsapp/contacts/${id}`);
    return res.data;
  },
  testSendWhatsApp: async (data: { phone: string; message?: string }) => {
    const res = await api.post('/whatsapp/test-send', data);
    return res.data;
  },

  // Notifications
  getNotifications: async () => {
    const res = await api.get('/notifications');
    return res.data;
  },
  markNotificationRead: async (id: string) => {
    const res = await api.patch(`/notifications/${id}/read`);
    return res.data;
  },
  markAllNotificationsRead: async () => {
    const res = await api.post('/notifications/mark-all-read');
    return res.data;
  },
};

export { api };
export default campusApi;

