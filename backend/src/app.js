import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import { successResponse } from './utils/response.js';
import { pool } from './db/index.js';
import errorHandler from './middlewares/errorHandler.js';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger.js';

// Shared Platform Route Imports
import appConfigRoutes from './shared/app-config/routes.js';
import authRoutes from './shared/auth/routes.js';
import notificationRoutes from './shared/notifications/routes.js';
import paymentRoutes from './shared/payments/routes.js';
import mediaRoutes from './shared/media/routes.js';

// Actor Subsystem Route Imports
import customerRoutes from './domains/customer/routes.js';
import adminRoutes from './domains/admin/routes.js';
import storeRoutes from './domains/store/routes.js';
import riderRoutes from './domains/rider/routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// 1. Middlewares
app.use(helmet({
  crossOriginResourcePolicy: false,
}));
app.use(cors({
  origin: '*',
  methods: '*',
  allowedHeaders: '*'
}));
app.use(morgan('dev'));
app.use((req, res, next) => {
  console.log(`[BACKEND] ${req.method} ${req.url}`);
  next();
});
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 2. Static Assets (CDN / uploads)
// 2. Static Assets (CDN / local uploads fallback)
const activeUploadDir = (process.env.UPLOAD_PATH && fs.existsSync(process.env.UPLOAD_PATH))
  ? process.env.UPLOAD_PATH
  : path.join(__dirname, "../public/uploads");
console.log("[STORAGE] Static /uploads serving from:", activeUploadDir);
app.use("/uploads", express.static(activeUploadDir));

// 3. Health Check
app.get('/health', async (req, res) => {
  let dbStatus = 'disconnected';
  let dbLatencyMs = null;
  let dbError = null;

  try {
    const start = Date.now();
    await pool.query('SELECT 1');
    dbLatencyMs = Date.now() - start;
    dbStatus = 'connected';
  } catch (err) {
    dbError = err.message || String(err);
  }

  return successResponse(res, {
    uptime: process.uptime(),
    db: {
      status: dbStatus,
      latencyMs: dbLatencyMs,
      host: pool?.options?.host || 'unknown',
      user: pool?.options?.user || 'unknown',
      error: dbError
    }
  }, dbStatus === 'connected' ? 'API is healthy' : 'API running with database warning');
});

// 4. API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// 5. Shared Platform APIs
app.use('/api/v1/app', appConfigRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/media', mediaRoutes);

// 6. Actor Subsystem APIs
app.use('/api/v1/customer', customerRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/store', storeRoutes);
app.use('/api/v1/rider', riderRoutes);

// 7. 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint not found' });
});

// 8. Global Error Handler
app.use(errorHandler);

// Global listeners for debugging crashes
process.on('unhandledRejection', (reason, promise) => {
  console.error('[CRITICAL] Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[CRITICAL] Uncaught Exception:', err);
});

export default app;
