import * as custRepo from './repository.js';
import * as custService from './service.js';
import { successResponse, errorResponse } from '../../utils/response.js';

export const getCart = async (req, res) => {
  try {
    const items = await custRepo.getCartItemsWithVariants(req.user.id);
    return successResponse(res, { items }, 'Cart fetched successfully');
  } catch (error) {
    return errorResponse(res, 'Failed to fetch cart', 500, error.message);
  }
};

export const syncCart = async (req, res) => {
  const { items } = req.body;
  if (!items || !Array.isArray(items)) {
    return errorResponse(res, 'Items array is required', 400);
  }

  try {
    const synced = await custService.syncUserCart(req.user.id, items);
    return successResponse(res, { items: synced }, 'Cart synced successfully');
  } catch (error) {
    return errorResponse(res, 'Failed to sync cart', 500, error.message);
  }
};

export const validateCart = async (req, res) => {
  const { items, storeId, store_id } = req.body;
  try {
    const targetStore = storeId || store_id || null;
    const result = await custService.validateCartItems(items, targetStore);
    return successResponse(res, result, 'Cart validation completed');
  } catch (error) {
    return errorResponse(res, 'Failed to validate cart', 500, error.message);
  }
};

export const clearCart = async (req, res) => {
  try {
    await custService.clearCart(req.user.id);
    return successResponse(res, { success: true }, 'Cart cleared successfully');
  } catch (error) {
    return errorResponse(res, 'Failed to clear cart', 500, error.message);
  }
};

