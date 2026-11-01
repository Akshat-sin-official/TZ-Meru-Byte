import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

import authRoutes from './routes/auth.js';
import datasetRoutes from './routes/datasets.js';
import scheduleRoutes from './routes/schedules.js';
import examRoutes from './routes/exams.js';
import bookingRoutes from './routes/bookings.js';
import disruptionRoutes from './routes/disruptions.js';
import assistantRoutes from './routes/assistant.js';
import aiRoutes from './routes/ai.js';
import exportRoutes from './routes/exports.js';
import whatsappRoutes from './routes/whatsapp.js';
import facultyRoutes from './routes/faculty.js';
import notificationRoutes from './routes/notifications.js';

// Load .env from server dir or root dir
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    product: 'Campora API Gateway',
    timestamp: new Date().toISOString(),
  });
});

// Route registration
app.use('/api/auth', authRoutes);
app.use('/api/datasets', datasetRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/disruptions', disruptionRoutes);
app.use('/api/assistant', assistantRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/exports', exportRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/notifications', notificationRoutes);

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(` Campora API Gateway listening on port ${PORT}`);
  console.log(` Health: http://localhost:${PORT}/api/health`);
  console.log(` AI Endpoints: /api/ai/booking-intake, /api/ai/schedule-change, /api/ai/decision-explainer`);
  console.log(`====================================================`);
});
