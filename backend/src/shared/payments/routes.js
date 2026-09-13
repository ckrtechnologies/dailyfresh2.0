import express from 'express';
import * as paymentController from './controller.js';

const router = express.Router();

router.post('/verify', paymentController.verifyPayment);
router.post('/webhook', paymentController.handleWebhook);

export default router;
