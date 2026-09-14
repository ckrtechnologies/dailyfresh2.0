import * as adminRepo from './repository.js';
import * as adminService from './service.js';
import { successResponse, errorResponse } from '../../utils/response.js';
import { deleteFileFromDisk, deleteFilesFromDisk } from '../../utils/fileCleaner.js';
import getRazorpay from '../../config/razorpay.js';
import bcrypt from 'bcryptjs';

// --- NORMALIZATION HELPERS ---
export const formatAssetUrl = (filename, req = null) => {
  if (!filename) return null;
  if (filename.startsWith("http://") || filename.startsWith("https://")) return filename;
  
  const cleanName = filename.startsWith("/uploads/") ? filename.slice(9) : (filename.startsWith("uploads/") ? filename.slice(8) : filename.replace(/^\//, ""));
  
  if (process.env.CDN_BASE_URL) {
    const cdn = process.env.CDN_BASE_URL.replace(/\/+$/, "");
    return cdn.endsWith("/uploads") ? `${cdn}/${cleanName}` : `${cdn}/uploads/${cleanName}`;
  }
  
  if (process.env.API_URL) {
    const apiUrl = process.env.API_URL.replace(/\/+$/, "");
    return `${apiUrl}/uploads/${cleanName}`;
  }

  if (req) {
    const protocol = req.protocol || "http";
    const host = req.get ? req.get("host") : (req.headers?.host || "localhost:4002");
    return `${protocol}://${host}/uploads/${cleanName}`;
  }

  return `/uploads/${cleanName}`;
};

const getUploadedImageUrl = (req, fieldname = "image") => {
  if (req.files && Array.isArray(req.files)) {
    const file = req.files.find(f => f.fieldname === fieldname || f.fieldname === "file" || f.fieldname === "image_url");
    if (file) return formatAssetUrl(file.filename, req);
  }
  if (req.file) return formatAssetUrl(req.file.filename, req);
  return null;
};

const mapStorePayload = (body = {}) => {
  const data = {};

  // 1. Basic text fields (snake_case takes precedence)
  const textFields = [
    ['name', 'name'],
    ['description', 'description'],
    ['address', 'address'],
    ['city', 'city'],
    ['state', 'state'],
    ['pincode', 'pincode'],
    ['phone', 'phone'],
    ['email', 'email'],
    ['logo_url', 'logoUrl'],
    ['cover_url', 'coverUrl'],
    ['opening_time', 'openingTime'],
    ['closing_time', 'closingTime']
  ];

  for (const [snake, camel] of textFields) {
    if (body[snake] !== undefined && body[snake] !== null) {
      data[camel] = String(body[snake]).trim();
    } else if (body[camel] !== undefined && body[camel] !== null) {
      data[camel] = String(body[camel]).trim();
    }
  }

  // 2. Manager User ID (handles null or unassigned)
  if (body.manager_user_id !== undefined) {
    data.managerUserId = body.manager_user_id && body.manager_user_id !== '' && body.manager_user_id !== 'Unassigned' 
      ? body.manager_user_id 
      : null;
  } else if (body.managerUserId !== undefined) {
    data.managerUserId = body.managerUserId && body.managerUserId !== '' && body.managerUserId !== 'Unassigned' 
      ? body.managerUserId 
      : null;
  }

  // 3. Delivery Radius (KM) - numeric(5, 2)
  const radVal = body.delivery_radius_km !== undefined ? body.delivery_radius_km : body.deliveryRadiusKm;
  if (radVal !== undefined && radVal !== null && radVal !== '') {
    const num = parseFloat(radVal);
    if (!isNaN(num)) data.deliveryRadiusKm = num.toFixed(2);
  }

  // 4. Coordinates - numeric(10, 7)
  const latVal = body.latitude !== undefined ? body.latitude : body.lat;
  if (latVal !== undefined && latVal !== null && latVal !== '') {
    const num = parseFloat(latVal);
    if (!isNaN(num)) data.latitude = num.toFixed(7);
  }

  const lngVal = body.longitude !== undefined ? body.longitude : body.lng;
  if (lngVal !== undefined && lngVal !== null && lngVal !== '') {
    const num = parseFloat(lngVal);
    if (!isNaN(num)) data.longitude = num.toFixed(7);
  }

  // 5. Serviceable Pincodes - text[]
  const pinsVal = body.serviceable_pincodes !== undefined ? body.serviceable_pincodes : body.serviceablePincodes;
  if (pinsVal !== undefined) {
    let pins = pinsVal;
    if (typeof pins === 'string') {
      try { pins = JSON.parse(pins); } catch { pins = pins.split(/[\s,]+/).filter(Boolean); }
    }
    data.serviceablePincodes = Array.isArray(pins) 
      ? pins.map(p => String(p).trim()).filter(p => p.length === 6)
      : [];
  }

  // 6. Active Status Boolean
  if (body.is_active !== undefined) {
    data.isActive = body.is_active === true || body.is_active === 'true' || body.is_active === 1 || body.is_active === '1';
  } else if (body.isActive !== undefined) {
    data.isActive = body.isActive === true || body.isActive === 'true' || body.isActive === 1 || body.isActive === '1';
  }

  return data;
};

const mapCategoryPayload = (req) => {
  const body = req.body || {};
  const data = {};
  const imgUrl = getUploadedImageUrl(req, 'image') || body.image_url || body.imageUrl;
  if (imgUrl) data.imageUrl = imgUrl;

  if (body.name !== undefined) data.name = String(body.name).trim();
  if (body.slug !== undefined) data.slug = String(body.slug).trim();
  if (body.description !== undefined) data.description = body.description;

  const orderVal = body.display_order !== undefined ? body.display_order : body.displayOrder;
  if (orderVal !== undefined && orderVal !== null && orderVal !== '') {
    data.displayOrder = Number(orderVal);
  }

  if (body.is_active !== undefined) {
    data.isActive = body.is_active === true || body.is_active === 'true' || body.is_active === 1 || body.is_active === '1';
  } else if (body.isActive !== undefined) {
    data.isActive = body.isActive === true || body.isActive === 'true' || body.isActive === 1 || body.isActive === '1';
  }

  return data;
};

const mapSubCategoryPayload = (req) => {
  const body = req.body || {};
  const data = {};
  const imgUrl = getUploadedImageUrl(req, 'image') || body.image_url || body.imageUrl;
  if (imgUrl) data.imageUrl = imgUrl;

  const catId = body.category_id !== undefined ? body.category_id : body.categoryId;
  if (catId !== undefined && catId !== null && catId !== '') {
    data.categoryId = catId;
  }

  if (body.name !== undefined) data.name = String(body.name).trim();
  if (body.slug !== undefined) data.slug = String(body.slug).trim();
  if (body.description !== undefined) data.description = body.description;

  const orderVal = body.display_order !== undefined ? body.display_order : body.displayOrder;
  if (orderVal !== undefined && orderVal !== null && orderVal !== '') {
    data.displayOrder = Number(orderVal);
  }

  if (body.is_active !== undefined) {
    data.isActive = body.is_active === true || body.is_active === 'true' || body.is_active === 1 || body.is_active === '1';
  } else if (body.isActive !== undefined) {
    data.isActive = body.isActive === true || body.isActive === 'true' || body.isActive === 1 || body.isActive === '1';
  }

  return data;
};

const mapProductPayload = (req) => {
  const body = req.body || {};
  const data = {};
  const imgUrl = getUploadedImageUrl(req, 'image') || body.image_url || body.imageUrl;
  if (imgUrl) data.imageUrl = imgUrl;

  // Explicitly map foreign keys with snake_case taking priority over stale camelCase
  if (body.store_id !== undefined && body.store_id !== null && body.store_id !== '') {
    data.storeId = body.store_id;
  } else if (body.storeId) {
    data.storeId = body.storeId;
  }

  if (body.sub_category_id !== undefined && body.sub_category_id !== null && body.sub_category_id !== '') {
    data.subCategoryId = body.sub_category_id;
  } else if (body.subCategoryId) {
    data.subCategoryId = body.subCategoryId;
  }

  // Explicitly handle all boolean flags, giving snake_case precedence over stale camelCase
  const booleanFlags = [
    ['is_active', 'isActive'],
    ['is_featured', 'isFeatured'],
    ['is_deal', 'isDeal'],
    ['is_flash_sale', 'isFlashSale'],
    ['is_exclusive', 'isExclusive'],
    ['is_trending', 'isTrending'],
    ['is_frozen', 'isFrozen'],
    ['is_new_launch', 'isNewLaunch']
  ];
  for (const [snake, camel] of booleanFlags) {
    if (body[snake] !== undefined) {
      data[camel] = body[snake] === true || body[snake] === 'true' || body[snake] === 1 || body[snake] === '1';
    } else if (body[camel] !== undefined) {
      data[camel] = body[camel] === true || body[camel] === 'true' || body[camel] === 1 || body[camel] === '1';
    }
  }

  // Explicitly handle delivery options
  if (body.delivery_options !== undefined) {
    let opts = body.delivery_options;
    if (typeof opts === 'string') {
      try { opts = JSON.parse(opts); } catch { opts = [opts]; }
    }
    data.deliveryOptions = Array.isArray(opts) ? opts : [];
  } else if (body.deliveryOptions !== undefined) {
    let opts = body.deliveryOptions;
    if (typeof opts === 'string') {
      try { opts = JSON.parse(opts); } catch { opts = [opts]; }
    }
    data.deliveryOptions = Array.isArray(opts) ? opts : [];
  }

  if (body.name !== undefined) data.name = String(body.name);
  if (body.slug !== undefined) data.slug = String(body.slug);
  if (body.description !== undefined) data.description = body.description;
  if (body.cooking_guide !== undefined) data.cookingGuide = body.cooking_guide;
  else if (body.cookingGuide !== undefined) data.cookingGuide = body.cookingGuide;

  if (body.sku !== undefined) data.sku = body.sku || null;

  if (body.price !== undefined && body.price !== null && body.price !== '') {
    data.price = String(body.price);
  }

  if (body.discount_price !== undefined) {
    data.discountPrice = (body.discount_price !== null && body.discount_price !== '') ? String(body.discount_price) : null;
  } else if (body.discountPrice !== undefined) {
    data.discountPrice = (body.discountPrice !== null && body.discountPrice !== '') ? String(body.discountPrice) : null;
  }

  if (body.weight_unit !== undefined) data.weightUnit = body.weight_unit;
  else if (body.weightUnit !== undefined) data.weightUnit = body.weightUnit;

  // Stock quantities: scheduled_stock_qty, express_stock_qty, stock_quantity
  // Give snake_case explicit precedence, and handle 0 correctly
  if (body.express_stock_qty !== undefined && body.express_stock_qty !== null && body.express_stock_qty !== '') {
    data.expressStockQty = Number(body.express_stock_qty);
  } else if (body.expressStockQty !== undefined && body.expressStockQty !== null && body.expressStockQty !== '') {
    data.expressStockQty = Number(body.expressStockQty);
  }

  if (body.scheduled_stock_qty !== undefined && body.scheduled_stock_qty !== null && body.scheduled_stock_qty !== '') {
    data.scheduledStockQty = Number(body.scheduled_stock_qty);
  } else if (body.scheduledStockQty !== undefined && body.scheduledStockQty !== null && body.scheduledStockQty !== '') {
    data.scheduledStockQty = Number(body.scheduledStockQty);
  }

  if (body.stock_quantity !== undefined && body.stock_quantity !== null && body.stock_quantity !== '') {
    data.stockQuantity = Number(body.stock_quantity);
  } else if (body.stockQuantity !== undefined && body.stockQuantity !== null && body.stockQuantity !== '') {
    data.stockQuantity = Number(body.stockQuantity);
  } else if (data.expressStockQty !== undefined || data.scheduledStockQty !== undefined) {
    data.stockQuantity = (Number(data.expressStockQty) || 0) + (Number(data.scheduledStockQty) || 0);
  }

  // Arrays and JSON
  if (body.cut_options !== undefined) {
    let cuts = body.cut_options;
    if (typeof cuts === 'string') {
      try { cuts = JSON.parse(cuts); } catch { cuts = [cuts]; }
    }
    data.cutOptions = Array.isArray(cuts) ? cuts : [];
  } else if (body.cutOptions !== undefined) {
    let cuts = body.cutOptions;
    if (typeof cuts === 'string') {
      try { cuts = JSON.parse(cuts); } catch { cuts = [cuts]; }
    }
    data.cutOptions = Array.isArray(cuts) ? cuts : [];
  }

  if (body.cleaning_options !== undefined) {
    let cleans = body.cleaning_options;
    if (typeof cleans === 'string') {
      try { cleans = JSON.parse(cleans); } catch { cleans = [cleans]; }
    }
    data.cleaningOptions = Array.isArray(cleans) ? cleans : [];
  } else if (body.cleaningOptions !== undefined) {
    let cleans = body.cleaningOptions;
    if (typeof cleans === 'string') {
      try { cleans = JSON.parse(cleans); } catch { cleans = [cleans]; }
    }
    data.cleaningOptions = Array.isArray(cleans) ? cleans : [];
  }

  if (body.images !== undefined) {
    let imgs = body.images;
    if (typeof imgs === 'string') {
      try { imgs = JSON.parse(imgs); } catch { imgs = [imgs]; }
    }
    data.images = Array.isArray(imgs) ? imgs : [];
  }

  if (body.product_highlights !== undefined) {
    let hl = body.product_highlights;
    if (typeof hl === 'string') {
      try { hl = JSON.parse(hl); } catch {}
    }
    data.productHighlights = hl;
  } else if (body.productHighlights !== undefined) {
    let hl = body.productHighlights;
    if (typeof hl === 'string') {
      try { hl = JSON.parse(hl); } catch {}
    }
    data.productHighlights = hl;
  }

  let variants = body.variants;
  if (typeof variants === 'string') {
    try { variants = JSON.parse(variants); } catch { variants = []; }
  }
  if (Array.isArray(variants)) {
    variants = variants.map((v, idx) => {
      const vImg = req.files && Array.isArray(req.files) ? req.files.find(f => f.fieldname === `variant_image_${idx}`) : null;
      let delInfo = v.delivery_info || v.deliveryInfo;
      if (typeof delInfo === 'string') {
        try { delInfo = JSON.parse(delInfo); } catch { delInfo = delInfo.split(',').map(s => s.trim()); }
      }
      if (!Array.isArray(delInfo) || delInfo.length === 0) {
        delInfo = ['Tomorrow Morning'];
      }

      // Enforce that variant delivery options must be a subset of the product's delivery options
      if (Array.isArray(data.deliveryOptions) && data.deliveryOptions.length > 0) {
        const keyMap = {
          'Express Delivery': 'express',
          'Tomorrow Morning': 'tomorrow_morning',
          'Tomorrow Evening': 'tomorrow_evening',
          'Tomorrow': 'tomorrow'
        };
        delInfo = delInfo.filter(slot => {
          const key = keyMap[slot] || slot.toLowerCase().replace(' ', '_');
          return data.deliveryOptions.includes(key);
        });
      }
      
      return {
        id: v.id || undefined,
        name: v.name || '',
        description: v.description || null,
        price: (v.price !== undefined && v.price !== null && v.price !== '') ? String(v.price) : '0.00',
        discountPrice: (v.discount_price || v.discountPrice) ? String(v.discount_price || v.discountPrice) : null,
        weightText: v.weight_text || v.weightText || null,
        grossWeightText: v.gross_weight_text || v.grossWeightText || null,
        deliveryInfo: delInfo,
        displayOrder: v.display_order ?? v.displayOrder ?? idx,
        imageUrl: vImg ? formatAssetUrl(vImg.filename, req) : (v.image_url || v.imageUrl || null)
      };
    });
  }

  return { productData: data, variants };
};

const mapCouponPayload = (body = {}) => {
  const data = {};

  if (body.code !== undefined) data.code = String(body.code).trim();
  if (body.description !== undefined) data.description = body.description;

  const typeVal = body.discount_type !== undefined ? body.discount_type : body.discountType;
  if (typeVal !== undefined) data.discountType = typeVal;

  const valVal = body.discount_value !== undefined ? body.discount_value : body.discountValue;
  if (valVal !== undefined && valVal !== null && valVal !== '') data.discountValue = String(valVal);

  const minVal = body.min_order_amount !== undefined ? body.min_order_amount : body.minOrderAmount;
  if (minVal !== undefined && minVal !== null && minVal !== '') data.minOrderAmount = String(minVal);

  const maxVal = body.max_discount_amount !== undefined ? body.max_discount_amount : body.maxDiscountAmount;
  if (maxVal !== undefined && maxVal !== null && maxVal !== '') data.maxDiscountAmount = String(maxVal);

  const startVal = body.start_date !== undefined ? body.start_date : body.startDate;
  if (startVal) data.startDate = new Date(startVal);

  const endVal = body.end_date !== undefined ? body.end_date : body.endDate;
  if (endVal) data.endDate = new Date(endVal);

  const limitVal = body.usage_limit !== undefined ? body.usage_limit : body.usageLimit;
  if (limitVal !== undefined && limitVal !== null && limitVal !== '') data.usageLimit = Number(limitVal);

  if (body.is_active !== undefined) {
    data.isActive = body.is_active === true || body.is_active === 'true' || body.is_active === 1 || body.is_active === '1';
  } else if (body.isActive !== undefined) {
    data.isActive = body.isActive === true || body.isActive === 'true' || body.isActive === 1 || body.isActive === '1';
  }

  return data;
};

const mapBannerPayload = (req) => {
  const body = req.body || {};
  const data = {};
  const imgUrl = getUploadedImageUrl(req, 'image') || body.image_url || body.imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80';
  data.imageUrl = imgUrl;

  if (body.title !== undefined) data.title = String(body.title).trim();
  
  const linkVal = body.link_url !== undefined ? body.link_url : body.linkUrl;
  if (linkVal !== undefined) data.linkUrl = linkVal;

  if (body.placement !== undefined) data.placement = body.placement;

  const orderVal = body.display_order !== undefined ? body.display_order : body.displayOrder;
  if (orderVal !== undefined && orderVal !== null && orderVal !== '') data.displayOrder = Number(orderVal);

  if (body.is_active !== undefined) {
    data.isActive = body.is_active === true || body.is_active === 'true' || body.is_active === 1 || body.is_active === '1';
  } else if (body.isActive !== undefined) {
    data.isActive = body.isActive === true || body.isActive === 'true' || body.isActive === 1 || body.isActive === '1';
  }

  return data;
};

const mapDeliverySlotPayload = (body) => {
  const data = {};
  const mapping = {
    type: 'type',
    slot_name: 'slotName', slotName: 'slotName',
    start_time: 'startTime', startTime: 'startTime',
    end_time: 'endTime', endTime: 'endTime',
    display_order: 'displayOrder', displayOrder: 'displayOrder',
    is_active: 'isActive', isActive: 'isActive'
  };
  for (const [k, target] of Object.entries(mapping)) {
    if (body[k] !== undefined && body[k] !== null && body[k] !== '') {
      let v = body[k];
      if (target === 'displayOrder') v = Number(v);
      if (target === 'isActive') v = v === true || v === 'true' || v === '1' || v === 1;
      data[target] = v;
    }
  }
  return data;
};

// --- CONTROLLER HANDLERS ---

export const getDashboardStats = async (req, res) => {
  try {
    const { startDate, endDate, store_id, storeId } = req.query;
    const stats = await adminRepo.getDashboardMetrics({
      startDate,
      endDate,
      storeId: store_id || storeId
    });
    return successResponse(res, stats);
  } catch (error) {
    return errorResponse(res, 'Failed to fetch dashboard stats', 500, error.message);
  }
};

export const listOrders = async (req, res) => {
  const { limit, offset, page, pageSize, status, store_id, storeId, startDate, endDate, search, order_id, orderId, id } = req.query;
  try {
    const effLimit = pageSize ? Number(pageSize) : (limit ? Number(limit) : 50);
    const effOffset = page ? (Number(page) - 1) * effLimit : (offset ? Number(offset) : 0);

    const data = await adminRepo.listOrders({
      limit: effLimit,
      offset: effOffset,
      status,
      storeId: store_id || storeId,
      startDate,
      endDate,
      search,
      orderId: order_id || orderId || id
    });

    const formattedOrders = (data.orders || []).map(o => ({
      ...o,
      order_number: o.orderNumber,
      delivery_type: o.deliveryType,
      delivery_slot_label: o.deliverySlotLabel,
      total_amount: o.totalAmount,
      total_items_price: o.totalItemsPrice,
      delivery_charge: o.deliveryCharge,
      gst_amount: o.gstAmount,
      payment_status: o.paymentStatus || 'unpaid',
      payment_method: o.paymentMethod || 'cod',
      created_at: o.createdAt,
      customer: o.user ? {
        id: o.user.id,
        full_name: o.user.fullName,
        email: o.user.email,
        phone: o.user.phone
      } : null,
      rider: o.rider ? {
        id: o.rider.id,
        full_name: o.rider.fullName,
        phone: o.rider.phone,
        email: o.rider.email
      } : null
    }));

    return successResponse(res, { orders: formattedOrders, total: data.total });
  } catch (error) {
    return errorResponse(res, 'Failed to list orders', 500, error.message);
  }
};

export const updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status, rider_id, riderId } = req.body;
  if (!status) return errorResponse(res, 'Status is required', 400);

  try {
    const updated = await adminService.updateOrderStatusWorkflow(id, status, rider_id || riderId);
    return successResponse(res, { order: updated }, `Status updated to ${status}`);
  } catch (error) {
    return errorResponse(res, error.message, error.status || 500);
  }
};

