import crypto from 'crypto';
import * as custRepo from './repository.js';
import * as notifService from '../../shared/notifications/service.js';
import { calculateDistance } from '../../utils/haversine.js';
import getRazorpay from '../../config/razorpay.js';

/**
 * Find nearest store based on user GPS coordinates
 */
export const findNearestStore = async (lat, lng) => {
  const activeStores = await custRepo.getActiveStores();
  if (!activeStores || activeStores.length === 0) {
    return null;
  }

  let nearestStore = null;
  let minDistance = Infinity;

  for (const store of activeStores) {
    if (store.latitude && store.longitude) {
      const dist = calculateDistance(lat, lng, Number(store.latitude), Number(store.longitude));
      if (dist < minDistance) {
        minDistance = dist;
        nearestStore = store;
      }
    }
  }

  if (!nearestStore) {
    nearestStore = activeStores[0];
    minDistance = 0;
  }

  const isDeliverable = minDistance <= (Number(nearestStore.deliveryRadiusKm) || 15);

  return {
    store: nearestStore,
    distance_km: Math.round(minDistance * 10) / 10,
    is_deliverable: isDeliverable,
  };
};

/**
 * Fetch home screen payload
 */
export const getHomeScreenData = async (storeId) => {
  const [categoriesList, bannersList, sectionsList, featuredProducts] = await Promise.all([
    custRepo.getCategories(),
    custRepo.getBanners(),
    custRepo.getHomeSections(),
    custRepo.findProducts({ storeId, limit: 10 })
  ]);

  return {
    categories: categoriesList,
    banners: bannersList,
    sections: sectionsList,
    featured_products: featuredProducts
  };
};

/**
 * Validate Cart items against live DB stock and prices
 */
export const validateCartItems = async (items) => {
  if (!items || !Array.isArray(items) || items.length === 0) {
    return { is_valid: true, items: [], total: 0 };
  }

  const variantIds = items.map(i => i.variant_id || i.variantId).filter(Boolean);
  const dbVariants = await custRepo.getVariantsByIds(variantIds);
  const variantMap = new Map(dbVariants.map(v => [v.id, v]));

  let isValid = true;
  let total = 0;
  const validatedItems = [];

  for (const item of items) {
    const vId = item.variant_id || item.variantId;
    const variant = variantMap.get(vId);

    if (!variant || !variant.isActive) {
      isValid = false;
      validatedItems.push({
        ...item,
        is_available: false,
        error: 'Item is no longer available'
      });
      continue;
    }

    const availableStock = variant.stockQuantity || 0;
    const requestedQty = Number(item.quantity) || 1;
    const isOutOfStock = availableStock < requestedQty;

    if (isOutOfStock) {
      isValid = false;
    }

    const price = Number(variant.price);
    total += price * requestedQty;

    validatedItems.push({
      ...item,
      price,
      available_stock: availableStock,
      is_available: !isOutOfStock,
      error: isOutOfStock ? `Only ${availableStock} units available` : null
    });
  }

  return {
    is_valid: isValid,
    items: validatedItems,
    subtotal: total
  };
};

/**
 * Sync user cart items
 */
export const syncUserCart = async (userId, items) => {
  await custRepo.clearUserCart(userId);

  if (!items || !Array.isArray(items) || items.length === 0) {
    return [];
  }

  const rows = items.map(item => ({
    userId,
    productId: item.product_id || item.productId,
    variantId: item.variant_id || item.variantId,
    quantity: Number(item.quantity) || 1
  }));

  await custRepo.insertCartItems(rows);
  return await custRepo.getCartItemsWithVariants(userId);
};

/**
 * Place a new customer order
 */
