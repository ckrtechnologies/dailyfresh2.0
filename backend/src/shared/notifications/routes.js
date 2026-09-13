import express from 'express';
import * as notifController from './controller.js';
import { authenticate, authorize } from '../auth/middleware.js';

const router = express.Router();

router.use(authenticate);

// Current authenticated user notification inbox
router.get('/my', notifController.getNotifications);
router.patch('/:id/read', notifController.markAsRead);

// Admin-only broadcast
router.post('/broadcast', authorize(['admin']), notifController.sendManualNotification);
router.get('/all', authorize(['admin']), notifController.getAllNotifications);

export default router;
