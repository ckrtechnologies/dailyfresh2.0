import { supabaseAdmin } from '../config/supabase.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { sendOrderConfirmation } from '../services/emailService.js';
import getRazorpay from '../config/razorpay.js';
import crypto from 'node:crypto';
import * as notificationService from '../services/notificationService.js';
import fs from 'fs';
import path from 'path';

/**
 * Haversine distance in km
 */
const haversine = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/**
 * Find the first store (ordered by proximity) that has sufficient stock
 * for ALL items in the cart.
 *
 * @param {string}   preferredStoreId - Store chosen at location pick
 * @param {Array}    items            - [{ product_id, quantity }]
 * @param {number}   lat              - Customer latitude
 * @param {number}   lng              - Customer longitude
 * @returns {{ store, products } | null}
 */
const findFulfillingStore = async (preferredStoreId, items, lat, lng) => {
  // Fetch all active stores
  const { data: stores } = await supabaseAdmin
    .from('stores')
    .select('id, name, latitude, longitude, delivery_radius_km')
    .eq('is_active', true);

  if (!stores?.length) return null;

  // Sort: preferred store first, then by distance if coords available
  const sorted = [...stores].sort((a, b) => {
    if (a.id === preferredStoreId) return -1;
    if (b.id === preferredStoreId) return 1;
    if (lat && lng && a.latitude && b.latitude) {
      return (
        haversine(lat, lng, parseFloat(a.latitude), parseFloat(a.longitude)) -
        haversine(lat, lng, parseFloat(b.latitude), parseFloat(b.longitude))
      );
    }
    return 0;
  });

  const productIds = items.map(i => i.product_id || i.id);

  for (const store of sorted) {
    // Fetch inventory for this store for the requested product IDs
    const { data: inventory } = await supabaseAdmin
      .from('products')
      .select('id, name, stock_quantity')
      .eq('store_id', store.id)
      .in('id', productIds);

    if (!inventory?.length) continue;

    // Check every cart item has enough stock in THIS store
    const canFulfill = items.every(cartItem => {
      const pId = cartItem.product_id || cartItem.id;
      const p = inventory.find(inv => inv.id === pId);
      return p && p.stock_quantity >= cartItem.quantity;
    });

    if (canFulfill) {
      return { store, products: inventory };
    }
  }

  return null; // No store can fulfil the order
};

