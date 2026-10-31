import axios from 'axios';

export const API_BASE_URL = 'http://localhost:5000/api';

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
};

export default api;

