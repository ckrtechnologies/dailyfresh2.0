import { db } from '../../db/index.js';
import {
  profiles, stores, riders, riderDistanceLogs, orders, orderItems,
  categories, subCategories, products, productVariants, settings,
  banners, homeSections, deliverySlots, coupons
} from '../../db/schema.js';
import { eq, and, desc, asc, sql, count, inArray, gte, lte, ilike } from 'drizzle-orm';

// --- DASHBOARD STATS ---
export const getDashboardMetrics = async () => {
  try {
    const ordersRes = await db.select({ count: count() }).from(orders);
    const customersRes = await db.select({ count: count() }).from(profiles).where(eq(profiles.role, "customer"));
    const storesRes = await db.select({ count: count() }).from(stores).where(eq(stores.isActive, true));
    const ridersRes = await db.select({ count: count() }).from(riders).where(eq(riders.approvalStatus, "approved"));
    const totalRidersRes = await db.select({ count: count() }).from(riders);
    const cancelledRes = await db.select({ count: count() }).from(orders).where(eq(orders.status, "cancelled"));
    const revenueRes = await db.select({ total: sql`COALESCE(SUM(total_amount), 0)` }).from(orders).where(eq(orders.status, "delivered"));

    const revenue = Number(revenueRes[0]?.total || 0);
    const totalOrders = ordersRes[0]?.count || 0;
    const aov = totalOrders > 0 ? Math.round(revenue / totalOrders) : 0;

    // Fetch 5 most recent live orders
    const liveOrders = await db.query.orders.findMany({
      with: {
        user: true,
        store: true
      },
      orderBy: [desc(orders.createdAt)],
      limit: 5
    });

    const formattedOrders = liveOrders.map(o => ({
      id: o.id,
      order_number: o.orderNumber,
      total_amount: o.totalAmount,
      status: o.status,
      created_at: o.createdAt,
      customer: o.user ? { full_name: o.user.fullName, phone: o.user.phone } : null,
      store: o.store ? { name: o.store.name } : null
    }));

    // Fetch low stock items (<= 5 units)
    const lowStockProducts = await db.query.products.findMany({
      where: lte(products.stockQuantity, 5),
      with: {
        store: true
      },
      limit: 5
    });

    const formattedLowStock = lowStockProducts.map(p => ({
      name: p.name,
      stock_quantity: p.stockQuantity || 0,
      weight_unit: p.weightUnit || "kg",
      store: p.store ? { name: p.store.name } : { name: "Hub" }
    }));

    const stats = {
      revenue,
      total_revenue: revenue,
      orders: totalOrders,
      total_orders: totalOrders,
      customers: customersRes[0]?.count || 0,
      total_customers: customersRes[0]?.count || 0,
      active_stores: storesRes[0]?.count || 0,
      active_riders: ridersRes[0]?.count || 0,
      total_riders: totalRidersRes[0]?.count || 0,
      cancelled_orders: cancelledRes[0]?.count || 0,
      aov
    };

    return {
      stats,
      live_orders: formattedOrders,
      low_stock: formattedLowStock
    };
  } catch (err) {
    console.error("[Admin Repo Dashboard Error]:", err.message);
    return {
      stats: {
        revenue: 0,
        orders: 0,
        customers: 0,
        active_stores: 0,
        active_riders: 0,
        total_riders: 0,
        cancelled_orders: 0,
        aov: 0
      },
      live_orders: [],
      low_stock: []
    };
  }
};

// --- STORES ---
export const listStores = async () => {
  return await db.select().from(stores).orderBy(desc(stores.createdAt));
};

export const createStore = async (data) => {
  const [store] = await db.insert(stores).values(data).returning();
  return store;
};

export const updateStore = async (id, data) => {
  const [store] = await db.update(stores).set({ ...data, updatedAt: new Date() }).where(eq(stores.id, id)).returning();
  return store;
};

export const deleteStore = async (id) => {
  return await db.delete(stores).where(eq(stores.id, id));
};

// --- RIDERS ---
export const listRiders = async () => {
  return await db.query.riders.findMany({
    with: {
      profile: true,
      store: true
    },
    orderBy: [desc(riders.createdAt)]
  });
};

export const updateRiderStatus = async (riderId, data) => {
  const [updated] = await db.update(riders).set({ ...data, updatedAt: new Date() }).where(eq(riders.id, riderId)).returning();
  return updated;
};

export const listRiderDistanceLogs = async () => {
  return await db.query.riderDistanceLogs.findMany({
    with: {
      rider: {
        with: {
          profile: true
        }
      }
    },
    orderBy: [desc(riderDistanceLogs.logDate)]
  });
};

// --- ORDERS ---
export const listOrders = async ({ limit = 50, offset = 0, status, storeId }) => {
  const conditions = [];
  if (status && status !== 'all') conditions.push(eq(orders.status, status));
  if (storeId) conditions.push(eq(orders.storeId, storeId));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const items = await db.query.orders.findMany({
    where: whereClause,
    with: {
      store: true,
      user: true,
      rider: true,
      deliverySlot: true,
      items: {
        with: {
          product: true,
          variant: true
        }
      }
    },
    orderBy: [desc(orders.createdAt)],
    limit,
    offset
  });

  const totalRes = await db.select({ count: count() }).from(orders).where(whereClause);

  return { orders: items, total: totalRes[0]?.count || 0 };
};

