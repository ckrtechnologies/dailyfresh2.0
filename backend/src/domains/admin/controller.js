import * as adminRepo from './repository.js';
import * as adminService from './service.js';
import { successResponse, errorResponse } from '../../utils/response.js';

// --- NORMALIZATION HELPERS ---
const getUploadedImageUrl = (req, fieldname = 'image') => {
  if (req.files && Array.isArray(req.files)) {
    const file = req.files.find(f => f.fieldname === fieldname || f.fieldname === 'file' || f.fieldname === 'image_url');
    if (file) return `${process.env.API_URL || ''}/uploads/${file.filename}`;
  }
  if (req.file) return `${process.env.API_URL || ''}/uploads/${req.file.filename}`;
  return null;
};

const mapStorePayload = (body) => {
  const data = {};
  const mapping = {
    manager_user_id: 'managerUserId', managerUserId: 'managerUserId',
    name: 'name',
    logo_url: 'logoUrl', logoUrl: 'logoUrl',
    cover_url: 'coverUrl', coverUrl: 'coverUrl',
    description: 'description',
    address: 'address',
    city: 'city',
    state: 'state',
    pincode: 'pincode',
    latitude: 'latitude',
    longitude: 'longitude',
    phone: 'phone',
    email: 'email',
    opening_time: 'openingTime', openingTime: 'openingTime',
    closing_time: 'closingTime', closingTime: 'closingTime',
    delivery_radius_km: 'deliveryRadiusKm', deliveryRadiusKm: 'deliveryRadiusKm',
    serviceable_pincodes: 'serviceablePincodes', serviceablePincodes: 'serviceablePincodes',
    is_active: 'isActive', isActive: 'isActive'
  };
  for (const [k, target] of Object.entries(mapping)) {
    if (body[k] !== undefined && body[k] !== null && body[k] !== '') {
      let v = body[k];
      if (['deliveryRadiusKm', 'latitude', 'longitude'].includes(target)) v = Number(v);
      if (target === 'isActive') v = v === true || v === 'true' || v === '1' || v === 1;
      if (target === 'serviceablePincodes' && typeof v === 'string') {
        try { v = JSON.parse(v); } catch { v = v.split(',').map(s => s.trim()); }
      }
      data[target] = v;
    }
  }
  return data;
};

