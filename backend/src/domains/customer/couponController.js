import * as custRepo from './repository.js';
import * as custService from './service.js';
import { successResponse, errorResponse } from '../../utils/response.js';

export const listCoupons = async (req, res) => {
  try {
    const coupons = await custRepo.getActiveCoupons();
    return successResponse(res, coupons, 'Coupons fetched');
  } catch (error) {
    return errorResponse(res, 'Failed to fetch coupons', 500, error.message);
  }
};

export const validateCoupon = async (req, res) => {
  const { code, order_amount, orderAmount } = req.body;
  if (!code) {
    return errorResponse(res, 'Coupon code is required', 400);
  }

  try {
    const result = await custService.validateCoupon(code, order_amount || orderAmount || 0);
    return successResponse(res, result, 'Coupon applied successfully');
  } catch (error) {
    return errorResponse(res, error.message || 'Failed to validate coupon', error.status || 400);
  }
};
