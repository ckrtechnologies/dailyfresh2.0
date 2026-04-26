import { supabaseAdmin } from '../config/supabase.js';
import { successResponse, errorResponse } from '../utils/response.js';

/**
 * Get active banners for specific placement
 */
export const getBanners = async (req, res) => {
  const { placement } = req.query;

  try {
    let query = supabaseAdmin
      .from('banners')
      .select('*')
      .eq('is_active', true);

    if (placement) {
      query = query.eq('placement', placement);
    }

    // Only get banners that have started and not yet expired
    const now = new Date().toISOString();
    
    const { data, error } = await query
      .or(`valid_from.lte.${now},valid_from.is.null`)
      .or(`valid_until.gte.${now},valid_until.is.null`)
      .order('display_order', { ascending: true });

    if (error) return errorResponse(res, 'Failed to fetch banners', 400, error);
    return successResponse(res, { banners: data });
  } catch (error) {
    return errorResponse(res, 'Internal server error', 500, error);
  }
};