const mapCategoryPayload = (req) => {
  const body = req.body || {};
  const data = {};
  const imgUrl = getUploadedImageUrl(req, 'image') || body.image_url || body.imageUrl;
  if (imgUrl) data.imageUrl = imgUrl;

  const mapping = {
    name: 'name',
    slug: 'slug',
    description: 'description',
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

const mapSubCategoryPayload = (req) => {
  const body = req.body || {};
  const data = {};
  const imgUrl = getUploadedImageUrl(req, 'image') || body.image_url || body.imageUrl;
  if (imgUrl) data.imageUrl = imgUrl;

  const mapping = {
    category_id: 'categoryId', categoryId: 'categoryId',
    name: 'name',
    slug: 'slug',
    description: 'description',
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

const mapProductPayload = (req) => {
  const body = req.body || {};
  const data = {};
  const imgUrl = getUploadedImageUrl(req, 'image') || body.image_url || body.imageUrl;
  if (imgUrl) data.imageUrl = imgUrl;

  const mapping = {
    store_id: 'storeId', storeId: 'storeId',
    sub_category_id: 'subCategoryId', subCategoryId: 'subCategoryId',
    name: 'name',
    slug: 'slug',
    description: 'description',
    cooking_guide: 'cookingGuide', cookingGuide: 'cookingGuide',
    product_highlights: 'productHighlights', productHighlights: 'productHighlights',
    sku: 'sku',
    price: 'price',
    discount_price: 'discountPrice', discountPrice: 'discountPrice',
    weight_unit: 'weightUnit', weightUnit: 'weightUnit',
    stock_quantity: 'stockQuantity', stockQuantity: 'stockQuantity',
    express_stock_qty: 'expressStockQty', expressStockQty: 'expressStockQty',
    scheduled_stock_qty: 'scheduledStockQty', scheduledStockQty: 'scheduledStockQty',
    delivery_options: 'deliveryOptions', deliveryOptions: 'deliveryOptions',
    is_active: 'isActive', isActive: 'isActive',
    is_featured: 'isFeatured', isFeatured: 'isFeatured',
    is_deal: 'isDeal', isDeal: 'isDeal',
    is_flash_sale: 'isFlashSale', isFlashSale: 'isFlashSale',
    is_exclusive: 'isExclusive', isExclusive: 'isExclusive',
    is_trending: 'isTrending', isTrending: 'isTrending',
    is_frozen: 'isFrozen', isFrozen: 'isFrozen',
    is_new_launch: 'isNewLaunch', isNewLaunch: 'isNewLaunch',
    cut_options: 'cutOptions', cutOptions: 'cutOptions',
    cleaning_options: 'cleaningOptions', cleaningOptions: 'cleaningOptions',
    images: 'images',
    metadata: 'metadata'
  };

  for (const [k, target] of Object.entries(mapping)) {
    if (body[k] !== undefined && body[k] !== null && body[k] !== '') {
      let v = body[k];
      if (['deliveryOptions', 'productHighlights', 'metadata'].includes(target) && typeof v === 'string') {
        try { v = JSON.parse(v); } catch {}
      }
      if (['cutOptions', 'cleaningOptions', 'images'].includes(target) && typeof v === 'string') {
        try { v = JSON.parse(v); } catch { v = [v]; }
      }
      if (['price', 'discountPrice'].includes(target)) v = String(v);
      if (['stockQuantity', 'expressStockQty', 'scheduledStockQty'].includes(target)) v = Number(v);
      if (['isActive', 'isFeatured', 'isDeal', 'isFlashSale', 'isExclusive', 'isTrending', 'isFrozen', 'isNewLaunch'].includes(target)) {
        v = v === true || v === 'true' || v === '1' || v === 1;
      }
      data[target] = v;
    }
  }

  let variants = body.variants;
  if (typeof variants === 'string') {
    try { variants = JSON.parse(variants); } catch { variants = []; }
  }
  if (Array.isArray(variants)) {
    variants = variants.map((v, idx) => {
      const vImg = req.files && Array.isArray(req.files) ? req.files.find(f => f.fieldname === `variant_image_${idx}`) : null;
      return {
        name: v.name,
        price: v.price ? String(v.price) : '0.00',
        discountPrice: v.discount_price || v.discountPrice ? String(v.discount_price || v.discountPrice) : null,
        weightUnit: v.weight_unit || v.weightUnit || 'kg',
        weightValue: v.weight_value || v.weightValue ? String(v.weight_value || v.weightValue) : null,
        stockQuantity: Number(v.stock_quantity || v.stockQuantity || 0),
        isActive: v.is_active !== undefined ? (v.is_active === true || v.is_active === 'true') : true,
        imageUrl: vImg ? `${process.env.API_URL || ''}/uploads/${vImg.filename}` : (v.image_url || v.imageUrl || null)
      };
    });
  }

  return { productData: data, variants };
};

const mapCouponPayload = (body) => {
  const data = {};
  const mapping = {
    code: 'code',
    description: 'description',
    discount_type: 'discountType', discountType: 'discountType',
    discount_value: 'discountValue', discountValue: 'discountValue',
    min_order_amount: 'minOrderAmount', minOrderAmount: 'minOrderAmount',
    max_discount_amount: 'maxDiscountAmount', maxDiscountAmount: 'maxDiscountAmount',
    start_date: 'startDate', startDate: 'startDate',
    end_date: 'endDate', endDate: 'endDate',
    usage_limit: 'usageLimit', usageLimit: 'usageLimit',
    is_active: 'isActive', isActive: 'isActive'
  };
  for (const [k, target] of Object.entries(mapping)) {
    if (body[k] !== undefined && body[k] !== null && body[k] !== '') {
      let v = body[k];
      if (['discountValue', 'minOrderAmount', 'maxDiscountAmount'].includes(target)) v = String(v);
      if (target === 'usageLimit') v = Number(v);
      if (target === 'isActive') v = v === true || v === 'true' || v === '1' || v === 1;
      if (['startDate', 'endDate'].includes(target) && typeof v === 'string') v = new Date(v);
      data[target] = v;
    }
  }
  return data;
};

const mapBannerPayload = (req) => {
  const body = req.body || {};
  const data = {};
  const imgUrl = getUploadedImageUrl(req, 'image') || body.image_url || body.imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80';
  data.imageUrl = imgUrl;

  const mapping = {
    title: 'title',
    link_url: 'linkUrl', linkUrl: 'linkUrl',
    placement: 'placement',
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
    const stats = await adminRepo.getDashboardMetrics();
    return successResponse(res, stats);
  } catch (error) {
    return errorResponse(res, 'Failed to fetch dashboard stats', 500, error.message);
  }
};

export const listOrders = async (req, res) => {
  const { limit, offset, status, store_id } = req.query;
  try {
    const data = await adminRepo.listOrders({
      limit: limit ? Number(limit) : 50,
      offset: offset ? Number(offset) : 0,
      status,
      storeId: store_id
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
    await adminRepo.deleteStore(req.params.id);
    return successResponse(res, null, 'Store deleted');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const listRiders = async (req, res) => {
  try {
    const rawRiders = await adminRepo.listRiders();
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
    const logs = await adminRepo.listRiderDistanceLogs();
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
    const rawCustomers = await adminRepo.listCustomers();
    const customers = rawCustomers.map(c => ({
      ...c,
      full_name: c.fullName,
      is_active: c.isActive
    }));
    return successResponse(res, { customers });
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
    const category = await adminRepo.updateCategory(req.params.id, payload);
    return successResponse(res, { category }, 'Category updated');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const deleteCategory = async (req, res) => {
  try {
    await adminRepo.deleteCategory(req.params.id);
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
    return successResponse(res, { sub_categories });
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
    const subCategory = await adminRepo.updateSubCategory(req.params.id, payload);
    return successResponse(res, { sub_category: subCategory }, 'Sub-category updated');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const deleteSubCategory = async (req, res) => {
  try {
    await adminRepo.deleteSubCategory(req.params.id);
    return successResponse(res, null, 'Sub-category deleted');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const listProducts = async (req, res) => {
  const { limit, offset, store_id } = req.query;
  try {
    const rawProds = await adminRepo.listProducts({
      limit: limit ? Number(limit) : 50,
      offset: offset ? Number(offset) : 0,
      storeId: store_id
    });
    const products = rawProds.map(p => ({
      ...p,
      store_id: p.storeId,
      sub_category_id: p.subCategoryId,
      discount_price: p.discountPrice,
      weight_unit: p.weightUnit,
      stock_quantity: p.stockQuantity,
      express_stock_qty: p.expressStockQty,
      scheduled_stock_qty: p.scheduledStockQty,
      delivery_options: p.deliveryOptions,
      is_active: p.isActive,
      is_deal: p.isDeal,
      is_featured: p.isFeatured,
      image_url: p.imageUrl
    }));
    return successResponse(res, { products });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const createProduct = async (req, res) => {
  try {
    const { productData, variants } = mapProductPayload(req);
    const product = await adminRepo.createProduct(productData, variants);
    return successResponse(res, { product }, 'Product created', 201);
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { productData } = mapProductPayload(req);
    const product = await adminRepo.updateProduct(req.params.id, productData);
    return successResponse(res, { product }, 'Product updated');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const deleteProduct = async (req, res) => {
  try {
    await adminRepo.deleteProduct(req.params.id);
    return successResponse(res, null, 'Product deleted');
  } catch (error) {
    return errorResponse(res, error.message);
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
    const banner = await adminRepo.updateBanner(req.params.id, payload);
    return successResponse(res, { banner }, 'Banner updated');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const deleteBanner = async (req, res) => {
  try {
    await adminRepo.deleteBanner(req.params.id);
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
  const fileUrl = `${process.env.API_URL || ''}/uploads/${req.file.filename}`;
  return successResponse(res, { url: fileUrl }, 'File uploaded');
};