export const placeOrder = async (req, res) => {
  const { 
    store_id,       // preferred store (from Redux location state)
    address_id, 
    items, 
    total_amount, 
    payment_method, 
    delivery_slot,
    subtotal,
    delivery_charge,
    gst_amount,
    lat,            // customer coords for fallback store ranking
    lng,
  } = req.body;

  try {
    // 1. Find the first store that can fulfil ALL items
    //    Checks preferred store first, then walks nearest stores by distance
    const fulfillment = await findFulfillingStore(store_id, items, lat, lng);

    if (!fulfillment) {
      return errorResponse(
        res,
        'Sorry, none of our stores have sufficient stock for your order at the moment. Please try again later.',
        400
      );
    }

    const { store, products: inventory } = fulfillment;
    const resolvedStoreId = store.id;
    const switchedStore = resolvedStoreId !== store_id;

    // Log if we switched stores for observability
    if (switchedStore) {
      console.info(`[Order] Preferred store ${store_id} insufficient stock. Switched to ${resolvedStoreId} (${store.name})`);
    }

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
    const randomStr = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `RN-${dateStr}-${randomStr}`;

    // 2. Razorpay Order Creation (if applicable)
    let razorpay_order_id = null;
    if (payment_method !== 'cod') {
      const options = {
        amount: Math.round(total_amount * 100), // amount in paise
        currency: "INR",
        receipt: orderNumber,
      };

      const razorpay = getRazorpay(); // instantiate here — env vars are guaranteed loaded
      const rzpOrder = await razorpay.orders.create(options);
      razorpay_order_id = rzpOrder.id;
    }

    // 3. Create Order in DB
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert([{
        order_number: orderNumber,
        user_id: req.user.id,
        store_id: resolvedStoreId,
        address_id: address_id || null,
        latitude: lat,
        longitude: lng,
        total_items_price: subtotal,
        delivery_charge: delivery_charge || 0,
        gst_amount: gst_amount || 0,
        total_amount,
        discount_amount: req.body.discount_amount || 0,
        coupon_id: req.body.coupon_id || null,
        payment_method: payment_method === 'razorpay' ? 'upi' : payment_method,
        payment_status: 'unpaid',
        status: 'pending',
        delivery_slot,
        razorpay_order_id,
      }])
      .select()
      .single();

    if (orderError) {
      console.error('[Order Error] DB Insertion failed:', JSON.stringify(orderError, null, 2));
      return errorResponse(res, `Order creation failed: ${orderError.message}`, 400, orderError);
    }

    // Increment coupon used_count if applied
    if (req.body.coupon_id) {
      await supabaseAdmin.rpc('increment_coupon_usage', { coupon_id_param: req.body.coupon_id });
      // If RPC is missing, fallback to standard update
      await supabaseAdmin
        .from('coupons')
        .update({ used_count: supabaseAdmin.rpc('increment_val', { x: 1 }) }) // Note: Supabase increment pattern
        .eq('id', req.body.coupon_id);
    }

    // 4. Create Order Items
    const orderItems = items.map(it => ({
      order_id: order.id,
      store_id: resolvedStoreId,
      product_id: it.product_id || it.id,
      name: it.name || 'Product',           // schema column: name
      quantity: it.quantity,
      unit_price: it.price,                 // schema column: unit_price
      total_price: it.price * it.quantity,
      preferences: {                         // schema column: preferences JSONB
        cut: it.cut_preference || it.cutPreference || null,
        cleaning: it.cleaning_preference || it.cleaningPreference || null,
      },
    }));

    const { error: itemsError } = await supabaseAdmin.from('order_items').insert(orderItems);
    
    if (itemsError) {
      console.error('[Order Error] Items insertion failed:', itemsError);
      // If items fail, we should probably delete the order to prevent orphan orders
      await supabaseAdmin.from('orders').delete().eq('id', order.id);
      return errorResponse(res, 'Failed to process order items', 500, itemsError);
    }

    console.log(`[Order Success] Order #${order.order_number} created with ${orderItems.length} items`);
    
    // 5. If COD, decrement stock immediately and send notification
    if (payment_method === 'cod') {
      try {
        for (const item of orderItems) {
          const { data: product } = await supabaseAdmin.from('products').select('stock_quantity').eq('id', item.product_id).single();
          if (product) {
            const newStock = Math.max(0, (product.stock_quantity || 0) - item.quantity);
            await supabaseAdmin.from('products').update({ stock_quantity: newStock }).eq('id', item.product_id);
          }
        }
        console.log('[Order COD] Stock decremented successfully');

        // Send Initial Notification for COD
        await notificationService.sendToUser(
          req.user.id,
          'Order Received! 🛍️',
          `Your order #${order.order_number} has been placed successfully.`,
          { type: 'order_update', order_id: order.id }
        );

        // Notify Store Manager
        const { data: storeInfo } = await supabaseAdmin
          .from('stores')
          .select('manager_user_id')
          .eq('id', resolvedStoreId)
          .single();

        if (storeInfo?.manager_user_id) {
          await notificationService.sendToUser(
            storeInfo.manager_user_id,
            'New Order Received! 📦',
            `Order #${order.order_number} has been assigned to your store.`,
            { type: 'new_order', order_id: order.id }
          );
        }
      } catch (err) {
        console.error('[Order COD Error] Stock decrement or notification failed:', err);
      }
    }

    // 7. Success Response
    return successResponse(res, { 
      order_id: order.id,
      razorpay_order_id,
      total_amount,
      store_id: resolvedStoreId,
      store_name: store.name,
      // Let the app know if the order was silently switched to a different store
      switched_store: switchedStore,
    }, 'Order placed successfully', 201);

  } catch (error) {
    console.error('Order error:', error);
    return errorResponse(res, `Order placement failed: ${error.description || error.message || 'Unknown error'}`, 500, error);
  }
};

/**
 * Verify Razorpay Payment
 */
