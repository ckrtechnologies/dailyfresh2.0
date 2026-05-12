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
import * as couponController from '../controllers/couponController.js';

import { authenticate, authorize } from '../middlewares/auth.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Customer
 *   description: APIs for the Customer Mobile App
 */

// --- PUBLIC ROUTES ---

/**
 * @swagger
 * /customer/categories:
 *   get:
 *     summary: List all categories
 *     tags: [Customer]
 *     responses:
 *       200:
 *         description: List of categories
 */
router.get('/categories', categoryController.getCategories);

/**
 * @swagger
 * /customer/categories/tree:
 *   get:
 *     summary: Get category tree
 *     tags: [Customer]
 *     responses:
 *       200:
 *         description: Category tree
 */
router.get('/categories/tree', categoryController.getCategoryTree);

/**
 * @swagger
 * /customer/banners:
 *   get:
 *     summary: List banners
 *     tags: [Customer]
 *     responses:
 *       200:
 *         description: List of banners
 */
router.get('/banners', bannerController.getBanners);

/**
 * @swagger
 * /customer/stores/nearest:
 *   get:
 *     summary: Find nearest store
 *     tags: [Customer]
 *     parameters:
 *       - in: query
 *         name: lat
 *         required: true
 *         schema: { type: number }
 *       - in: query
 *         name: lng
 *         required: true
 *         schema: { type: number }
 *     responses:
 *       200:
 *         description: Nearest store data
 */
router.get('/stores/nearest', storeController.getNearestStore);

/**
 * @swagger
 * /customer/home:
 *   get:
 *     summary: Get home screen data
 *     tags: [Customer]
 *     responses:
 *       200:
 *         description: Home data
 */
router.get('/home', productController.getHomeData);

// Delivery time-window slots — public, no auth needed
router.get('/delivery-slots', async (req, res) => {
  const { supabaseAdmin } = await import('../config/supabase.js');
  const { successResponse, errorResponse } = await import('../utils/response.js');
  const { data, error } = await supabaseAdmin
    .from('delivery_slots')
    .select('id, type, slot_name, start_time, end_time, display_order')
    .eq('is_active', true)
    .order('type', { ascending: true })
    .order('display_order', { ascending: true });
  if (error) return errorResponse(res, 'Failed to fetch delivery slots', 500, error);
  return successResponse(res, {
    tomorrow_morning: data.filter(s => s.type === 'tomorrow_morning'),
    tomorrow_evening: data.filter(s => s.type === 'tomorrow_evening'),
  });
});

/**
 * @swagger
 * /customer/products:
 *   get:
 *     summary: List/Search products
 *     tags: [Customer]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: category_id
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of products
 */
router.get('/products', productController.listProducts);

/**
 * @swagger
 * /customer/products/{id}:
 *   get:
 *     summary: Get product details
 *     tags: [Customer]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Product details
 */
router.get('/products/:id', productController.getProductById);

// --- AUTHENTICATED ROUTES ---
router.use(authenticate);
router.use(authorize(['customer']));

/**
 * @swagger
 * /customer/profile:
 *   get:
 *     summary: Get customer profile
 *     tags: [Customer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile data
 */
router.get('/profile', customerController.getProfile);

/**
 * @swagger
 * /customer/profile:
 *   put:
 *     summary: Update customer profile
 *     tags: [Customer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile updated
 */
router.put('/profile', customerController.updateProfile);
router.delete('/profile', customerController.deleteProfile);

/**
 * @swagger
 * /customer/addresses:
 *   get:
 *     summary: List saved addresses
 *     tags: [Customer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of addresses
 */
router.get('/addresses', customerController.getAddresses);

/**
 * @swagger
 * /customer/addresses:
 *   post:
 *     summary: Add new address
 *     tags: [Customer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Address added
 */
router.post('/addresses', customerController.addAddress);
router.patch('/addresses/:id', customerController.updateAddress);
router.delete('/addresses/:id', customerController.deleteAddress);

/**
 * @swagger
 * /customer/favorites:
 *   get:
 *     summary: Get favorites
 *     tags: [Customer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of favorites
 */
router.get('/favorites', favoritesController.getFavorites);

/**
 * @swagger
 * /customer/favorites/toggle:
 *   post:
 *     summary: Toggle favorite
 *     tags: [Customer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Favorite toggled
 */
router.post('/favorites/toggle', favoritesController.toggleFavorite);

/**
 * @swagger
 * /customer/cart:
 *   get:
 *     summary: Get cart
 *     tags: [Customer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart data
 */
router.get('/cart', cartController.getCart);

/**
 * @swagger
 * /customer/cart/sync:
 *   post:
 *     summary: Sync cart
 *     tags: [Customer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart synced
 */
router.post('/cart/sync', cartController.syncCart);
router.post('/cart/validate', cartController.validateCart);

/**
 * @swagger
 * /customer/orders:
 *   post:
 *     summary: Place order
 *     tags: [Customer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Order placed
 */
router.post('/orders', orderController.placeOrder);

/**
 * @swagger
 * /customer/orders:
 *   get:
 *     summary: Get my orders
 *     tags: [Customer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of orders
 */
router.get('/orders', orderController.getMyOrders);

/**
 * @swagger
 * /customer/orders/{id}:
 *   get:
 *     summary: Get order details
 *     tags: [Customer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Order details
 */
router.get('/orders/:id', orderController.getOrderById);

// FCM & Other
router.patch('/fcm-token', customerController.updateFcmToken);
router.get('/notifications', notificationController.getNotifications);
router.patch('/notifications/:id/read', notificationController.markAsRead);
router.post('/coupons/validate', couponController.validateCoupon);
router.get('/coupons', couponController.listCoupons);
router.post('/payments/verify', orderController.verifyPayment);

export default router;
