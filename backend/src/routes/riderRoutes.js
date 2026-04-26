import express from 'express';
import * as riderController from '../controllers/riderController.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = express.Router();

// All rider routes require authentication and 'rider' role
router.use(authenticate);
router.use(authorize(['rider']));

router.get('/profile', riderController.getProfile);
router.patch('/status', riderController.toggleOnline);
router.patch('/location', riderController.updateLocation);
router.get('/deliveries', riderController.getDeliveries);
router.patch('/deliveries/:deliveryId/status', riderController.updateDeliveryStatus);

export default router;
