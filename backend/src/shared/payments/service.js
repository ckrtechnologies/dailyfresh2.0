import crypto from 'crypto';
import getRazorpay from '../../config/razorpay.js';
import * as paymentRepo from './repository.js';
import * as notifService from '../notifications/service.js';

export const createRazorpayOrder = async ({ amount, receipt, notes = {} }) => {
  const razorpay = getRazorpay();
  if (!razorpay) throw new Error('Razorpay client not configured');

  return await razorpay.orders.create({
    amount: Math.round(amount * 100), // in paise
    currency: 'INR',
    receipt,
    notes
  });
};

export const verifySignature = ({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) => {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) throw new Error('Razorpay secret not configured');

  const generated = crypto
    .createHmac('sha256', secret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  return generated === razorpay_signature;
};

export const processWebhookEvent = async (event, payload) => {
  if (event === 'payment.captured' || event === 'order.paid') {
    const razorpayOrderId = payload.payment?.entity?.order_id || payload.order?.entity?.id;
    const razorpayPaymentId = payload.payment?.entity?.id;

    if (razorpayOrderId) {
      const order = await paymentRepo.findOrderByRazorpayId(razorpayOrderId);
      if (order && order.paymentStatus !== 'completed') {
        await paymentRepo.updateOrderPaymentStatus(order.id, {
          status: 'completed',
          paymentId: razorpayPaymentId
        });

        if (order.userId) {
          await notifService.sendToUser(
            order.userId,
            'Payment Confirmed! 💳',
            `Payment for order #${order.orderNumber} was successful.`,
            { type: 'payment_success', order_id: order.id }
          );
        }
      }
    }
  }
  return { processed: true };
};
