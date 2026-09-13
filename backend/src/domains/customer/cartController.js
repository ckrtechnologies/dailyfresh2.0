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
  const { items } = req.body;
  try {
    const result = await custService.validateCartItems(items);
    return successResponse(res, result, 'Cart validation completed');
  } catch (error) {
    return errorResponse(res, 'Failed to validate cart', 500, error.message);
  }
};
