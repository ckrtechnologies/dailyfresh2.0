import express from 'express';
import * as adminController from '../controllers/adminController.js';
import * as notificationController from '../controllers/notificationController.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import { upload } from '../middlewares/uploadMiddleware.js';

const router = express.Router();

// All admin routes require authentication
router.use(authenticate);

// --- SHARED (Admin + Manager) ---
// Dashboard & Analytics
router.get('/stats', authorize(['admin', 'store_manager']), adminController.getDashboardStats);
router.get('/recent-orders', authorize(['admin', 'store_manager']), adminController.listOrders); 

// Common Upload Utility
router.post('/upload', authorize(['admin', 'store_manager']), upload.single('file'), adminController.uploadFile);

// Order Management
router.get('/orders', authorize(['admin', 'store_manager']), adminController.listOrders);
router.patch('/orders/:id/status', authorize(['admin', 'store_manager']), adminController.updateOrderStatus);

// Store Management (GET list for dropdowns etc)
router.get('/stores', authorize(['admin', 'store_manager']), adminController.listStores);

// Rider Management (View list)
router.get('/riders', authorize(['admin', 'store_manager']), adminController.listRiders);

// Global Catalogue (Read-Only for Manager)
router.get('/categories', authorize(['admin', 'store_manager']), adminController.listCategories);
router.get('/sub-categories', authorize(['admin', 'store_manager']), adminController.listSubCategories);
router.get('/products', authorize(['admin', 'store_manager']), adminController.listProducts);


// --- ADMIN ONLY ---
router.post('/onboard-staff', authorize(['admin']), adminController.onboardStaff);
router.get('/staff', authorize(['admin']), adminController.listStaff);
router.delete('/staff/:id', authorize(['admin']), adminController.deleteStaff);
router.get('/customers', authorize(['admin']), adminController.listCustomers);

// Notification Management System (NMS)
router.get('/notifications', authorize(['admin']), notificationController.getAllNotifications);
router.post('/notifications/send', authorize(['admin']), notificationController.sendManualNotification);

// Store CRUD
router.post('/stores', authorize(['admin']), adminController.createStore);
router.patch('/stores/:id', authorize(['admin']), adminController.updateStore);
router.delete('/stores/:id', authorize(['admin']), adminController.deleteStore);

// Rider Management
router.patch('/riders/:riderId/approve', authorize(['admin']), adminController.approveRider);
router.patch('/riders/:riderId', authorize(['admin', 'store_manager']), adminController.updateRiderStatus);

// Catalog CRUD (Managers cannot add/remove)
router.post('/categories', authorize(['admin']), upload.any(), adminController.createCategory);
router.patch('/categories/:id', authorize(['admin']), upload.any(), adminController.updateCategory);
router.delete('/categories/:id', authorize(['admin']), adminController.deleteCategory);

router.post('/sub-categories', authorize(['admin']), upload.any(), adminController.createSubCategory);
router.patch('/sub-categories/:id', authorize(['admin']), upload.any(), adminController.updateSubCategory);
router.delete('/sub-categories/:id', authorize(['admin']), adminController.deleteSubCategory);

router.post('/products', authorize(['admin', 'store_manager']), upload.any(), adminController.createProduct);
router.patch('/products/:id', authorize(['admin', 'store_manager']), upload.any(), adminController.updateProduct);
router.delete('/products/:id', authorize(['admin']), adminController.deleteProduct);

// Platform Global Settings
router.get('/config', authorize(['admin']), adminController.getPlatformSettings);
router.patch('/config', authorize(['admin']), adminController.updatePlatformSettings);

// Home Screen Management
router.get('/banners', authorize(['admin']), adminController.listBanners);
router.post('/banners', authorize(['admin']), upload.any(), adminController.createBanner);
router.patch('/banners/:id', authorize(['admin']), upload.any(), adminController.updateBanner);
router.delete('/banners/:id', authorize(['admin']), adminController.deleteBanner);

router.get('/home-sections', authorize(['admin']), adminController.listHomeSections);
router.patch('/home-sections/:id', authorize(['admin']), adminController.updateHomeSection);

// Coupon Management
import * as couponController from '../controllers/couponController.js';
router.get('/coupons', authorize(['admin']), couponController.listCoupons);
router.post('/coupons', authorize(['admin']), couponController.createCoupon);
router.patch('/coupons/:id', authorize(['admin']), couponController.updateCoupon);
router.delete('/coupons/:id', authorize(['admin']), couponController.deleteCoupon);


export default router;