export const placeOrder = async (userId, orderData) => {
  const {
    store_id,
    address_id,
    delivery_slot_id,
    payment_method = 'cod',
    items,
    notes,
    coupon_code
  } = orderData;

  if (!store_id || !address_id || !items || !Array.isArray(items) || items.length === 0) {
    const err = new Error('store_id, address_id, and items are required');
    err.status = 400;
    throw err;
  }

  // 1. Validate Stock
  const cartValidation = await validateCartItems(items);
  if (!cartValidation.is_valid) {
    const err = new Error('Some items in your cart are no longer available or exceed stock');
    err.status = 400;
    err.details = cartValidation.items;
    throw err;
  }

  // 2. Calculate Pricing
  const subtotal = cartValidation.subtotal;
  let discountAmount = 0;

  if (coupon_code) {
    const coupon = await custRepo.findCouponByCode(coupon_code);
    if (coupon) {
      if (Number(subtotal) >= Number(coupon.minOrderAmount || 0)) {
        if (coupon.discountType === 'percentage') {
          discountAmount = (subtotal * Number(coupon.discountValue)) / 100;
          if (coupon.maxDiscountAmount && discountAmount > Number(coupon.maxDiscountAmount)) {
            discountAmount = Number(coupon.maxDiscountAmount);
          }
        } else {
          discountAmount = Number(coupon.discountValue);
        }
      }
    }
  }

  const deliveryFee = subtotal >= 499 ? 0 : 60;
  const totalAmount = Math.max(0, subtotal - discountAmount + deliveryFee);

  // 3. Generate unique order number
  const orderNumber = `DF-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;

  // 4. Create Razorpay order if online payment
  let razorpayOrderId = null;
  if (payment_method === 'online' || payment_method === 'razorpay') {
    const razorpay = getRazorpay();
    if (razorpay) {
      const rpOrder = await razorpay.orders.create({
        amount: Math.round(totalAmount * 100), // in paise
        currency: 'INR',
        receipt: orderNumber
      });
      razorpayOrderId = rpOrder.id;
    }
  }

  // 5. DB Transaction: Insert Order + Items + Decrement Stock
  const newOrder = await custRepo.createOrderWithItems(
    {
      orderNumber,
      customerId: userId,
      storeId: store_id,
      addressId: address_id,
      deliverySlotId: delivery_slot_id || null,
      status: 'pending',
      paymentStatus: payment_method === 'cod' ? 'pending' : 'pending',
      paymentMethod: payment_method,
      subtotalAmount: String(subtotal),
      deliveryFee: String(deliveryFee),
      discountAmount: String(discountAmount),
      totalAmount: String(totalAmount),
      notes: notes || null,
      razorpayOrderId
    },
    items.map(i => ({
      productId: i.product_id || i.productId,
      variantId: i.variant_id || i.variantId,
      quantity: Number(i.quantity) || 1,
      unitPrice: String(i.price || 0),
      totalPrice: String((Number(i.price || 0) * (Number(i.quantity) || 1)).toFixed(2))
    }))
  );

  // 6. Clear user cart
  await custRepo.clearUserCart(userId);

  // 7. Send notification
  await notifService.sendToUser(
    userId,
    'Order Placed Successfully! 🎉',
    `Your order #${orderNumber} has been received.`,
    { type: 'order_placed', order_id: newOrder.id }
  );

  return {
    order: newOrder,
    razorpay_order_id: razorpayOrderId,
    total_amount: totalAmount
  };
};

/**
 * Verify Razorpay payment signature
 */
export const verifyPaymentSignature = async ({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) => {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    throw new Error('Razorpay secret not configured on server');
  }

  const generatedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  const isValid = generatedSignature === razorpay_signature;
  if (!isValid) {
    const err = new Error('Invalid Razorpay signature');
    err.status = 400;
    throw err;
  }

  return { is_valid: true };
};

/**
 * Validate Coupon code against order amount
 */
export const validateCoupon = async (code, orderAmount = 0) => {
  const coupon = await custRepo.findCouponByCode(code);
  if (!coupon) {
    const err = new Error('Invalid or expired coupon code');
    err.status = 404;
    throw err;
  }

  const amount = Number(orderAmount);
  if (amount < Number(coupon.minOrderAmount || 0)) {
    const err = new Error(`Minimum order value for this coupon is ₹${coupon.minOrderAmount}`);
    err.status = 400;
    throw err;
  }

  let discount = 0;
  if (coupon.discountType === 'percentage') {
    discount = (amount * Number(coupon.discountValue)) / 100;
    if (coupon.maxDiscountAmount && discount > Number(coupon.maxDiscountAmount)) {
      discount = Number(coupon.maxDiscountAmount);
    }
  } else {
    discount = Number(coupon.discountValue);
  }

  return {
    is_valid: true,
    coupon_code: coupon.code,
    discount_amount: Math.round(discount),
    final_amount: Math.max(0, amount - discount)
  };
};
