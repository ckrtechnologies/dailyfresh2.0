import express from 'express';
import * as riderController from '../controllers/riderController.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Rider
 *   description: APIs for the Rider Mobile App
 */

// All rider routes require authentication and 'rider' role
router.use(authenticate);
router.use(authorize(['rider']));

/**
 * @swagger
 * /rider/profile:
 *   get:
 *     summary: Get rider profile
 *     tags: [Rider]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile data
 */
router.get('/profile', riderController.getProfile);

/**
 * @swagger
 * /rider/dashboard:
 *   get:
 *     summary: Get dashboard stats
 *     tags: [Rider]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics
 */
router.get('/dashboard', riderController.getDashboardStats);

/**
 * @swagger
 * /rider/status:
 *   patch:
 *     summary: Toggle online status
 *     tags: [Rider]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               is_online: { type: boolean }
 *     responses:
 *       200:
 *         description: Status updated
 */
router.patch('/status', riderController.toggleOnline);

/**
 * @swagger
 * /rider/location:
 *   patch:
 *     summary: Update GPS location
 *     tags: [Rider]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               latitude: { type: number }
 *               longitude: { type: number }
 *     responses:
 *       200:
 *         description: Location updated
 */
router.patch('/location', riderController.updateLocation);

/**
 * @swagger
 * /rider/orders/available:
 *   get:
 *     summary: List available orders pool
 *     tags: [Rider]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of available orders
 */
router.get('/orders/available', riderController.getAvailableOrders);

/**
 * @swagger
 * /rider/orders/accept:
 *   post:
 *     summary: Accept an order
 *     tags: [Rider]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orderId: { type: string }
 *     responses:
 *       200:
 *         description: Order accepted
 */
router.post('/orders/accept', riderController.acceptOrder);

/**
 * @swagger
 * /rider/orders/{orderId}/status:
 *   patch:
 *     summary: Update delivery status
 *     tags: [Rider]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status: { type: string, enum: [picked_up, delivered] }
 *     responses:
 *       200:
 *         description: Status updated
 */
router.patch('/orders/:orderId/status', riderController.updateDeliveryStatus);

// Others
router.patch('/fcm-token', riderController.updateFCMToken);
router.get('/orders/active', riderController.getActiveOrders);
router.get('/orders/history', riderController.getOrderHistory);
router.get('/orders/:orderId', riderController.getOrderDetails);

export default router;
