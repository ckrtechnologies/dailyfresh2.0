import express from 'express';
import * as customerController from '../controllers/customerController.js';
import * as productController from '../controllers/productController.js';
import * as categoryController from '../controllers/categoryController.js';
import * as cartController from '../controllers/cartController.js';
import * as orderController from '../controllers/orderController.js';
import * as notificationController from '../controllers/notificationController.js';
import * as bannerController from '../controllers/bannerController.js';
import * as storeController from '../controllers/storeController.js';
import * as favoritesController from '../controllers/favoritesController.js';

import { authenticate, authorize } from '../middlewares/auth.js';
import { cutoffGuard } from '../middlewares/cutoffGuard.js';

const router = express.Router();

// Public / Initial Routes
router.get('/categories', categoryController.getCategories);
router.get('/categories/tree', categoryController.getCategoryTree);
router.get('/banners', bannerController.getBanners);
router.get('/stores/nearest', storeController.getNearestStore); // No auth — called on location pick

router.get('/products', productController.listProducts);
router.get('/home', productController.getHomeData);
router.get('/products/:id', productController.getProductById);
router.post('/products/decrement-stock', productController.decrementStock);

// All customer routes require authentication and 'customer' role
router.use(authenticate);
router.use(authorize(['customer']));

// Notifications & Coupons
router.get('/notifications', notificationController.getNotifications);
router.patch('/notifications/:id/read', notificationController.markAsRead);
import * as couponController from '../controllers/couponController.js';
router.post('/coupons/validate', couponController.validateCoupon);
router.get('/coupons', couponController.listCoupons);

// Profile & Address
router.get('/profile', customerController.getProfile);
router.put('/profile', customerController.updateProfile);
router.get('/addresses', customerController.getAddresses);
router.post('/addresses', customerController.addAddress);
router.patch('/addresses/:id', customerController.updateAddress);
router.delete('/addresses/:id', customerController.deleteAddress);
router.patch('/fcm-token', customerController.updateFcmToken);
router.get('/favorites', favoritesController.getFavorites);
router.post('/favorites/toggle', favoritesController.toggleFavorite);

// Cart & Orders
// Cart
router.get('/cart', cartController.getCart);
router.post('/cart/sync', cartController.syncCart);
router.delete('/cart', cartController.clearCart);
router.post('/orders', cutoffGuard, orderController.placeOrder);
router.post('/payments/verify', orderController.verifyPayment);
router.get('/orders', orderController.getMyOrders);
router.get('/orders/:id', orderController.getOrderById);

export default router;
