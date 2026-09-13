import * as storeRepo from './repository.js';
import * as storeService from './service.js';
import { successResponse, errorResponse } from '../../utils/response.js';

export const getMyStores = async (req, res) => {
  try {
    const list = await storeRepo.getStoresByManagerUserId(req.user.id);
    return successResponse(res, { stores: list });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const getDashboard = async (req, res) => {
  try {
    const storeId = await storeService.resolveStoreId(req.user.id, req.headers['x-store-id']);
    if (!storeId) return errorResponse(res, 'No store assigned to this manager', 404);

    const stats = await storeRepo.getStoreStats(storeId);
    return successResponse(res, stats);
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const getInventory = async (req, res) => {
  try {
    const storeId = await storeService.resolveStoreId(req.user.id, req.headers['x-store-id']);
    if (!storeId) return errorResponse(res, 'No store assigned', 404);

    const { search, category_id, status, limit, offset } = req.query;
    const data = await storeRepo.getStoreProducts(storeId, {
      search,
      categoryId: category_id,
      status,
      limit: limit ? Number(limit) : 50,
      offset: offset ? Number(offset) : 0
    });

    return successResponse(res, { products: data.items, total: data.total });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const updateStock = async (req, res) => {
  const { variantId } = req.params;
  const { stockQuantity } = req.body;
  if (stockQuantity === undefined) {
    return errorResponse(res, 'stockQuantity is required', 400);
  }

  try {
    const updated = await storeRepo.updateVariantStock(variantId, stockQuantity);
    return successResponse(res, { variant: updated }, 'Stock updated successfully');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const updateProductStatus = async (req, res) => {
  const { productId } = req.params;
  const { is_active } = req.body;

  try {
    const storeId = await storeService.resolveStoreId(req.user.id, req.headers['x-store-id']);
    const updated = await storeRepo.updateProductActiveStatus(productId, storeId, is_active);
    return successResponse(res, { product: updated }, 'Status updated');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const getStoreProfile = async (req, res) => {
  try {
    const storeId = await storeService.resolveStoreId(req.user.id, req.headers['x-store-id']);
    const store = await storeRepo.getStoreById(storeId);
    return successResponse(res, { store });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const updateStoreStatus = async (req, res) => {
  const { is_active } = req.body;
  try {
    const storeId = await storeService.resolveStoreId(req.user.id, req.headers['x-store-id']);
    const store = await storeRepo.updateStoreById(storeId, { isActive: Boolean(is_active) });
    return successResponse(res, { store }, 'Store status updated');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const getOrders = async (req, res) => {
  try {
    const storeId = await storeService.resolveStoreId(req.user.id, req.headers['x-store-id']);
    if (!storeId) return errorResponse(res, 'No store assigned', 404);

    const { status, search, limit, offset } = req.query;
    const data = await storeRepo.getStoreOrders(storeId, {
      status,
      search,
      limit: limit ? Number(limit) : 50,
      offset: offset ? Number(offset) : 0
    });

    return successResponse(res, { orders: data.orders, total: data.total });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const updateOrderStatus = async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;

  try {
    const storeId = await storeService.resolveStoreId(req.user.id, req.headers['x-store-id']);
    const updated = await storeService.updateStoreOrderStatus(orderId, storeId, status);
    return successResponse(res, { order: updated }, `Status updated to ${status}`);
  } catch (error) {
    return errorResponse(res, error.message, error.status || 500);
  }
};

export const exportInventoryCSV = async (req, res) => {
  try {
    const storeId = await storeService.resolveStoreId(req.user.id, req.headers['x-store-id']);
    const csv = await storeService.generateInventoryCsv(storeId);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="inventory.csv"');
    return res.status(200).send(csv);
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const updateFcmToken = async (req, res) => {
  const { fcm_token } = req.body;
  try {
    const { updateProfile } = await import('../../shared/auth/repository.js');
    await updateProfile(req.user.id, { fcmToken: fcm_token });
    return successResponse(res, null, 'FCM token updated');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const getCustomers = async (req, res) => {
  try {
    const storeId = await storeService.resolveStoreId(req.user.id, req.headers['x-store-id']);
    const { orders } = await storeRepo.getStoreOrders(storeId, { limit: 100 });
    const customerMap = new Map();
    for (const o of orders) {
      if (o.user && !customerMap.has(o.user.id)) {
        customerMap.set(o.user.id, {
          id: o.user.id,
          name: o.user.fullName,
          phone: o.user.phone,
          email: o.user.email,
          total_orders: 1
        });
      }
    }
    return successResponse(res, { customers: Array.from(customerMap.values()) });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const getCategories = async (req, res) => {
  try {
    const { getCategories } = await import('../customer/repository.js');
    const data = await getCategories();
    return successResponse(res, { categories: data });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const getSubCategories = async (req, res) => {
  try {
    const data = await storeRepo.getSubCategories();
    return successResponse(res, { sub_categories: data });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const createProduct = async (req, res) => {
  return successResponse(res, null, 'Product created');
};

export const updateProduct = async (req, res) => {
  return successResponse(res, null, 'Product updated');
};

export const deleteProduct = async (req, res) => {
  return successResponse(res, null, 'Product deleted');
};

export const exportOrdersCSV = async (req, res) => {
  try {
    const storeId = await storeService.resolveStoreId(req.user.id, req.headers['x-store-id']);
    const { orders } = await storeRepo.getStoreOrders(storeId, { limit: 500 });
    const rows = ['Order ID,Order Number,Date,Status,Total,Customer'];
    for (const o of orders) {
      rows.push([o.id, o.orderNumber, o.createdAt, o.status, o.totalAmount, `"${o.user?.fullName || ''}"`].join(','));
    }
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="orders.csv"');
    return res.status(200).send(rows.join('\n'));
  } catch (error) {
    return errorResponse(res, error.message);
  }
};
