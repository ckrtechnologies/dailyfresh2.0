import * as custRepo from './repository.js';
import * as custService from './service.js';
import { db } from '../../db/index.js';
import { subCategories } from '../../db/schema.js';
import { successResponse, errorResponse } from '../../utils/response.js';

export const getCategories = async (req, res) => {
  try {
    const { store_id, delivery_type } = req.query;
    let data = await custRepo.getCategories();
    if (store_id) {
      const storeProducts = await custRepo.findProducts({ storeId: store_id, limit: 500 });
      const allSubCats = await db.select({ id: subCategories.id, categoryId: subCategories.categoryId }).from(subCategories);
      const subToCatMap = new Map(allSubCats.map(s => [s.id, s.categoryId]));

      const storeCategoryIds = new Set(
        (storeProducts || [])
          .filter(p => {
            const options = p.deliveryOptions || p.delivery_options || [];
            const expressStock = Number(p.expressStockQty ?? p.express_stock_qty ?? 0);
            const scheduledStock = Number(p.scheduledStockQty ?? p.scheduled_stock_qty ?? 0);
            const totalStock = Number(p.stockQuantity ?? p.stock_quantity ?? 0);

            if (delivery_type === 'express') {
              return options.includes('express') && expressStock > 0;
            }
            if (['tomorrow', 'tomorrow_morning', 'tomorrow_evening'].includes(delivery_type)) {
              return (options.includes('tomorrow_morning') || options.includes('tomorrow_evening') || options.includes('tomorrow')) && scheduledStock > 0;
            }
            return expressStock > 0 || scheduledStock > 0 || totalStock > 0;
          })
          .map(p => {
            const subId = p.subCategoryId || p.sub_category_id;
            return subToCatMap.get(subId) || p.subCategory?.categoryId || p.sub_category?.categoryId || p.subCategory?.category?.id;
          })
          .filter(Boolean)
      );
      data = data.filter(c => storeCategoryIds.has(c.id));
    }
    return successResponse(res, data, 'Categories fetched successfully');
  } catch (error) {
    return errorResponse(res, 'Failed to fetch categories', 500, error.message);
  }
};

export const getCategoryTree = async (req, res) => {
  try {
    const { store_id, delivery_type } = req.query;
    let data = await custRepo.getCategoryTree();
    if (store_id) {
      const storeProducts = await custRepo.findProducts({ storeId: store_id, limit: 500 });
      const availableProducts = (storeProducts || []).filter(p => {
        const options = p.deliveryOptions || p.delivery_options || [];
        const expressStock = Number(p.expressStockQty ?? p.express_stock_qty ?? 0);
        const scheduledStock = Number(p.scheduledStockQty ?? p.scheduled_stock_qty ?? 0);
        const totalStock = Number(p.stockQuantity ?? p.stock_quantity ?? 0);

        if (delivery_type === 'express') {
          return options.includes('express') && expressStock > 0;
        }
        if (['tomorrow', 'tomorrow_morning', 'tomorrow_evening'].includes(delivery_type)) {
          return (options.includes('tomorrow_morning') || options.includes('tomorrow_evening') || options.includes('tomorrow')) && scheduledStock > 0;
        }
        return expressStock > 0 || scheduledStock > 0 || totalStock > 0;
      });

      const storeSubCatIds = new Set(
        availableProducts.map(p => p.subCategoryId || p.sub_category_id).filter(Boolean)
      );

      data = data
        .map(c => {
          const validSubs = (c.subCategories || c.sub_categories || []).filter(sub => storeSubCatIds.has(sub.id));
          return {
            ...c,
            subCategories: validSubs,
            sub_categories: validSubs
          };
        })
        .filter(c => (c.subCategories && c.subCategories.length > 0) || (c.sub_categories && c.sub_categories.length > 0));
    }
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
    const { store_id, delivery_type } = req.query;
    const data = await custService.getHomeScreenData(store_id, delivery_type);
    return successResponse(res, data, 'Home screen data fetched');
  } catch (error) {
    return errorResponse(res, 'Failed to fetch home screen data', 500, error.message);
  }
};

export const getNearestStore = async (req, res) => {
  const { lat, lng, pincode } = req.query;

  try {
    const result = await custService.findNearestStore(
      lat ? Number(lat) : null,
      lng ? Number(lng) : null,
      pincode ? String(pincode).trim() : null
    );
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
    const q = req.query;
    const products = await custRepo.findProducts({
      search: q.search,
      categoryId: q.category_id || q.categoryId,
      subCategoryId: q.sub_category_id || q.subCategoryId,
      storeId: q.store_id || q.storeId,
      isDeal: q.is_deal !== undefined ? q.is_deal : q.isDeal,
      isFeatured: q.is_featured !== undefined ? q.is_featured : q.isFeatured,
      isFlashSale: q.is_flash_sale !== undefined ? q.is_flash_sale : q.isFlashSale,
      isTrending: q.is_trending !== undefined ? q.is_trending : q.isTrending,
      isExclusive: q.is_exclusive !== undefined ? q.is_exclusive : q.isExclusive,
      isNewLaunch: q.is_new_launch !== undefined ? q.is_new_launch : q.isNewLaunch,
      isFrozen: q.is_frozen !== undefined ? q.is_frozen : q.isFrozen,
      limit: q.limit ? Number(q.limit) : 50,
      offset: q.offset ? Number(q.offset) : 0
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

export const getStoreById = async (req, res) => {
  try {
    const { id } = req.params;
    const store = await custRepo.findStoreById(id);
    if (!store) {
      return errorResponse(res, 'Store not found', 404);
    }
    return successResponse(res, store, 'Store details fetched');
  } catch (error) {
    return errorResponse(res, 'Failed to fetch store', 500, error.message);
  }
};
