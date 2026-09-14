import { db } from '../../db/index.js';
import { orders, orderItems, products, stores } from '../../db/schema.js';
import { sql, eq, and, gte, lte, desc, ne } from 'drizzle-orm';
import { successResponse, errorResponse } from '../../utils/response.js';

// Helper to normalize and safely order date ranges
const normalizeDateRange = (startDate, endDate) => {
  let start = null;
  let end = null;
  if (startDate) {
    start = new Date(startDate.length === 10 ? `${startDate}T00:00:00` : startDate);
  }
  if (endDate) {
    end = new Date(endDate.length === 10 ? `${endDate}T23:59:59.999` : endDate);
  }
  if (start && isNaN(start.getTime())) start = null;
  if (end && isNaN(end.getTime())) end = null;
  if (start && end && start > end) {
    const temp = start;
    start = end;
    end = temp;
  }
  return { start, end };
};

/**
 * GET /api/v1/admin/analytics/revenue-chart
 * Query params: startDate, endDate, store_id, granularity (day/month)
 */
export const getRevenueChart = async (req, res) => {
  try {
    const { startDate, endDate, store_id } = req.query;
    const { start, end } = normalizeDateRange(startDate, endDate);

    const conditions = [ne(orders.status, 'cancelled')];

    if (start) {
      conditions.push(gte(orders.createdAt, start));
    }
    if (end) {
      conditions.push(lte(orders.createdAt, end));
    }
    if (store_id) {
      conditions.push(eq(orders.storeId, store_id));
    }

    const whereClause = and(...conditions);

    // Group by Date
    const dailyData = await db
      .select({
        date: sql`TO_CHAR(${orders.createdAt}, 'YYYY-MM-DD')`,
        revenue: sql`COALESCE(SUM(${orders.totalAmount}::numeric), 0)::float`,
        ordersCount: sql`COUNT(*)::int`
      })
      .from(orders)
      .where(whereClause)
      .groupBy(sql`TO_CHAR(${orders.createdAt}, 'YYYY-MM-DD')`)
      .orderBy(sql`TO_CHAR(${orders.createdAt}, 'YYYY-MM-DD')`);

    return successResponse(res, {
      chart: dailyData.map(d => ({
        date: d.date,
        revenue: Math.round(d.revenue),
        orders: d.ordersCount
      }))
    });
  } catch (error) {
    console.error('[ANALYTICS] Revenue chart error:', error);
    return errorResponse(res, 'Failed to fetch revenue chart data', 500, error.message);
  }
};

/**
 * GET /api/v1/admin/analytics/orders-by-status
 * Distribution of orders by logistics stage for donut/pie chart
 */
export const getOrdersByStatus = async (req, res) => {
  try {
    const { startDate, endDate, store_id } = req.query;
    const { start, end } = normalizeDateRange(startDate, endDate);
    const conditions = [];

    if (start) conditions.push(gte(orders.createdAt, start));
    if (end) conditions.push(lte(orders.createdAt, end));
    if (store_id) conditions.push(eq(orders.storeId, store_id));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const statusCounts = await db
      .select({
        status: orders.status,
        count: sql`COUNT(*)::int`
      })
      .from(orders)
      .where(whereClause)
      .groupBy(orders.status);

    return successResponse(res, { statuses: statusCounts });
  } catch (error) {
    console.error('[ANALYTICS] Orders by status error:', error);
    return errorResponse(res, 'Failed to fetch orders by status', 500, error.message);
  }
};

/**
 * GET /api/v1/admin/analytics/top-products
 * Ranking of best-selling products by quantity and revenue
 */
export const getTopProducts = async (req, res) => {
  try {
    const { limit = 8, store_id, startDate, endDate } = req.query;
    const { start, end } = normalizeDateRange(startDate, endDate);

    const conditions = [ne(orders.status, 'cancelled')];
    if (store_id) conditions.push(eq(orderItems.storeId, store_id));
    if (start) conditions.push(gte(orders.createdAt, start));
    if (end) conditions.push(lte(orders.createdAt, end));

    const topProducts = await db
      .select({
        productId: orderItems.productId,
        name: orderItems.name,
        totalQuantity: sql`SUM(${orderItems.quantity})::int`,
        totalRevenue: sql`SUM(${orderItems.totalPrice}::numeric)::float`
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(and(...conditions))
      .groupBy(orderItems.productId, orderItems.name)
      .orderBy(desc(sql`SUM(${orderItems.quantity})`))
      .limit(Number(limit));

    return successResponse(res, {
      products: topProducts.map(p => ({
        product_id: p.productId,
        name: p.name,
        units_sold: p.totalQuantity || 0,
        revenue: Math.round(p.totalRevenue || 0)
      }))
    });
  } catch (error) {
    console.error('[ANALYTICS] Top products error:', error);
    return errorResponse(res, 'Failed to fetch top products', 500, error.message);
  }
};

/**
 * GET /api/v1/admin/analytics/store-performance
 * Store-level breakdown of orders and total revenue
 */
export const getStorePerformance = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const { start, end } = normalizeDateRange(startDate, endDate);
    const orderMatch = [eq(stores.id, orders.storeId)];
    if (start) orderMatch.push(gte(orders.createdAt, start));
    if (end) orderMatch.push(lte(orders.createdAt, end));

    const storeStats = await db
      .select({
        storeId: stores.id,
        storeName: stores.name,
        ordersCount: sql`COUNT(CASE WHEN ${orders.status} != 'cancelled' AND ${orders.id} IS NOT NULL THEN 1 ELSE NULL END)::int`,
        revenue: sql`COALESCE(SUM(CASE WHEN ${orders.status} != 'cancelled' THEN ${orders.totalAmount}::numeric ELSE 0 END), 0)::float`
      })
      .from(stores)
      .leftJoin(orders, and(...orderMatch))
      .where(eq(stores.isActive, true))
      .groupBy(stores.id, stores.name)
      .orderBy(desc(sql`COALESCE(SUM(CASE WHEN ${orders.status} != 'cancelled' THEN ${orders.totalAmount}::numeric ELSE 0 END), 0)`));

    return successResponse(res, {
      stores: storeStats.map(s => ({
        store_id: s.storeId,
        name: s.storeName,
        orders: s.ordersCount,
        revenue: Math.round(s.revenue)
      }))
    });
  } catch (error) {
    console.error('[ANALYTICS] Store performance error:', error);
    return errorResponse(res, 'Failed to fetch store performance', 500, error.message);
  }
};
