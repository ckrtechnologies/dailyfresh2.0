import express from 'express';
import * as catalogueController from './catalogueController.js';
import * as cartController from './cartController.js';
import * as orderController from './orderController.js';
import * as profileController from './profileController.js';
import * as favoritesController from './favoritesController.js';
import * as couponController from './couponController.js';
import * as notificationController from '../../shared/notifications/controller.js';
import { authenticate, authorize } from '../../shared/auth/middleware.js';

const router = express.Router();

/**
 * --- PUBLIC CUSTOMER ROUTES ---
 */
router.get('/categories', catalogueController.getCategories);
router.get('/categories/tree', catalogueController.getCategoryTree);
router.get('/banners', catalogueController.getBanners);
router.get('/home', catalogueController.getHomeData);
router.get('/stores/nearest', catalogueController.getNearestStore);
router.get('/delivery-slots', catalogueController.getDeliverySlots);
router.get('/products', catalogueController.listProducts);
router.get('/products/:id', catalogueController.getProductById);

/**
 * --- AUTHENTICATED CUSTOMER ROUTES ---
 */
router.use(authenticate);
router.use(authorize(['customer']));

// Profile & Addresses
router.get('/profile', profileController.getProfile);
router.put('/profile', profileController.updateProfile);
router.delete('/profile', profileController.deleteProfile);
router.patch('/fcm-token', profileController.updateFcmToken);

router.get('/addresses', profileController.getAddresses);
router.post('/addresses', profileController.addAddress);
router.patch('/addresses/:id', profileController.updateAddress);
router.delete('/addresses/:id', profileController.deleteAddress);

// Cart
router.get('/cart', cartController.getCart);
router.post('/cart/sync', cartController.syncCart);
router.post('/cart/validate', cartController.validateCart);

// Orders & Payments
router.post('/orders', orderController.placeOrder);
router.get('/orders', orderController.getMyOrders);
router.get('/orders/:id', orderController.getOrderById);
router.post('/payments/verify', orderController.verifyPayment);

// Favorites
router.get('/favorites', favoritesController.getFavorites);
router.post('/favorites/toggle', favoritesController.toggleFavorite);

// Coupons
router.get('/coupons', couponController.listCoupons);
router.post('/coupons/validate', couponController.validateCoupon);

// Notifications
router.get('/notifications', notificationController.getNotifications);
router.patch('/notifications/:id/read', notificationController.markAsRead);

export default router;
