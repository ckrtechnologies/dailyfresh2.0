import * as custRepo from './repository.js';
import * as custService from './service.js';
import { successResponse, errorResponse } from '../../utils/response.js';

export const getCategories = async (req, res) => {
  try {
    const data = await custRepo.getCategories();
    return successResponse(res, data, 'Categories fetched successfully');
  } catch (error) {
    return errorResponse(res, 'Failed to fetch categories', 500, error.message);
  }
};

export const getCategoryTree = async (req, res) => {
  try {
    const data = await custRepo.getCategoryTree();
    return successResponse(res, data, 'Category tree fetched successfully');
  } catch (error) {
    return errorResponse(res, 'Failed to fetch category tree', 500, error.message);
  }
};

export const getBanners = async (req, res) => {
  try {
    const data = await custRepo.getBanners();
    return successResponse(res, data, 'Banners fetched successfully');
  } catch (error) {
    return errorResponse(res, 'Failed to fetch banners', 500, error.message);
  }
};

export const getHomeData = async (req, res) => {
  try {
    const { store_id } = req.query;
    const data = await custService.getHomeScreenData(store_id);
    return successResponse(res, data, 'Home screen data fetched');
  } catch (error) {
    return errorResponse(res, 'Failed to fetch home screen data', 500, error.message);
  }
};

export const getNearestStore = async (req, res) => {
  const { lat, lng } = req.query;
  if (!lat || !lng) {
    return errorResponse(res, 'Latitude and longitude are required', 400);
  }

  try {
    const result = await custService.findNearestStore(Number(lat), Number(lng));
    if (!result) {
      return errorResponse(res, 'No active stores available', 404);
    }
    return successResponse(res, result, 'Nearest store located');
  } catch (error) {
    return errorResponse(res, 'Failed to locate store', 500, error.message);
  }
};

export const getDeliverySlots = async (req, res) => {
  try {
    const data = await custRepo.getDeliverySlots();
    const morning = data.filter(s => s.type === 'tomorrow_morning');
    const evening = data.filter(s => s.type === 'tomorrow_evening');
    return successResponse(res, {
      tomorrow_morning: morning,
      tomorrow_evening: evening,
      slots: data
    }, 'Delivery slots fetched');
  } catch (error) {
    return errorResponse(res, 'Failed to fetch delivery slots', 500, error.message);
  }
};

export const listProducts = async (req, res) => {
  try {
    const { search, category_id, sub_category_id, store_id, limit, offset } = req.query;
    const products = await custRepo.findProducts({
      search,
      categoryId: category_id,
      subCategoryId: sub_category_id,
      storeId: store_id,
      limit: limit ? Number(limit) : 50,
      offset: offset ? Number(offset) : 0
    });
    return successResponse(res, { products }, 'Products fetched successfully');
  } catch (error) {
    return errorResponse(res, 'Failed to fetch products', 500, error.message);
  }
};

export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await custRepo.findProductById(id);
    if (!product) {
      return errorResponse(res, 'Product not found', 404);
    }
    return successResponse(res, product, 'Product details fetched');
  } catch (error) {
    return errorResponse(res, 'Failed to fetch product', 500, error.message);
  }
};
