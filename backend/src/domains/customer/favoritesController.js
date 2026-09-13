import * as custRepo from './repository.js';
import { successResponse, errorResponse } from '../../utils/response.js';

export const getFavorites = async (req, res) => {
  try {
    const favorites = await custRepo.getFavorites(req.user.id);
    return successResponse(res, favorites, 'Favorites fetched');
  } catch (error) {
    return errorResponse(res, 'Failed to fetch favorites', 500, error.message);
  }
};

export const toggleFavorite = async (req, res) => {
  const { product_id, productId } = req.body;
  const targetId = product_id || productId;
  if (!targetId) {
    return errorResponse(res, 'Product ID is required', 400);
  }

  try {
    const result = await custRepo.toggleFavorite(req.user.id, targetId);
    return successResponse(res, result, result.is_favorite ? 'Added to favorites' : 'Removed from favorites');
  } catch (error) {
    return errorResponse(res, 'Failed to toggle favorite', 500, error.message);
  }
};
