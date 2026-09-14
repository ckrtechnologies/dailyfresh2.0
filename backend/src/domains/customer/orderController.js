import * as custRepo from './repository.js';
import * as custService from './service.js';
import * as notifService from '../../shared/notifications/service.js';
import { successResponse, errorResponse } from '../../utils/response.js';

/**
 * Normalize order object for cross-compatibility between camelCase and snake_case consumers
 */
export const formatOrderResponse = (order) => {
  if (!order) return null;
  const createdAtIso = order.createdAt instanceof Date ? order.createdAt.toISOString() : (order.createdAt || order.created_at || new Date().toISOString());
  const updatedAtIso = order.updatedAt instanceof Date ? order.updatedAt.toISOString() : (order.updatedAt || order.updated_at || createdAtIso);
  
  // Normalize address object from relations if present
  let deliveryAddress = null;
  if (order.address) {
    deliveryAddress = {
      id: order.address.id,
      label: order.address.label || 'Delivery Address',
      full_name: order.address.fullName || order.address.full_name || '',
      fullName: order.address.fullName || order.address.full_name || '',
      phone: order.address.phone || '',
      line1: order.address.line1 || '',
      line2: order.address.line2 || '',
      city: order.address.city || '',
      state: order.address.state || '',
      pincode: order.address.pincode || '',
      latitude: order.address.latitude || null,
      longitude: order.address.longitude || null,
    };
  } else if (order.delivery_address || order.deliveryAddress) {
    const raw = order.delivery_address || order.deliveryAddress;
    deliveryAddress = Array.isArray(raw) ? raw[0] : raw;
  }

  const shippingAddress = order.shipping_address || (deliveryAddress ? {
    label: deliveryAddress.label,
    full_name: deliveryAddress.full_name || deliveryAddress.fullName,
    phone: deliveryAddress.phone,
    address: `${deliveryAddress.line1}${deliveryAddress.line2 ? `, ${deliveryAddress.line2}` : ''}`,
    city: deliveryAddress.city,
    pincode: deliveryAddress.pincode
  } : null);

  const addressLine1 = deliveryAddress 
    ? `${deliveryAddress.line1}${deliveryAddress.line2 ? `, ${deliveryAddress.line2}` : ''}, ${deliveryAddress.city} - ${deliveryAddress.pincode}` 
    : (order.address_line1 || order.address || null);

  return {
    ...order,
    id: order.id,
    order_number: order.orderNumber || order.order_number,
    orderNumber: order.orderNumber || order.order_number,
    created_at: createdAtIso,
    createdAt: createdAtIso,
    updated_at: updatedAtIso,
    updatedAt: updatedAtIso,
    user_id: order.userId || order.user_id,
    store_id: order.storeId || order.store_id,
    delivery_type: order.deliveryType || order.delivery_type,
    deliveryType: order.deliveryType || order.delivery_type,
    total_amount: order.totalAmount || order.total_amount,
    totalAmount: order.totalAmount || order.total_amount,
    status: order.status,
    payment_status: order.paymentStatus || order.payment_status || 'unpaid',
    paymentStatus: order.paymentStatus || order.payment_status || 'unpaid',
    payment_method: order.paymentMethod || order.payment_method || 'cod',
    paymentMethod: order.paymentMethod || order.payment_method || 'cod',
    delivery_charge: order.deliveryCharge || order.delivery_charge || '0.00',
    deliveryCharge: order.deliveryCharge || order.delivery_charge || '0.00',
    gst_amount: order.gstAmount || order.gst_amount || '0.00',
    gstAmount: order.gstAmount || order.gst_amount || '0.00',
    discount_amount: order.discountAmount || order.discount_amount || '0.00',
    discountAmount: order.discountAmount || order.discount_amount || '0.00',
    total_items_price: order.totalItemsPrice || order.total_items_price || '0.00',
    totalItemsPrice: order.totalItemsPrice || order.total_items_price || '0.00',
    delivery_otp: order.deliveryOtp || order.delivery_otp || null,
    deliveryOtp: order.deliveryOtp || order.delivery_otp || null,
    address_id: order.addressId || order.address_id || null,
    addressId: order.addressId || order.address_id || null,
    rider_id: order.riderId || order.rider_id || null,
    riderId: order.riderId || order.rider_id || null,
    delivery_address: deliveryAddress,
    deliveryAddress: deliveryAddress,
    shipping_address: shippingAddress,
    address_line1: addressLine1,
    razorpay_order_id: order.razorpayOrderId || order.razorpay_order_id || null,
    razorpayOrderId: order.razorpayOrderId || order.razorpay_order_id || null,
    items: Array.isArray(order.items) ? order.items.map(item => {
      const p = item.product || {};
      const img = p.imageUrl || p.image_url || item.imageUrl || item.image_url || null;
      return {
        ...item,
        order_id: item.orderId || item.order_id,
        product_id: item.productId || item.product_id,
        variant_id: item.variantId || item.variant_id,
        unit_price: item.unitPrice || item.unit_price,
        total_price: item.totalPrice || item.total_price,
        product: {
          ...p,
          id: p.id || item.productId || item.product_id,
          name: p.name || item.name,
          image_url: img,
          imageUrl: img,
        },
        variant: item.variant ? {
          ...item.variant,
          image_url: item.variant.imageUrl || item.variant.image_url || img,
          imageUrl: item.variant.imageUrl || item.variant.image_url || img,
        } : null
      };
    }) : order.items
  };
};

export const placeOrder = async (req, res) => {
  try {
    const result = await custService.placeOrder(req.user.id, req.body);
    const formattedResult = {
      ...result,
      order: formatOrderResponse(result.order),
      order_id: result.order_id || result.order?.id,
      orderId: result.orderId || result.order?.id,
    };
    return successResponse(res, formattedResult, 'Order placed successfully', 201);
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
    const formatted = Array.isArray(orders) ? orders.map(formatOrderResponse) : [];
    return successResponse(res, formatted, 'Orders fetched successfully');
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
    const formatted = formatOrderResponse(order);
    return successResponse(res, { ...formatted, order: formatted }, 'Order details fetched');
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
        paymentStatus: 'paid',
        status: 'confirmed',
        razorpayPaymentId: razorpay_payment_id,
        updatedAt: new Date()
      });

      // Clear customer cart now that payment is confirmed
      await custRepo.clearUserCart(req.user.id);

      // Send push notification to user
      try {
        const order = await custRepo.getCustomerOrderById(order_id, req.user.id);
        const orderNum = order?.orderNumber || order?.order_number || '';
        await notifService.sendToUser(
          req.user.id,
          'Payment Successful & Order Confirmed! 🎉',
          `Your order #${orderNum} has been placed and confirmed.`,
          { type: 'order_placed', order_id }
        );
      } catch (notifErr) {
        console.warn('[VerifyPayment] Notification error:', notifErr.message);
      }
    }

    return successResponse(res, { verified: true }, 'Payment verified successfully');
  } catch (error) {
    return errorResponse(res, error.message || 'Payment verification failed', error.status || 400, error);
  }
};
