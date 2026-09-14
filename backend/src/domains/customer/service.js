import crypto from 'crypto';
import * as custRepo from './repository.js';
import { db } from '../../db/index.js';
import { products, subCategories } from '../../db/schema.js';
import { eq, and } from 'drizzle-orm';
import * as notifService from '../../shared/notifications/service.js';
import { calculateDistance } from '../../utils/haversine.js';
import getRazorpay from '../../config/razorpay.js';

// In-memory cache for pincode coordinates
const pincodeGeoCache = new Map();

const geocodePincode = async (pincode) => {
  const cleanPin = String(pincode).trim();
  if (pincodeGeoCache.has(cleanPin)) return pincodeGeoCache.get(cleanPin);
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&postalcode=${cleanPin}&country=India`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(url, {
      headers: { 'User-Agent': 'DailyFreshBackend/1.0' },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    const data = await res.json();
    if (data && data[0] && data[0].lat && data[0].lon) {
      const coords = { lat: Number(data[0].lat), lng: Number(data[0].lon) };
      pincodeGeoCache.set(cleanPin, coords);
      return coords;
    }
  } catch (err) {
    console.warn(`[Geocode] Failed to geocode pincode ${cleanPin}:`, err.message);
  }
  return null;
};

/**
 * Find nearest store based on user GPS coordinates or Pincode
 */
export const findNearestStore = async (lat, lng, pincode) => {
  const activeStores = await custRepo.getActiveStores();
  if (!activeStores || activeStores.length === 0) {
    return null;
  }

  const cleanPin = pincode ? String(pincode).trim() : null;

  // 1. PINCODE WHITELIST: Check if any active store explicitly whitelists this pincode
  if (cleanPin) {
    const matchedStore = activeStores.find(s => {
      const pins = Array.isArray(s.serviceablePincodes) ? s.serviceablePincodes : (Array.isArray(s.serviceable_pincodes) ? s.serviceable_pincodes : []);
      return pins.includes(cleanPin) || String(s.pincode).trim() === cleanPin;
    });

    if (matchedStore) {
      let dist = 0;
      if (lat && lng && matchedStore.latitude && matchedStore.longitude) {
        dist = calculateDistance(lat, lng, Number(matchedStore.latitude), Number(matchedStore.longitude));
      }
      return {
        store: matchedStore,
        distance_km: Math.round(dist * 10) / 10,
        is_deliverable: true,
      };
    }
  }

  // 2. HAVERSINE RADIUS MATCHING:
  // Determine coordinates: use passed lat/lng or geocode pincode
  let targetLat = lat;
  let targetLng = lng;

  if ((!targetLat || !targetLng) && cleanPin) {
    const geocoded = await geocodePincode(cleanPin);
    if (geocoded) {
      targetLat = geocoded.lat;
      targetLng = geocoded.lng;
    }
  }

  if (targetLat && targetLng) {
    let nearestStore = null;
    let minDistance = Infinity;

    for (const store of activeStores) {
      if (store.latitude && store.longitude) {
        const dist = calculateDistance(targetLat, targetLng, Number(store.latitude), Number(store.longitude));
        if (dist < minDistance) {
          minDistance = dist;
          nearestStore = store;
        }
      }
    }

    if (nearestStore) {
      const radius = Number(nearestStore.deliveryRadiusKm || nearestStore.delivery_radius_km) || 15;
      const isDeliverable = minDistance <= radius;

      return {
        store: isDeliverable ? nearestStore : null,
        nearest_store: nearestStore,
        distance_km: Math.round(minDistance * 10) / 10,
        is_deliverable: isDeliverable,
      };
    }
  }

  // 3. Pincode was provided but matched no whitelist and coordinates outside radius / unresolved
  if (cleanPin) {
    return {
      store: null,
      distance_km: null,
      is_deliverable: false,
    };
  }

  // 4. Fallback only if absolutely no location info was provided (cold browse).
  const defaultStore = activeStores[0];
  return {
    store: defaultStore,
    distance_km: 0,
    is_deliverable: true,
  };
};

/**
 * Fetch home screen payload with rich collections and dual-casing support
 */
export const getHomeScreenData = async (storeId, deliveryType = null) => {
  const categoriesList = await custRepo.getCategories();
  const bannersList = await custRepo.getBanners();
  const rawProducts = await custRepo.findProducts({ storeId, limit: 300 });

  let allProducts = rawProducts || [];

  // Filter products by deliveryType if specified
  if (deliveryType && deliveryType !== 'all') {
    const isExpress = deliveryType === 'express';
    const isTomorrow = ['tomorrow', 'tomorrow_morning', 'tomorrow_evening'].includes(deliveryType);

    allProducts = allProducts.filter(p => {
      const options = p.deliveryOptions || p.delivery_options || [];
      const expressStock = Number(p.expressStockQty ?? p.express_stock_qty ?? 0);
      const scheduledStock = Number(p.scheduledStockQty ?? p.scheduled_stock_qty ?? 0);

      if (isExpress) {
        return options.includes('express') && expressStock > 0;
      }
      if (isTomorrow) {
        const supportsTomorrow = options.includes('tomorrow_morning') || 
                                 options.includes('tomorrow_evening') || 
                                 options.includes('tomorrow');
        return supportsTomorrow && scheduledStock > 0;
      }
      return (expressStock > 0 || scheduledStock > 0);
    });
  } else {
    // Only include products with active inventory
    allProducts = allProducts.filter(p => {
      const expressStock = Number(p.expressStockQty ?? p.express_stock_qty ?? 0);
      const scheduledStock = Number(p.scheduledStockQty ?? p.scheduled_stock_qty ?? 0);
      const totalStock = Number(p.stockQuantity ?? p.stock_quantity ?? 0);
      return expressStock > 0 || scheduledStock > 0 || totalStock > 0;
    });
  }

  // Group products into home screen collections based strictly on genuine flags
  const featured = allProducts.filter(p => p.isFeatured || p.is_featured);
  const deals = allProducts.filter(p => p.isDeal || p.is_deal);
  const flashSale = allProducts.filter(p => p.isFlashSale || p.is_flash_sale);
  const trending = allProducts.filter(p => p.isTrending || p.is_trending);
  const exclusive = allProducts.filter(p => p.isExclusive || p.is_exclusive);
  const newLaunch = allProducts.filter(p => p.isNewLaunch || p.is_new_launch);
  const frozen = allProducts.filter(p => p.isFrozen || p.is_frozen);

  const allSubCats = await db.select({ id: subCategories.id, categoryId: subCategories.categoryId }).from(subCategories);
  const subToCatMap = new Map(allSubCats.map(s => [s.id, s.categoryId]));

  // Build dynamic category sections with their products
  const categorySections = categoriesList.map(cat => {
    const catProducts = allProducts.filter(p => {
      const pCatId = subToCatMap.get(p.subCategoryId || p.sub_category_id) || p.subCategory?.categoryId || p.subCategory?.category_id || p.sub_category?.categoryId || p.sub_category?.category_id || p.subCategory?.category?.id || p.sub_category?.category?.id;
      return pCatId === cat.id;
    });
    return {
      id: cat.id,
      title: cat.name,
      products: catProducts
    };
  }).filter(sec => sec.products.length > 0);

  // Filter categories to ONLY those that actually have products in this store with available stock
  const storeCategoryIds = new Set(categorySections.map(sec => sec.id));
  const hasInStockProducts = allProducts && allProducts.length > 0;
  const activeCategories = hasInStockProducts ? categoriesList.filter(cat => storeCategoryIds.has(cat.id)) : [];

  return {
    banners: hasInStockProducts ? bannersList : [],
    categories: activeCategories,
    featuredProducts: featured,
    featured_products: featured,
    todaysDeals: deals,
    todays_deals: deals,
    flashSale: flashSale,
    flash_sale: flashSale,
    trendingProducts: trending,
    trending_products: trending,
    exclusiveOffers: exclusive,
    exclusive_offers: exclusive,
    newLaunch: newLaunch,
    new_launch: newLaunch,
    frozenProducts: frozen,
    frozen_products: frozen,
    categorySections,
    category_sections: categorySections,
    sections: categorySections
  };
};

/**
 * Validate Cart items against live DB stock and prices
 */
export const validateCartItems = async (items, storeId = null, requestedDeliveryType = null) => {
  if (!items || !Array.isArray(items) || items.length === 0) {
    return {
      is_valid: true,
      has_changes: false,
      hasChanges: false,
      changes: { removed: [], priceChanged: [], outOfStock: [] },
      items: [],
      subtotal: 0,
      total: 0
    };
  }

  const variantIds = items.map(i => i.variant_id || i.variantId || i.variant?.id).filter(Boolean);
  const directProductIds = items.map(i => i.product_id || i.productId || i.id).filter(Boolean);

  const dbVariants = await custRepo.getVariantsByIds(variantIds);
  const variantMap = new Map(dbVariants.map(v => [v.id, v]));

  // Collect all product IDs (both direct and from variant parent relations)
  const allProductIds = Array.from(new Set([
    ...directProductIds,
    ...dbVariants.map(v => v.productId).filter(Boolean)
  ]));

  const dbProducts = await custRepo.getProductsByIds(allProductIds);
  const productMap = new Map(dbProducts.map(p => [p.id, p]));

  let isValid = true;
  let total = 0;
  const validatedItems = [];
  const removed = [];
  const priceChanged = [];
  const outOfStock = [];

  for (const item of items) {
    const vId = item.variant_id || item.variantId || item.variant?.id;
    const variant = vId ? variantMap.get(vId) : null;
    const pId = item.product_id || item.productId || item.id || variant?.productId;
    const product = pId ? productMap.get(pId) : null;

    if (!product || !product.isActive) {
      isValid = false;
      removed.push({ ...item, reason: 'Item is no longer available' });
      validatedItems.push({
        ...item,
        is_available: false,
        error: 'Item is no longer available'
      });
      continue;
    }

    // Cross-store validation: if product has a specific storeId and doesn't match
    let activeProduct = product;
    if (storeId && activeProduct.storeId && activeProduct.storeId !== storeId) {
      // Intelligently check if target store has the identical product by name
      const matchingProduct = await db.query.products.findFirst({
        where: and(
          eq(products.storeId, storeId),
          eq(products.name, activeProduct.name),
          eq(products.isActive, true)
        )
      });
      if (matchingProduct) {
        activeProduct = matchingProduct;
      } else {
        isValid = false;
        removed.push({ ...item, reason: 'Item not available at this store location' });
        validatedItems.push({
          ...item,
          is_available: false,
          error: 'Item not available at this store location'
        });
        continue;
      }
    }

    // Stock check at product level: check total stock or slot-specific stock
    const expressStock = Number(activeProduct.expressStockQty ?? activeProduct.express_stock_qty ?? 0);
    const scheduledStock = Number(activeProduct.scheduledStockQty ?? activeProduct.scheduled_stock_qty ?? 0);
    const baseStock = Number(activeProduct.stockQuantity ?? activeProduct.stock_quantity ?? 0);
    const availableStock = Math.max(baseStock, expressStock + scheduledStock, expressStock, scheduledStock);
    const requestedQty = Number(item.quantity) || 1;
    const isOutOfStock = availableStock < requestedQty;

    if (isOutOfStock) {
      isValid = false;
      outOfStock.push({ ...item, availableStock, requestedQty });
    }

    // Delivery Slot Check (if deliveryType requested)
    if (requestedDeliveryType) {
      const vSlots = Array.isArray(variant?.deliveryInfo) ? variant.deliveryInfo : (Array.isArray(variant?.delivery_info) ? variant.delivery_info : []);
      const pSlots = Array.isArray(activeProduct.deliveryOptions) ? activeProduct.deliveryOptions : (Array.isArray(activeProduct.delivery_options) ? activeProduct.delivery_options : []);
      const availableSlots = vSlots.length > 0 ? vSlots : pSlots;
      
      let supportsRequestedSlot = false;
      if (requestedDeliveryType === 'express' && availableSlots.includes('express')) {
        supportsRequestedSlot = true;
      } else if (requestedDeliveryType.startsWith('tomorrow')) {
        // any 'tomorrow' type slot requested, check if it matches a valid 'tomorrow' type slot on the item
        if (requestedDeliveryType === 'tomorrow' && (availableSlots.includes('tomorrow_morning') || availableSlots.includes('tomorrow_evening') || availableSlots.includes('tomorrow'))) {
          supportsRequestedSlot = true;
        } else if (availableSlots.includes(requestedDeliveryType) || availableSlots.includes('tomorrow')) {
          supportsRequestedSlot = true;
        }
      }

      if (!supportsRequestedSlot && availableSlots.length > 0) {
        isValid = false;
        removed.push({ ...item, reason: `Item is not available for ${requestedDeliveryType.replace('_', ' ')} delivery` });
        validatedItems.push({
          ...item,
          is_available: false,
          error: `Item is not available for ${requestedDeliveryType.replace('_', ' ')} delivery`
        });
        continue;
      }
    }

    // Pricing: variant price overrides product price if present
    const rawPrice = variant
      ? (variant.discountPrice || variant.discount_price || variant.price)
      : (activeProduct.discountPrice || activeProduct.discount_price || activeProduct.price);
    const price = Number(rawPrice || 0);

    const oldPrice = Number(item.price);
    if (oldPrice && Math.abs(oldPrice - price) > 0.01) {
      priceChanged.push({ ...item, oldPrice, newPrice: price });
    }

    total += price * requestedQty;

    validatedItems.push({
      ...item,
      productId: activeProduct.id,
      storeId: activeProduct.storeId,
      name: item.name || variant?.name || activeProduct.name,
      price,
      available_stock: availableStock,
      is_available: !isOutOfStock,
      error: isOutOfStock ? `Only ${availableStock} units available` : null
    });
  }

  const hasChanges = removed.length > 0 || priceChanged.length > 0 || outOfStock.length > 0;

  return {
    is_valid: isValid,
    has_changes: hasChanges,
    hasChanges,
    changes: {
      removed,
      priceChanged,
      outOfStock
    },
    items: validatedItems,
    subtotal: total,
    total
  };
};

/**
 * Clear customer cart
 */
export const clearCart = async (userId) => {
  return await custRepo.clearUserCart(userId);
};

/**
 * Sync user cart items
 */
export const syncUserCart = async (userId, items) => {
  await custRepo.clearUserCart(userId);

  if (!items || !Array.isArray(items) || items.length === 0) {
    return [];
  }

  const defaultStoreId = '467cdcb1-8ba3-4efe-a478-54e678ee32cd';
  const rows = items
    .map(item => {
      const prodId = item.product_id || item.productId || item.id;
      if (!prodId) return null;
      return {
        userId,
        productId: prodId,
        storeId: item.store_id || item.storeId || defaultStoreId,
        variantId: item.variant_id || item.variantId || item.variant?.id || null,
        quantity: Math.max(1, Number(item.quantity) || 1),
        cutPreference: item.preferences?.cut || item.cutPreference || item.cut_preference || null,
        cleaningPreference: item.preferences?.cleaning || item.cleaningPreference || item.cleaning_preference || null
      };
    })
    .filter(Boolean);

  if (rows.length > 0) {
    await custRepo.insertCartItems(rows);
  }
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

  if (!store_id) {
    const err = new Error('store_id is required to place an order');
    err.status = 400;
    throw err;
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    const err = new Error('Order must contain at least one item');
    err.status = 400;
    throw err;
  }

  // 1. Live Validate Stock & Prices
  const requestedDeliveryType = orderData.delivery_type || orderData.deliveryType || 'express';
  const cartValidation = await validateCartItems(items, store_id, requestedDeliveryType);
  if (!cartValidation.is_valid) {
    const err = new Error('Some items in your cart are no longer available or do not support the selected delivery slot.');
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
      userId,
      storeId: store_id,
      addressId: address_id || null,
      deliveryType: orderData.delivery_type || orderData.deliveryType || 'express',
      deliverySlotId: delivery_slot_id || null,
      deliverySlot: orderData.delivery_slot || null,
      deliverySlotLabel: orderData.delivery_slot_label || orderData.delivery_slot || null,
      latitude: orderData.lat ? String(orderData.lat) : null,
      longitude: orderData.lng ? String(orderData.lng) : null,
      status: payment_method === 'cod' ? 'placed' : 'payment_pending',
      paymentStatus: 'unpaid',
      paymentMethod: payment_method,
      totalItemsPrice: String(subtotal),
      deliveryCharge: String(deliveryFee),
      gstAmount: String(orderData.gst_amount || 0),
      discountAmount: String(discountAmount),
      totalAmount: String(totalAmount),
      couponCode: coupon_code || null,
      couponId: orderData.coupon_id || null,
      customerNotes: notes || null,
      razorpayOrderId
    },
    cartValidation.items.map(i => ({
      storeId: store_id,
      name: i.name || 'Product Item',
      productId: i.productId || i.product_id || null,
      variantId: i.variant_id || i.variantId || null,
      quantity: Number(i.quantity) || 1,
      unitPrice: String(i.price || 0),
      totalPrice: String((Number(i.price || 0) * (Number(i.quantity) || 1)).toFixed(2))
    }))
  );

  // 6. Clear user cart (Immediate for COD, deferred for online payment until verified)
  if (payment_method === 'cod') {
    await custRepo.clearUserCart(userId);
  }

  // 7. Send notification (Immediate for COD, deferred for online payment until verified)
  if (payment_method === 'cod') {
    await notifService.sendToUser(
      userId,
      'Order Placed Successfully! 🎉',
      `Your order #${orderNumber} has been received.`,
      { type: 'order_placed', order_id: newOrder.id }
    );
  }

  const fullOrder = await custRepo.getCustomerOrderById(newOrder.id, userId);

  return {
    order: fullOrder || newOrder,
    order_id: newOrder.id,
    orderId: newOrder.id,
    razorpay_order_id: razorpayOrderId,
    razorpayOrderId: razorpayOrderId,
    razorpay_key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_ShPQJuXJZUJ1zT',
    key: process.env.RAZORPAY_KEY_ID || 'rzp_test_ShPQJuXJZUJ1zT',
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