export const refundOrder = async (req, res) => {
  const { id } = req.params;
  const { amount, reason = 'Admin initiated refund' } = req.body;

  try {
    const order = await adminRepo.getOrderById(id);
    if (!order) {
      return errorResponse(res, 'Order not found', 404);
    }

    if (order.paymentStatus === 'refunded') {
      return errorResponse(res, 'Order has already been refunded', 400);
    }

    const refundAmount = amount ? Number(amount) : Number(order.totalAmount);
    if (isNaN(refundAmount) || refundAmount <= 0) {
      return errorResponse(res, 'Invalid refund amount', 400);
    }

    let rpRefund = null;

    // If order has razorpay payment id, attempt refund via Razorpay API
    if (order.razorpayPaymentId) {
      try {
        const razorpay = getRazorpay();
        if (razorpay) {
          rpRefund = await razorpay.payments.refund(order.razorpayPaymentId, {
            amount: Math.round(refundAmount * 100), // Razorpay accepts amount in paisa
            notes: {
              order_id: String(order.id),
              order_number: String(order.orderNumber),
              reason: String(reason).substring(0, 100)
            }
          });
        }
      } catch (rpErr) {
        console.warn(`[REFUND] Razorpay refund error (${order.razorpayPaymentId}):`, rpErr.message);
        return errorResponse(res, `Razorpay refund failed: ${rpErr.error?.description || rpErr.message}`, 400);
      }
    }

    const updatedOrder = await adminRepo.updateOrderRefund(id, {
      refundAmount,
      reason
    });

    return successResponse(res, {
      order: updatedOrder,
      refund: rpRefund
    }, 'Order refunded successfully');
  } catch (error) {
    console.error('[ADMIN] Refund error:', error);
    return errorResponse(res, 'Failed to process refund', 500, error.message);
  }
};

