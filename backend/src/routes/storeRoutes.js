import express from 'express';
import * as storeController from '../controllers/storeController.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = express.Router();

// All store routes require authentication and 'store' role
router.use(authenticate);
router.use(authorize(['store']));

router.get('/dashboard', storeController.getDashboard);
router.get('/inventory', storeController.getInventory);
router.patch('/inventory/:productId/stock', storeController.updateStock);
router.get('/orders', storeController.getOrders);

export default router;
