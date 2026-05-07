import express from 'express';
import * as adminController from '../controllers/adminController.js';
import * as notificationController from '../controllers/notificationController.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import { upload } from '../middlewares/uploadMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: System-wide Management APIs
 */

router.use(authenticate);

/**
 * @swagger
 * /admin/stats:
 *   get:
 *     summary: Get platform stats
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Global analytics data
 */
router.get('/stats', authorize(['admin', 'store_manager']), adminController.getDashboardStats);

/**
 * @swagger
 * /admin/orders:
 *   get:
 *     summary: List all orders
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of orders
 */
router.get('/orders', authorize(['admin', 'store_manager']), adminController.listOrders);

/**
 * @swagger
 * /admin/orders/{id}/status:
 *   patch:
 *     summary: Update order status (Triggers notifications)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status: { type: string }
 *     responses:
 *       200:
 *         description: Status updated
 */
router.patch('/orders/:id/status', authorize(['admin', 'store_manager']), adminController.updateOrderStatus);

/**
 * @swagger
 * /admin/notifications/send:
 *   post:
 *     summary: Send manual notification
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               body: { type: string }
 *               role: { type: string }
 *     responses:
 *       200:
 *         description: Notification broadcasted
 */
router.post('/notifications/send', authorize(['admin']), notificationController.sendManualNotification);

// Fallback for all other admin routes (listing them briefly)
router.get('/recent-orders', authorize(['admin', 'store_manager']), adminController.listOrders); 
router.post('/upload', authorize(['admin', 'store_manager']), upload.single('file'), adminController.uploadFile);
router.get('/stores', authorize(['admin', 'store_manager']), adminController.listStores);
router.get('/riders', authorize(['admin', 'store_manager']), adminController.listRiders);
router.get('/rider-logs', authorize(['admin', 'store_manager']), adminController.listRiderDistanceLogs);
router.get('/categories', authorize(['admin', 'store_manager']), adminController.listCategories);
router.get('/sub-categories', authorize(['admin', 'store_manager']), adminController.listSubCategories);
router.get('/products', authorize(['admin', 'store_manager']), adminController.listProducts);
router.post('/onboard-staff', authorize(['admin']), adminController.onboardStaff);
router.get('/staff', authorize(['admin']), adminController.listStaff);
router.delete('/staff/:id', authorize(['admin']), adminController.deleteStaff);
router.get('/customers', authorize(['admin']), adminController.listCustomers);
router.get('/notifications', authorize(['admin']), notificationController.getAllNotifications);
router.post('/stores', authorize(['admin']), adminController.createStore);
router.patch('/stores/:id', authorize(['admin']), adminController.updateStore);
router.delete('/stores/:id', authorize(['admin']), adminController.deleteStore);
router.patch('/riders/:riderId/approve', authorize(['admin']), adminController.approveRider);
router.patch('/riders/:riderId', authorize(['admin', 'store_manager']), adminController.updateRiderStatus);
router.post('/categories', authorize(['admin']), upload.any(), adminController.createCategory);
router.patch('/categories/:id', authorize(['admin']), upload.any(), adminController.updateCategory);
router.delete('/categories/:id', authorize(['admin']), adminController.deleteCategory);
router.post('/sub-categories', authorize(['admin']), upload.any(), adminController.createSubCategory);
router.patch('/sub-categories/:id', authorize(['admin']), upload.any(), adminController.updateSubCategory);
router.delete('/sub-categories/:id', authorize(['admin']), adminController.deleteSubCategory);
router.post('/products', authorize(['admin', 'store_manager']), upload.any(), adminController.createProduct);
router.patch('/products/:id', authorize(['admin', 'store_manager']), upload.any(), adminController.updateProduct);
router.delete('/products/:id', authorize(['admin']), adminController.deleteProduct);
router.get('/config', authorize(['admin']), adminController.getPlatformSettings);
router.patch('/config', authorize(['admin']), adminController.updatePlatformSettings);
router.get('/banners', authorize(['admin']), adminController.listBanners);
router.post('/banners', authorize(['admin']), upload.any(), adminController.createBanner);
router.patch('/banners/:id', authorize(['admin']), upload.any(), adminController.updateBanner);
router.delete('/banners/:id', authorize(['admin']), adminController.deleteBanner);
router.get('/home-sections', authorize(['admin']), adminController.listHomeSections);
router.patch('/home-sections/:id', authorize(['admin']), adminController.updateHomeSection);

import * as couponController from '../controllers/couponController.js';
router.get('/coupons', authorize(['admin']), couponController.listCoupons);
router.post('/coupons', authorize(['admin']), couponController.createCoupon);
router.patch('/coupons/:id', authorize(['admin']), couponController.updateCoupon);
router.delete('/coupons/:id', authorize(['admin']), couponController.deleteCoupon);

// Delivery Slots
router.get('/delivery-slots',       authorize(['admin', 'store_manager']), adminController.listDeliverySlots);
router.post('/delivery-slots',      authorize(['admin']), adminController.createDeliverySlot);
router.patch('/delivery-slots/:id', authorize(['admin']), adminController.updateDeliverySlot);
router.delete('/delivery-slots/:id',authorize(['admin']), adminController.deleteDeliverySlot);

export default router;
