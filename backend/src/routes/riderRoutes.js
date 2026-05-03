import express from 'express';
import * as riderController from '../controllers/riderController.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = express.Router();

// All rider routes require authentication and 'rider' role
router.use(authenticate);
router.use(authorize(['rider']));

router.get('/profile', riderController.getProfile);
router.get('/dashboard', riderController.getDashboardStats);
router.patch('/status', riderController.toggleOnline);
router.patch('/fcm-token', riderController.updateFCMToken);
router.patch('/location', riderController.updateLocation);

// Orders
router.get('/orders/active', riderController.getActiveOrders);
router.get('/orders/available', riderController.getAvailableOrders);
router.get('/orders/history', riderController.getOrderHistory);
router.get('/orders/:orderId', riderController.getOrderDetails);
router.post('/orders/accept', riderController.acceptOrder);
router.patch('/orders/:orderId/status', riderController.updateDeliveryStatus);

export default router;
