import * as custRepo from './repository.js';
import * as custService from './service.js';
import { successResponse, errorResponse } from '../../utils/response.js';

export const placeOrder = async (req, res) => {
  try {
    const result = await custService.placeOrder(req.user.id, req.body);
    return successResponse(res, result, 'Order placed successfully', 201);
  } catch (error) {
    return errorResponse(res, error.message || 'Failed to place order', error.status || 500, error.details || error);
  }
};

export const getMyOrders = async (req, res) => {
  try {
    const { limit, offset } = req.query;
    const orders = await custRepo.getCustomerOrders(
      req.user.id,
      limit ? Number(limit) : 50,
      offset ? Number(offset) : 0
    );
    return successResponse(res, orders, 'Orders fetched successfully');
  } catch (error) {
    return errorResponse(res, 'Failed to fetch orders', 500, error.message);
  }
};

export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await custRepo.getCustomerOrderById(id, req.user.id);
    if (!order) {
      return errorResponse(res, 'Order not found', 404);
    }
    return successResponse(res, order, 'Order details fetched');
  } catch (error) {
    return errorResponse(res, 'Failed to fetch order', 500, error.message);
  }
};

export const verifyPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, order_id } = req.body;
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return errorResponse(res, 'All payment verification parameters are required', 400);
  }

  try {
    await custService.verifyPaymentSignature({ razorpay_order_id, razorpay_payment_id, razorpay_signature });

    if (order_id) {
      await custRepo.updateOrderPayment(order_id, {
        paymentStatus: 'completed',
        razorpayPaymentId: razorpay_payment_id,
        updatedAt: new Date()
      });
    }

    return successResponse(res, { verified: true }, 'Payment verified successfully');
  } catch (error) {
    return errorResponse(res, error.message || 'Payment verification failed', error.status || 400, error);
  }
};
