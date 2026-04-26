import Razorpay from 'razorpay';
import crypto from 'crypto';
import { supabaseAdmin } from '../config/supabase.js';
import { successResponse, errorResponse } from '../utils/response.js';

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * Verify Razorpay Payment Signature
 */
export const verifyPayment = async (req, res) => {
  const { order_id, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  try {
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return errorResponse(res, 'Invalid payment signature', 400);
    }

    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .update({ 
        payment_status: 'paid', 
        razorpay_payment_id: razorpay_payment_id,
        status: 'confirmed' 
      })
      .eq('id', order_id)
      .select()
      .single();

    if (error) return errorResponse(res, 'Failed to update order payment status', 400, error);

    return successResponse(res, { order }, 'Payment verified and order confirmed');
  } catch (error) {
    return errorResponse(res, 'Internal server error', 500, error);
  }
};

/**
 * Handle Razorpay Webhook
 */
export const handleWebhook = async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  console.log('[Webhook] Received Razorpay event:', req.body.event);
  return res.status(200).send('Webhook processed');
};
