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

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));

// Dedicated API router to support both direct /api/... access and stripped /... routing
const apiRouter = express.Router();

apiRouter.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    product: 'CIT CampusOS API Gateway',
    timestamp: new Date().toISOString(),
  });
});

apiRouter.use('/auth', authRoutes);
apiRouter.use('/datasets', datasetRoutes);
apiRouter.use('/schedules', scheduleRoutes);
apiRouter.use('/exams', examRoutes);
apiRouter.use('/bookings', bookingRoutes);
apiRouter.use('/disruptions', disruptionRoutes);
apiRouter.use('/assistant', assistantRoutes);
apiRouter.use('/ai', aiRoutes);
apiRouter.use('/exports', exportRoutes);
apiRouter.use('/whatsapp', whatsappRoutes);
apiRouter.use('/faculty', facultyRoutes);
apiRouter.use('/notifications', notificationRoutes);

// Mount under /api (standard external public path) and root / (in case rewrite strips prefix)
app.use('/api', apiRouter);
app.use('/', apiRouter);

export default app;

