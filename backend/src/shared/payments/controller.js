import * as paymentService from './service.js';
import { successResponse, errorResponse } from '../../utils/response.js';

export const verifyPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return errorResponse(res, 'Missing required payment verification fields', 400);
  }

  try {
    const isValid = paymentService.verifySignature({ razorpay_order_id, razorpay_payment_id, razorpay_signature });
    if (!isValid) return errorResponse(res, 'Invalid signature', 400);
    return successResponse(res, { verified: true }, 'Payment verified');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

export const handleWebhook = async (req, res) => {
  try {
    const event = req.body.event;
    const payload = req.body.payload;
    await paymentService.processWebhookEvent(event, payload);
    return res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('[Payment Webhook Error]:', error.message);
    return res.status(500).json({ status: 'error' });
  }
};