export const updateOrderStatus = async (orderId, status, extraFields = {}) => {
  const [updated] = await db.update(orders).set({ status, updatedAt: new Date(), ...extraFields }).where(eq(orders.id, orderId)).returning();
  return updated;
};

// --- STAFF & PROFILES ---
export const listStaff = async () => {
  return await db.select().from(profiles).where(inArray(profiles.role, ['admin', 'store_manager', 'rider'])).orderBy(desc(profiles.createdAt));
};

export const listCustomers = async () => {
  return await db.select().from(profiles).where(eq(profiles.role, 'customer')).orderBy(desc(profiles.createdAt));
};

export const deleteStaff = async (id) => {
  return await db.delete(profiles).where(eq(profiles.id, id));
};

// --- CATALOGUE ---
export const listCategories = async () => {
  return await db.select().from(categories).orderBy(asc(categories.displayOrder));
};

export const createCategory = async (data) => {
  const [cat] = await db.insert(categories).values(data).returning();
  return cat;
};

export const updateCategory = async (id, data) => {
  const [cat] = await db.update(categories).set({ ...data, updatedAt: new Date() }).where(eq(categories.id, id)).returning();
  return cat;
};

export const deleteCategory = async (id) => {
  return await db.delete(categories).where(eq(categories.id, id));
};

export const listSubCategories = async () => {
  return await db.query.subCategories.findMany({
    with: { category: true },
    orderBy: [asc(subCategories.displayOrder)]
  });
};

export const createSubCategory = async (data) => {
  const [sub] = await db.insert(subCategories).values(data).returning();
  return sub;
};

export const updateSubCategory = async (id, data) => {
  const [sub] = await db.update(subCategories).set({ ...data, updatedAt: new Date() }).where(eq(subCategories.id, id)).returning();
  return sub;
};

export const deleteSubCategory = async (id) => {
  return await db.delete(subCategories).where(eq(subCategories.id, id));
};

export const listProducts = async ({ limit = 50, offset = 0, storeId }) => {
  const conditions = [];
  if (storeId) conditions.push(eq(products.storeId, storeId));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  return await db.query.products.findMany({
    where: whereClause,
    with: {
      subCategory: { with: { category: true } },
      variants: true,
      store: true
    },
    orderBy: [desc(products.createdAt)],
    limit,
    offset
  });
};

export const createProduct = async (data, variants = []) => {
  return await db.transaction(async (tx) => {
    const [prod] = await tx.insert(products).values(data).returning();
    if (variants && variants.length > 0) {
      await tx.insert(productVariants).values(variants.map(v => ({ ...v, productId: prod.id })));
    }
    return prod;
  });
};

export const updateProduct = async (id, data) => {
  const [prod] = await db.update(products).set({ ...data, updatedAt: new Date() }).where(eq(products.id, id)).returning();
  return prod;
};

export const deleteProduct = async (id) => {
  return await db.delete(products).where(eq(products.id, id));
};

// --- BANNERS & HOME SECTIONS ---
export const listBanners = async () => {
  return await db.select().from(banners).orderBy(asc(banners.displayOrder));
};

export const createBanner = async (data) => {
  const [b] = await db.insert(banners).values(data).returning();
  return b;
};

export const updateBanner = async (id, data) => {
  const [b] = await db.update(banners).set({ ...data, updatedAt: new Date() }).where(eq(banners.id, id)).returning();
  return b;
};

export const deleteBanner = async (id) => {
  return await db.delete(banners).where(eq(banners.id, id));
};

export const listHomeSections = async () => {
  return await db.select().from(homeSections).orderBy(asc(homeSections.displayOrder));
};

export const updateHomeSection = async (id, data) => {
  const [sec] = await db.update(homeSections).set({ ...data, updatedAt: new Date() }).where(eq(homeSections.id, id)).returning();
  return sec;
};

// --- DELIVERY SLOTS ---
export const listDeliverySlots = async () => {
  return await db.select().from(deliverySlots).orderBy(asc(deliverySlots.type), asc(deliverySlots.displayOrder));
};

export const createDeliverySlot = async (data) => {
  const [slot] = await db.insert(deliverySlots).values(data).returning();
  return slot;
};

export const updateDeliverySlot = async (id, data) => {
  const [slot] = await db.update(deliverySlots).set({ ...data, updatedAt: new Date() }).where(eq(deliverySlots.id, id)).returning();
  return slot;
};

export const deleteDeliverySlot = async (id) => {
  return await db.delete(deliverySlots).where(eq(deliverySlots.id, id));
};

// --- COUPONS ---
export const listCoupons = async () => {
  return await db.select().from(coupons).orderBy(desc(coupons.createdAt));
};

export const createCoupon = async (data) => {
  const [c] = await db.insert(coupons).values(data).returning();
  return c;
};

export const updateCoupon = async (id, data) => {
  const [c] = await db.update(coupons).set({ ...data, updatedAt: new Date() }).where(eq(coupons.id, id)).returning();
  return c;
};

export const deleteCoupon = async (id) => {
  return await db.delete(coupons).where(eq(coupons.id, id));
};
