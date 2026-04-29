import express from 'express';
import * as storeController from '../controllers/storeController.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import { upload } from '../middlewares/uploadMiddleware.js';

const router = express.Router();

// All store routes require authentication and 'store_manager' role
router.use(authenticate);
router.use(authorize(['store_manager']));

router.get('/dashboard', storeController.getDashboard);
router.get('/inventory', storeController.getInventory);
router.patch('/inventory/:productId/stock', storeController.updateStock);
router.patch('/inventory/:productId/status', storeController.updateProductStatus);
router.get('/orders', storeController.getOrders);
router.get('/customers', storeController.getCustomers);
router.patch('/orders/:orderId/status', storeController.updateOrderStatus);
router.get('/profile', storeController.getStoreProfile);
router.patch('/profile/status', storeController.updateStoreStatus);
router.patch('/fcm-token', storeController.updateFcmToken);

router.get('/categories', storeController.getCategories);
router.get('/sub-categories', storeController.getSubCategories);

// Inventory CRUD with Image Upload support
router.post('/inventory', upload.any(), storeController.createProduct);
router.get('/inventory/export', storeController.exportInventoryCSV);
router.put('/inventory/:productId', upload.any(), storeController.updateProduct);
router.delete('/inventory/:productId', storeController.deleteProduct);

router.get('/orders/export', storeController.exportOrdersCSV);

export default router;
