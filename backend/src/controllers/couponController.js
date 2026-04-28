import { supabaseAdmin } from '../config/supabase.js';
import { successResponse, errorResponse } from '../utils/response.js';

/**
 * --- ADMIN CONTROLLERS ---
 */

export const createCoupon = async (req, res) => {
  const { 
    code, description, discount_type, discount_value, 
    min_order_amount, max_discount_amount, start_date, end_date, usage_limit 
  } = req.body;

  if (!code || !discount_type || !discount_value) {
    return errorResponse(res, 'Code, discount type, and value are required', 400);
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('coupons')
      .insert([{
        code: code.toUpperCase().trim(),
        description: description || null,
        discount_type,
        discount_value: parseFloat(discount_value),
        min_order_amount: (min_order_amount && min_order_amount !== '') ? parseFloat(min_order_amount) : 0,
        max_discount_amount: (max_discount_amount && max_discount_amount !== '') ? parseFloat(max_discount_amount) : null,
        start_date: (start_date && start_date !== '') ? start_date : new Date(),
        end_date: (end_date && end_date !== '') ? end_date : null,
        usage_limit: (usage_limit && usage_limit !== '') ? parseInt(usage_limit) : null,
        is_active: true
      }])
      .select()
      .single();

    if (error) {
      console.error('[Coupon] Create error:', error);
      return errorResponse(res, 'Failed to create coupon', 400, error);
    }
    return successResponse(res, { coupon: data }, 'Coupon created successfully', 201);
  } catch (error) {
    return errorResponse(res, 'Internal server error', 500, error);
  }
};

export const listCoupons = async (req, res) => {
  const { page = 1, pageSize = 50, search } = req.query;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  try {
    let query = supabaseAdmin
      .from('coupons')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (search) {
      query = query.ilike('code', `%${search}%`);
    }

    const { data, count, error } = await query.range(from, to);

    if (error) return errorResponse(res, 'Failed to fetch coupons', 400, error);
    return successResponse(res, { 
      coupons: data, 
      pagination: { total: count, page: Number(page), pageSize: Number(pageSize) } 
    });
  } catch (error) {
    return errorResponse(res, 'Internal server error', 500, error);
  }
};

export const updateCoupon = async (req, res) => {
  const { id } = req.params;
  const body = req.body;

  // Sanitize numeric and date fields to handle empty strings
  const updateData = { ...body };
  
  if (updateData.discount_value !== undefined) updateData.discount_value = parseFloat(updateData.discount_value);
  
  if (updateData.min_order_amount === '') updateData.min_order_amount = 0;
  else if (updateData.min_order_amount !== undefined) updateData.min_order_amount = parseFloat(updateData.min_order_amount);
  
  if (updateData.max_discount_amount === '') updateData.max_discount_amount = null;
  else if (updateData.max_discount_amount !== undefined) updateData.max_discount_amount = parseFloat(updateData.max_discount_amount);
  
  if (updateData.usage_limit === '') updateData.usage_limit = null;
  else if (updateData.usage_limit !== undefined) updateData.usage_limit = parseInt(updateData.usage_limit);
  
  if (updateData.start_date === '') updateData.start_date = new Date();
  if (updateData.end_date === '') updateData.end_date = null;

  try {
    const { data, error } = await supabaseAdmin
      .from('coupons')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[Coupon] Update error:', error);
      return errorResponse(res, 'Failed to update coupon', 400, error);
    }
    return successResponse(res, { coupon: data }, 'Coupon updated successfully');
  } catch (error) {
    return errorResponse(res, 'Internal server error', 500, error);
  }
};

export const deleteCoupon = async (req, res) => {
  const { id } = req.params;
  try {
    const { error } = await supabaseAdmin.from('coupons').delete().eq('id', id);
    if (error) return errorResponse(res, 'Failed to delete coupon', 400, error);
    return successResponse(res, null, 'Coupon deleted successfully');
  } catch (error) {
    return errorResponse(res, 'Internal server error', 500, error);
  }
};

/**
 * --- CUSTOMER CONTROLLERS ---
 */

export const validateCoupon = async (req, res) => {
  const { code, order_amount } = req.body;

  if (!code) return errorResponse(res, 'Coupon code is required', 400);

  try {
    const { data: coupon, error } = await supabaseAdmin
      .from('coupons')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .single();

    if (error || !coupon) return errorResponse(res, 'Invalid or inactive coupon code', 404);

    // 1. Check Date
    const now = new Date();
    if (coupon.start_date && new Date(coupon.start_date) > now) {
      return errorResponse(res, 'This coupon is not yet active', 400);
    }
    if (coupon.end_date && new Date(coupon.end_date) < now) {
      return errorResponse(res, 'This coupon has expired', 400);
    }

    // 2. Check Usage Limit
    if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
      return errorResponse(res, 'This coupon has reached its usage limit', 400);
    }

    // 3. Check Minimum Order Amount
    if (order_amount < coupon.min_order_amount) {
      return errorResponse(res, `Minimum order amount for this coupon is ₹${coupon.min_order_amount}`, 400);
    }

    // 4. Calculate Discount
    let discount = 0;
    if (coupon.discount_type === 'fixed') {
      discount = Number(coupon.discount_value);
    } else {
      discount = (order_amount * Number(coupon.discount_value)) / 100;
      if (coupon.max_discount_amount && discount > coupon.max_discount_amount) {
        discount = Number(coupon.max_discount_amount);
      }
    }

    // Ensure discount doesn't exceed order amount
    discount = Math.min(discount, order_amount);

    return successResponse(res, { 
      coupon_id: coupon.id,
      code: coupon.code,
      discount_amount: discount,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value
    }, 'Coupon validated successfully');

  } catch (error) {
    return errorResponse(res, 'Internal server error', 500, error);
  }
};
