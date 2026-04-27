import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';

import { successResponse } from './utils/response.js';
import errorHandler from './middlewares/errorHandler.js';

// Route Imports
import authRoutes from './routes/authRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import storeRoutes from './routes/storeRoutes.js';
import riderRoutes from './routes/riderRoutes.js';

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
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 2. Static Assets (CDN)
app.use('/uploads', express.static(process.env.UPLOAD_PATH || path.join(__dirname, '../uploads')));

// 3. Health Check
app.get('/health', (req, res) => {
  return successResponse(res, { uptime: process.uptime() }, 'API is healthy');
});

// 4. API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/customer', customerRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/store', storeRoutes);
app.use('/api/v1/rider', riderRoutes);

// 5. 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint not found' });
});

// 6. Global Error Handler
app.use(errorHandler);

export default app;