export const verifyPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, order_id } = req.body;

  try {
    const rzpSecret = process.env.RAZORPAY_KEY_SECRET;
    if (!rzpSecret) {
      console.error('[Payment Error] RAZORPAY_KEY_SECRET is missing in environment!');
      return errorResponse(res, 'Payment system configuration error', 500);
    }
    console.log('[Payment] Payload received:', { razorpay_order_id, razorpay_payment_id, order_id });

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !order_id) {
       console.error('[Payment Error] Incomplete Payload:', { 
         razorpay_order_id: !!razorpay_order_id, 
         razorpay_payment_id: !!razorpay_payment_id, 
         razorpay_signature: !!razorpay_signature, 
         order_id: !!order_id 
       });
       return errorResponse(res, 'Incomplete payment information', 400);
    }

    // 1. Verify Signature
    const secretStr = String(rzpSecret).trim();
    const rzpOrderIdStr = String(razorpay_order_id).trim();
    const rzpPaymentIdStr = String(razorpay_payment_id).trim();
    const rzpSignatureStr = String(razorpay_signature).trim();
    
    const generated_signature = crypto
      .createHmac("sha256", secretStr)
      .update(rzpOrderIdStr + "|" + rzpPaymentIdStr)
      .digest("hex");

    console.log('[Payment Debug] Signature check:', {
      generated_start: generated_signature.substring(0, 5),
      received_start: rzpSignatureStr.substring(0, 5),
      match: generated_signature === rzpSignatureStr
    });

    if (generated_signature !== rzpSignatureStr) {
      console.error('[Payment Error] Signature mismatch. Generated:', generated_signature, 'Received:', rzpSignatureStr);
      return errorResponse(res, 'Invalid payment signature. Verification failed.', 400);
    }

    console.log('[Payment] Signature verified. Updating order...');

    // 2. Update Order
    const { data: orders, error: updateError } = await supabaseAdmin
      .from('orders')
      .update({
        payment_status: 'paid',
        razorpay_payment_id: razorpay_payment_id,
        status: 'pending'
      })
      .eq('id', order_id)
      .select('*');

    if (updateError) {
      console.error('[Payment Error] DB Update failed:', updateError);
      return errorResponse(res, 'Failed to confirm order in database', 500, updateError);
    }

    if (!orders || orders.length === 0) {
      console.error('[Payment Error] Order not found for update:', order_id);
      return errorResponse(res, 'Order record not found', 404);
    }

    const order = orders[0];
    console.log('[Payment] Order updated successfully. Sending response to UI...');

    // 3. Return Success to UI Immediately
    // We sanitize to avoid circular refs
    const sanitizedOrder = {
      id: order.id,
      order_number: order.order_number,
      status: order.status,
      payment_status: order.payment_status
    };
    
    successResponse(res, { order: sanitizedOrder }, 'Payment verified');

    // 4. Background Tasks (Stock & Notifications)
    // We don't await these to ensure the response is sent immediately
    (async () => {
      try {
        console.log('[Payment Background] Processing stock...');
        
        const { data: items, error: itemsError } = await supabaseAdmin
          .from('order_items')
          .select('product_id, quantity, name')
          .eq('order_id', order_id);

        if (itemsError) {
          console.error('[Payment Background] Failed to fetch order items for stock decrement:', itemsError);
        } else if (items && items.length > 0) {
          console.log(`[Payment Background] Found ${items.length} items. Decrementing stock...`);
          for (const item of items) {
            if (item.product_id) {
              console.log(`[Payment Background] Decrementing stock for product ${item.product_id} by ${item.quantity}`);
              // 1. Fetch current stock
              const { data: product } = await supabaseAdmin
                .from('products')
                .select('stock_quantity')
                .eq('id', item.product_id)
                .single();
              
              if (product) {
                // 2. Calculate and update new stock
                const newStock = Math.max(0, (product.stock_quantity || 0) - item.quantity);
                await supabaseAdmin
                  .from('products')
                  .update({ stock_quantity: newStock })
                  .eq('id', item.product_id);
              }
            }
          }
        } else {
          console.warn('[Payment Background] No items found for order:', order_id);
        }
        
        console.log('[Payment Background] Sending notifications...');
        await notificationService.sendToUser(
          order.user_id,
          'Order Confirmed! 🛍️',
          `Your order #${order.order_number} has been received.`,
          { type: 'order_update', order_id: order.id }
        );

        // Notify Store Manager
        if (order.store_id) {
          const { data: storeInfo } = await supabaseAdmin
            .from('stores')
            .select('manager_user_id')
            .eq('id', order.store_id)
            .single();

          if (storeInfo?.manager_user_id) {
            await notificationService.sendToUser(
              storeInfo.manager_user_id,
              'New Paid Order! 💰',
              `Order #${order.order_number} has been paid and assigned to your store.`,
              { type: 'new_order', order_id: order.id }
            );
          }
        }
      } catch (bgErr) {
        console.error('[Payment Background Error]', bgErr);
      }
    })();

    return; // Function ends here

  } catch (error) {
    console.error('-------------------------------------------');
    console.error('[Payment Critical Error]', error);
    if (error.response?.data) {
      console.error('[Payment Response Error]', JSON.stringify(error.response.data, null, 2));
    }
    console.error('-------------------------------------------');
    return errorResponse(res, 'Payment verification failed', 500, { 
      error: error.message,
      stack: error.stack,
      details: error.response?.data
    });
  }
};

/**
 * Get Customer Order History
 */
export const getMyOrders = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        store:stores(name),
        delivery_address:addresses(*),
        items:order_items(
          *,
          product:products!fk_order_items_product(name, image_url)
        )
      `)
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[GetMyOrders Error]', JSON.stringify(error, null, 2));
      return errorResponse(res, 'Failed to fetch orders', 400, error);
    }
    return successResponse(res, { orders: data });
  } catch (error) {
    return errorResponse(res, 'Internal server error', 500, error);
  }
};

/**
 * Get Specific Order Details
 */
export const getOrderById = async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        store:stores(*),
        delivery_address:addresses(*),
        items:order_items(
          *,
          product:products!fk_order_items_product(*)
        )
      `)
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();

    if (error) return errorResponse(res, 'Order not found', 404, error);
    return successResponse(res, { order: data });
  } catch (error) {
    return errorResponse(res, 'Internal server error', 500, error);
  }
};