export const listStores = async (req, res) => {
  try {
    const rawStores = await adminRepo.listStores();
    const stores = rawStores.map(s => ({
      ...s,
      manager_user_id: s.managerUserId,
      delivery_radius_km: s.deliveryRadiusKm,
      serviceable_pincodes: s.serviceablePincodes,
      opening_time: s.openingTime,
      closing_time: s.closingTime,
      logo_url: s.logoUrl,
      cover_url: s.coverUrl,
      is_active: s.isActive
    }));
    return successResponse(res, { stores });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const createStore = async (req, res) => {
  try {
    const payload = mapStorePayload(req.body);
    const store = await adminRepo.createStore(payload);
    return successResponse(res, { store }, 'Store created', 201);
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const updateStore = async (req, res) => {
  try {
    const payload = mapStorePayload(req.body);
    const store = await adminRepo.updateStore(req.params.id, payload);
    return successResponse(res, { store }, 'Store updated');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const deleteStore = async (req, res) => {
  try {
    const { id } = req.params;
    const deleteManager = req.query.delete_manager === 'true';

    const deps = await adminRepo.getStoreDependencies(id);
    if (!deps) {
      return errorResponse(res, 'Store not found', 404);
    }

    const blockingItems = [];
    if (deps.productCount > 0) {
      blockingItems.push(`${deps.productCount} product${deps.productCount > 1 ? 's' : ''}`);
    }
    if (deps.orderCount > 0) {
      blockingItems.push(`${deps.orderCount} order${deps.orderCount > 1 ? 's' : ''}`);
    }
    if (deps.riderCount > 0) {
      blockingItems.push(`${deps.riderCount} assigned rider${deps.riderCount > 1 ? 's' : ''}`);
    }

    if (blockingItems.length > 0) {
      const storeName = deps.store.name || 'This store';
      const reason = blockingItems.join(', ');
      return res.status(400).json({
        success: false,
        message: `Cannot delete store "${storeName}" because it is currently linked to ${reason}. To prevent data loss or broken orders, please delete or reassign these items first, or deactivate the store instead.`,
        data: {
          storeId: id,
          storeName,
          dependencies: {
            products: deps.productCount,
            orders: deps.orderCount,
            riders: deps.riderCount,
          },
          canDeactivate: true,
          isActive: deps.store.isActive,
        },
      });
    }

    await adminRepo.deleteStore(id, { deleteManager });
    return successResponse(res, null, 'Store deleted successfully');
  } catch (error) {
    return errorResponse(res, error.message, 500, error);
  }
};

export const listRiders = async (req, res) => {
  try {
    const { search, store_id, storeId, startDate, endDate, approval_status, is_online, limit, offset, pageSize, page } = req.query;
    const effLimit = pageSize ? Number(pageSize) : (limit ? Number(limit) : 100);
    const effOffset = page ? (Number(page) - 1) * effLimit : (offset ? Number(offset) : 0);

    const rawRiders = await adminRepo.listRiders({
      search,
      storeId: store_id || storeId,
      startDate,
      endDate,
      approvalStatus: approval_status,
      isOnline: is_online,
      limit: effLimit,
      offset: effOffset
    });
    const riders = rawRiders.map(r => ({
      ...r,
      user_id: r.userId,
      store_id: r.storeId,
      vehicle_type: r.vehicleType,
      vehicle_number: r.vehicleNumber,
      approval_status: r.approvalStatus,
      is_online: r.isOnline,
      user: r.profile ? {
        id: r.profile.id,
        full_name: r.profile.fullName,
        phone: r.profile.phone,
        email: r.profile.email
      } : null
    }));
    return successResponse(res, { riders });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const updateRiderStatus = async (req, res) => {
  try {
    const payload = {};
    if (req.body.is_online !== undefined) payload.isOnline = req.body.is_online === true || req.body.is_online === 'true';
    if (req.body.isOnline !== undefined) payload.isOnline = req.body.isOnline;
    if (req.body.approval_status !== undefined) payload.approvalStatus = req.body.approval_status;
    if (req.body.approvalStatus !== undefined) payload.approvalStatus = req.body.approvalStatus;
    if (req.body.store_id !== undefined) payload.assignedStoreId = req.body.store_id;
    if (req.body.assignedStoreId !== undefined) payload.assignedStoreId = req.body.assignedStoreId;

    const rider = await adminRepo.updateRiderStatus(req.params.riderId, payload);
    return successResponse(res, { rider }, 'Rider updated');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const approveRider = async (req, res) => {
  try {
    const rider = await adminRepo.updateRiderStatus(req.params.riderId, { approvalStatus: 'approved' });
    return successResponse(res, { rider }, 'Rider approved');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const listRiderDistanceLogs = async (req, res) => {
  try {
    const { search, store_id, storeId, startDate, endDate, limit, offset, pageSize, page } = req.query;
    const effLimit = pageSize ? Number(pageSize) : (limit ? Number(limit) : 50);
    const effOffset = page ? (Number(page) - 1) * effLimit : (offset ? Number(offset) : 0);

    const logs = await adminRepo.listRiderDistanceLogs({
      storeId: store_id || storeId,
      startDate,
      endDate,
      limit: effLimit,
      offset: effOffset
    });
    return successResponse(res, { logs });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const listStaff = async (req, res) => {
  try {
    const rawStaff = await adminRepo.listStaff();
    const staff = rawStaff.map(s => ({
      ...s,
      full_name: s.fullName,
      is_active: s.isActive
    }));
    return successResponse(res, { staff });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const onboardStaff = async (req, res) => {
  try {
    const newStaff = await adminService.onboardStaffMember(req.body);
    return successResponse(res, { staff: newStaff }, 'Staff onboarded successfully', 201);
  } catch (error) {
    return errorResponse(res, error.message, error.status || 500);
  }
};

export const deleteStaff = async (req, res) => {
  try {
    await adminRepo.deleteStaff(req.params.id);
    return successResponse(res, null, 'Staff deleted');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const listCustomers = async (req, res) => {
  try {
    const { search, store_id, storeId, startDate, endDate, limit, offset, pageSize, page } = req.query;
    const effLimit = pageSize ? Number(pageSize) : (limit ? Number(limit) : 50);
    const effOffset = page ? (Number(page) - 1) * effLimit : (offset ? Number(offset) : 0);
    const currentPage = page ? Number(page) : (Math.floor(effOffset / effLimit) + 1);

    const data = await adminRepo.listCustomers({
      search,
      storeId: store_id || storeId,
      startDate,
      endDate,
      limit: effLimit,
      offset: effOffset
    });
    const customers = data.customers.map(c => ({
      ...c,
      full_name: c.fullName,
      fullName: c.fullName,
      is_active: c.isActive,
      isActive: c.isActive,
      created_at: c.createdAt,
      createdAt: c.createdAt,
      updated_at: c.updatedAt,
      updatedAt: c.updatedAt
    }));
    return successResponse(res, {
      customers,
      total: Number(data.total),
      pagination: {
        page: currentPage,
        pageSize: effLimit,
        total: Number(data.total),
        totalPages: Math.ceil(Number(data.total) / effLimit) || 1
      }
    });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const createCustomer = async (req, res) => {
  try {
    const { full_name, fullName, email, phone, password, is_active, isActive } = req.body;
    const name = (full_name || fullName || '').trim();
    if (!name) {
      return errorResponse(res, 'Customer full name is required', 400);
    }
    if (!email || !email.trim()) {
      return errorResponse(res, 'Customer email is required', 400);
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await adminRepo.findProfileByEmail(cleanEmail);
    if (existing) {
      return errorResponse(res, 'A user with this email address already exists', 400);
    }

    const pass = password && password.trim() ? password.trim() : 'Customer@123';
    const passwordHash = await bcrypt.hash(pass, 10);
    const activeStatus = isActive !== undefined ? isActive : (is_active !== undefined ? is_active : true);

    const newCustomer = await adminRepo.createCustomer({
      fullName: name,
      email: cleanEmail,
      phone: phone && phone.trim() ? phone.trim() : null,
      passwordHash,
      isActive: Boolean(activeStatus),
      avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`
    });

    const normalized = {
      ...newCustomer,
      full_name: newCustomer.fullName,
      is_active: newCustomer.isActive,
      created_at: newCustomer.createdAt,
      updated_at: newCustomer.updatedAt
    };

    return successResponse(res, { customer: normalized }, 'Customer created successfully', 201);
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const getCustomerDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await adminRepo.getCustomerById(id);
    if (!customer) {
      return errorResponse(res, 'Customer not found', 404);
    }

    const [addresses, orders, stats] = await Promise.all([
      adminRepo.getCustomerAddresses(id),
      adminRepo.getCustomerOrders(id, 10),
      adminRepo.getCustomerOrderStats(id)
    ]);

    const normalizedCustomer = {
      ...customer,
      full_name: customer.fullName,
      is_active: customer.isActive,
      created_at: customer.createdAt,
      updated_at: customer.updatedAt
    };

    return successResponse(res, {
      customer: normalizedCustomer,
      addresses,
      orders,
      stats
    });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await adminRepo.getCustomerById(id);
    if (!customer) {
      return errorResponse(res, 'Customer not found', 404);
    }

    const { full_name, fullName, phone, email, is_active, isActive, password } = req.body;
    const updates = {};

    if (full_name !== undefined || fullName !== undefined) {
      updates.fullName = (full_name || fullName || '').trim();
    }
    if (phone !== undefined) {
      updates.phone = phone && phone.trim() ? phone.trim() : null;
    }
    if (email !== undefined && email.trim() && email.trim().toLowerCase() !== customer.email) {
      const cleanEmail = email.trim().toLowerCase();
      const existing = await adminRepo.findProfileByEmail(cleanEmail);
      if (existing && existing.id !== id) {
        return errorResponse(res, 'Another account is already registered with this email', 400);
      }
      updates.email = cleanEmail;
    }
    if (isActive !== undefined) {
      updates.isActive = Boolean(isActive);
    } else if (is_active !== undefined) {
      updates.isActive = Boolean(is_active);
    }

    if (password && password.trim()) {
      updates.passwordHash = await bcrypt.hash(password.trim(), 10);
    }

    const updated = await adminRepo.updateCustomer(id, updates);
    const normalized = {
      ...updated,
      full_name: updated.fullName,
      is_active: updated.isActive,
      created_at: updated.createdAt,
      updated_at: updated.updatedAt
    };

    return successResponse(res, { customer: normalized }, 'Customer updated successfully');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await adminRepo.getCustomerById(id);
    if (!customer) {
      return errorResponse(res, 'Customer not found', 404);
    }

    const result = await adminRepo.deleteCustomer(id);
    if (result.action === 'deactivated') {
      return successResponse(
        res,
        result,
        `Customer has ${result.orderCount} existing order records. Account safely deactivated.`
      );
    }

    return successResponse(res, result, 'Customer deleted successfully');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const listCategories = async (req, res) => {
  try {
    const rawCats = await adminRepo.listCategories();
    const categories = rawCats.map(c => ({
      ...c,
      image_url: c.imageUrl,
      display_order: c.displayOrder,
      is_active: c.isActive
    }));
    return successResponse(res, { categories });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const createCategory = async (req, res) => {
  try {
    const payload = mapCategoryPayload(req);
    const category = await adminRepo.createCategory(payload);
    return successResponse(res, { category }, 'Category created', 201);
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const updateCategory = async (req, res) => {
  try {
    const payload = mapCategoryPayload(req);
    const existing = payload.imageUrl ? await adminRepo.getCategoryById(req.params.id) : null;
    const category = await adminRepo.updateCategory(req.params.id, payload);
    if (payload.imageUrl && existing?.imageUrl && existing.imageUrl !== payload.imageUrl) {
      deleteFileFromDisk(existing.imageUrl);
    }
    return successResponse(res, { category }, 'Category updated');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const deleted = await adminRepo.deleteCategory(req.params.id);
    if (deleted?.imageUrl) deleteFileFromDisk(deleted.imageUrl);
    return successResponse(res, null, 'Category deleted');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const listSubCategories = async (req, res) => {
  try {
    const rawSub = await adminRepo.listSubCategories();
    const sub_categories = rawSub.map(s => ({
      ...s,
      category_id: s.categoryId,
      image_url: s.imageUrl,
      display_order: s.displayOrder,
      is_active: s.isActive
    }));
    return successResponse(res, { sub_categories, subcategories: sub_categories });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const createSubCategory = async (req, res) => {
  try {
    const payload = mapSubCategoryPayload(req);
    const subCategory = await adminRepo.createSubCategory(payload);
    return successResponse(res, { sub_category: subCategory }, 'Sub-category created', 201);
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const updateSubCategory = async (req, res) => {
  try {
    const payload = mapSubCategoryPayload(req);
    const existing = payload.imageUrl ? await adminRepo.getSubCategoryById(req.params.id) : null;
    const subCategory = await adminRepo.updateSubCategory(req.params.id, payload);
    if (payload.imageUrl && existing?.imageUrl && existing.imageUrl !== payload.imageUrl) {
      deleteFileFromDisk(existing.imageUrl);
    }
    return successResponse(res, { sub_category: subCategory }, 'Sub-category updated');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const deleteSubCategory = async (req, res) => {
  try {
    const deleted = await adminRepo.deleteSubCategory(req.params.id);
    if (deleted?.imageUrl) deleteFileFromDisk(deleted.imageUrl);
    return successResponse(res, null, 'Sub-category deleted');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// --- PRODUCTS ---
export const listProducts = async (req, res) => {
  try {
    const { storeId, store_id, categoryId, subCategoryId, search, isDeal, isFeatured, isFlashSale, page, limit } = req.query;
    const filter = {
      storeId: storeId || store_id || undefined,
      categoryId: categoryId || undefined,
      subCategoryId: subCategoryId || undefined,
      search: search || undefined,
      isDeal: isDeal === 'true' ? true : isDeal === 'false' ? false : undefined,
      isFeatured: isFeatured === 'true' ? true : isFeatured === 'false' ? false : undefined,
      isFlashSale: isFlashSale === 'true' ? true : isFlashSale === 'false' ? false : undefined,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 50
    };

    const result = await adminRepo.listProducts(filter);
    const products = result.map(p => ({
      ...p,
      store_id: p.storeId,
      sub_category_id: p.subCategoryId,
      discount_price: p.discountPrice,
      weight_unit: p.weightUnit,
      express_stock_qty: p.expressStockQty,
      scheduled_stock_qty: p.scheduledStockQty,
      stock_quantity: p.stockQuantity,
      image_url: p.imageUrl,
      cooking_guide: p.cookingGuide,
      is_deal: p.isDeal,
      is_featured: p.isFeatured,
      is_flash_sale: p.isFlashSale,
      is_trending: p.isTrending,
      is_exclusive: p.isExclusive,
      is_new_launch: p.isNewLaunch,
      is_frozen: p.isFrozen,
      is_active: p.isActive,
      delivery_options: p.deliveryOptions,
      cleaning_options: p.cleaningOptions,
      product_highlights: p.productHighlights,
      variants: (p.variants || []).map(v => ({
        ...v,
        product_id: v.productId,
        discount_price: v.discountPrice,
        weight_text: v.weightText,
        gross_weight_text: v.grossWeightText,
        delivery_info: v.deliveryInfo,
        image_url: v.imageUrl
      }))
    }));
    return successResponse(res, { products });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

const formatProductResponse = (rawProd, variants = []) => {
  if (!rawProd) return null;
  return {
    ...rawProd,
    store_id: rawProd.storeId,
    sub_category_id: rawProd.subCategoryId,
    discount_price: rawProd.discountPrice,
    weight_unit: rawProd.weightUnit,
    express_stock_qty: rawProd.expressStockQty,
    scheduled_stock_qty: rawProd.scheduledStockQty,
    stock_quantity: rawProd.stockQuantity,
    image_url: rawProd.imageUrl,
    cooking_guide: rawProd.cookingGuide,
    is_deal: rawProd.isDeal,
    is_featured: rawProd.isFeatured,
    is_flash_sale: rawProd.isFlashSale,
    is_trending: rawProd.isTrending,
    is_exclusive: rawProd.isExclusive,
    is_new_launch: rawProd.isNewLaunch,
    is_frozen: rawProd.isFrozen,
    is_active: rawProd.isActive,
    delivery_options: rawProd.deliveryOptions,
    cleaning_options: rawProd.cleaningOptions,
    product_highlights: rawProd.productHighlights,
    variants: (variants || []).map(v => ({
      ...v,
      product_id: v.productId,
      discount_price: v.discountPrice ?? v.discount_price,
      weight_text: v.weightText ?? v.weight_text,
      gross_weight_text: v.grossWeightText ?? v.gross_weight_text,
      delivery_info: v.deliveryInfo ?? v.delivery_info,
      image_url: v.imageUrl ?? v.image_url
    }))
  };
};

export const createProduct = async (req, res) => {
  try {
    const { productData, variants } = mapProductPayload(req);
    const rawProd = await adminRepo.createProduct(productData, variants);
    const product = formatProductResponse(rawProd, variants);
    return successResponse(res, { product }, 'Product created', 201);
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { productData, variants } = mapProductPayload(req);
    const existing = productData.imageUrl ? await adminRepo.getProductById(req.params.id) : null;
    const rawProd = await adminRepo.updateProduct(req.params.id, productData, variants);
    if (productData.imageUrl && existing?.imageUrl && existing.imageUrl !== productData.imageUrl) {
      deleteFileFromDisk(existing.imageUrl);
    }
    const product = formatProductResponse(rawProd, variants);
    return successResponse(res, { product }, 'Product updated');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const result = await adminRepo.deleteProduct(req.params.id);
    const prod = result?.product;
    const urlsToDelete = [
      prod?.imageUrl,
      ...(Array.isArray(prod?.images) ? prod.images : []),
      ...(result?.variantImageUrls || [])
    ].filter(Boolean);
    deleteFilesFromDisk(urlsToDelete);
    return successResponse(res, null, 'Product deleted');
  } catch (error) {
    return errorResponse(res, error.message, 500, error);
  }
};

export const listBanners = async (req, res) => {
  try {
    const rawBanners = await adminRepo.listBanners();
    const banners = rawBanners.map(b => ({
      ...b,
      image_url: b.imageUrl,
      link_url: b.linkUrl,
      display_order: b.displayOrder,
      is_active: b.isActive
    }));
    return successResponse(res, { banners });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const createBanner = async (req, res) => {
  try {
    const payload = mapBannerPayload(req);
    const banner = await adminRepo.createBanner(payload);
    return successResponse(res, { banner }, 'Banner created', 201);
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const updateBanner = async (req, res) => {
  try {
    const payload = mapBannerPayload(req);
    const existing = payload.imageUrl ? await adminRepo.getBannerById(req.params.id) : null;
    const banner = await adminRepo.updateBanner(req.params.id, payload);
    if (payload.imageUrl && existing?.imageUrl && existing.imageUrl !== payload.imageUrl) {
      deleteFileFromDisk(existing.imageUrl);
    }
    return successResponse(res, { banner }, 'Banner updated');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const deleteBanner = async (req, res) => {
  try {
    const deleted = await adminRepo.deleteBanner(req.params.id);
    if (deleted?.imageUrl) deleteFileFromDisk(deleted.imageUrl);
    return successResponse(res, null, 'Banner deleted');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const listHomeSections = async (req, res) => {
  try {
    const rawSecs = await adminRepo.listHomeSections();
    const sections = rawSecs.map(s => ({
      ...s,
      section_type: s.sectionType,
      display_order: s.displayOrder,
      is_active: s.isActive
    }));
    return successResponse(res, { sections });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const updateHomeSection = async (req, res) => {
  try {
    const payload = {};
    if (req.body.title !== undefined) payload.title = req.body.title;
    if (req.body.subtitle !== undefined) payload.subtitle = req.body.subtitle;
    if (req.body.section_type !== undefined) payload.sectionType = req.body.section_type;
    if (req.body.display_order !== undefined) payload.displayOrder = Number(req.body.display_order);
    if (req.body.is_active !== undefined) payload.isActive = req.body.is_active === true || req.body.is_active === 'true';
    if (req.body.config !== undefined) payload.config = req.body.config;

    const section = await adminRepo.updateHomeSection(req.params.id, payload);
    return successResponse(res, { section }, 'Home section updated');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const listDeliverySlots = async (req, res) => {
  try {
    const rawSlots = await adminRepo.listDeliverySlots();
    const slots = rawSlots.map(s => ({
      ...s,
      slot_name: s.slotName,
      start_time: s.startTime,
      end_time: s.endTime,
      display_order: s.displayOrder,
      is_active: s.isActive
    }));
    return successResponse(res, { slots });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const createDeliverySlot = async (req, res) => {
  try {
    const payload = mapDeliverySlotPayload(req.body);
    const slot = await adminRepo.createDeliverySlot(payload);
    return successResponse(res, { slot }, 'Delivery slot created', 201);
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const updateDeliverySlot = async (req, res) => {
  try {
    const payload = mapDeliverySlotPayload(req.body);
    const slot = await adminRepo.updateDeliverySlot(req.params.id, payload);
    return successResponse(res, { slot }, 'Delivery slot updated');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const deleteDeliverySlot = async (req, res) => {
  try {
    await adminRepo.deleteDeliverySlot(req.params.id);
    return successResponse(res, null, 'Delivery slot deleted');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// Coupons inside Admin
export const listCoupons = async (req, res) => {
  try {
    const rawCoupons = await adminRepo.listCoupons();
    const coupons = rawCoupons.map(c => ({
      ...c,
      discount_type: c.discountType,
      discount_value: c.discountValue,
      min_order_amount: c.minOrderAmount,
      max_discount_amount: c.maxDiscountAmount,
      start_date: c.startDate,
      end_date: c.endDate,
      usage_limit: c.usageLimit,
      used_count: c.usedCount,
      is_active: c.isActive
    }));
    return successResponse(res, { coupons });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const createCoupon = async (req, res) => {
  try {
    const payload = mapCouponPayload(req.body);
    const coupon = await adminRepo.createCoupon(payload);
    return successResponse(res, { coupon }, 'Coupon created', 201);
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const updateCoupon = async (req, res) => {
  try {
    const payload = mapCouponPayload(req.body);
    const coupon = await adminRepo.updateCoupon(req.params.id, payload);
    return successResponse(res, { coupon }, 'Coupon updated');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const deleteCoupon = async (req, res) => {
  try {
    await adminRepo.deleteCoupon(req.params.id);
    return successResponse(res, null, 'Coupon deleted');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const getPlatformSettings = async (req, res) => {
  try {
    const { getPublicConfig } = await import('../../shared/app-config/service.js');
    const { getAllSettings } = await import('../../shared/app-config/repository.js');
    const config = await getPublicConfig();
    const all = await getAllSettings();
    const settingsMap = {};
    for (const item of all) {
      let val = item.value;
      if (item.dataType === 'json') {
        try { val = JSON.parse(item.value); } catch { val = item.value; }
      } else if (item.dataType === 'number') {
        val = Number(item.value);
      } else if (item.dataType === 'boolean') {
        val = item.value === 'true' || item.value === '1';
      }
      settingsMap[item.key] = val;
    }
    return successResponse(res, { settings: settingsMap, config });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const updatePlatformSettings = async (req, res) => {
  try {
    const { updateSettingValue } = await import('../../shared/app-config/service.js');
    const updates = [];
    for (const [k, v] of Object.entries(req.body)) {
      const dataType = typeof v === 'object' ? 'json' : typeof v === 'number' ? 'number' : typeof v === 'boolean' ? 'boolean' : 'string';
      const valStr = typeof v === 'object' ? JSON.stringify(v) : String(v);
      updates.push(await updateSettingValue(k, valStr, dataType));
    }
    return successResponse(res, { settings: updates }, 'Platform settings updated');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const uploadFile = async (req, res) => {
  if (!req.file) return errorResponse(res, 'No file uploaded', 400);
  const fileUrl = formatAssetUrl(req.file.filename, req);
  return successResponse(res, { url: fileUrl }, 'File uploaded');
};
