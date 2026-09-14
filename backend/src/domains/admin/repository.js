import { db } from '../../db/index.js';
import {
  profiles, stores, riders, riderDistanceLogs, orders, orderItems,
  categories, subCategories, products, productVariants, settings,
  banners, homeSections, deliverySlots, coupons, cartItems, addresses
} from '../../db/schema.js';
import { eq, ne, and, desc, asc, sql, count, inArray, gte, lte, ilike } from 'drizzle-orm';

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

// --- DASHBOARD STATS ---
export const getDashboardMetrics = async ({ startDate, endDate, storeId } = {}) => {
  try {
    const { start, end } = normalizeDateRange(startDate, endDate);
    const orderConditions = [];
    if (storeId) orderConditions.push(eq(orders.storeId, storeId));
    if (start) orderConditions.push(gte(orders.createdAt, start));
    if (end) orderConditions.push(lte(orders.createdAt, end));
    const orderWhere = orderConditions.length > 0 ? and(...orderConditions) : undefined;

    const cancelledConditions = [eq(orders.status, 'cancelled'), ...orderConditions];
    // Non-cancelled revenue to match Revenue Trend chart
    const revenueConditions = [ne(orders.status, 'cancelled'), ...orderConditions];

    const ordersRes = await db.select({ count: count() }).from(orders).where(orderWhere);
    
    // Customers count: respects date range and store selection
    let customerCount = 0;
    if (storeId) {
      const storeCustRes = await db
        .select({ count: sql`COUNT(DISTINCT ${orders.userId})::int` })
        .from(orders)
        .where(orderWhere);
      customerCount = storeCustRes[0]?.count || 0;
    } else {
      const custConditions = [eq(profiles.role, "customer")];
      if (start) custConditions.push(gte(profiles.createdAt, start));
      if (end) custConditions.push(lte(profiles.createdAt, end));
      const customersRes = await db.select({ count: count() }).from(profiles).where(and(...custConditions));
      customerCount = customersRes[0]?.count || 0;
    }

    // Active stores count
    let storeCount = 0;
    if (storeId) {
      const singleStore = await db.select({ count: count() }).from(stores).where(and(eq(stores.id, storeId), eq(stores.isActive, true)));
      storeCount = singleStore[0]?.count || 0;
    } else {
      const storesRes = await db.select({ count: count() }).from(stores).where(eq(stores.isActive, true));
      storeCount = storesRes[0]?.count || 0;
    }

    // Riders count: respects store selection
    const riderConditions = [eq(riders.approvalStatus, "approved")];
    const totalRiderConditions = [];
    if (storeId) {
      riderConditions.push(eq(riders.storeId, storeId));
      totalRiderConditions.push(eq(riders.storeId, storeId));
    }
    const ridersRes = await db.select({ count: count() }).from(riders).where(and(...riderConditions));
    const totalRidersRes = await db.select({ count: count() }).from(riders).where(totalRiderConditions.length > 0 ? and(...totalRiderConditions) : undefined);

    const cancelledRes = await db.select({ count: count() }).from(orders).where(and(...cancelledConditions));
    const revenueRes = await db.select({ total: sql`COALESCE(SUM(total_amount), 0)` }).from(orders).where(and(...revenueConditions));

    const revenue = Number(revenueRes[0]?.total || 0);
    const totalOrders = ordersRes[0]?.count || 0;
    const aov = totalOrders > 0 ? Math.round(revenue / totalOrders) : 0;

    // Fetch 5 most recent live orders respecting store & date
    const liveOrders = await db.query.orders.findMany({
      where: orderWhere,
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

    // Fetch low stock items (<= 5 units), filtered by storeId if present
    const lowStockConditions = [lte(products.stockQuantity, 5)];
    if (storeId) lowStockConditions.push(eq(products.storeId, storeId));

    const lowStockProducts = await db.query.products.findMany({
      where: and(...lowStockConditions),
      with: {
        store: true
      },
      limit: 5
    });

    const formattedLowStock = lowStockProducts.map(p => ({
      id: p.id,
      name: p.name,
      stock_quantity: p.stockQuantity || 0,
      weight_unit: p.weightUnit || "kg",
      store: p.store ? { id: p.store.id, name: p.store.name } : { name: "Hub" },
      store_id: p.storeId
    }));

    const stats = {
      revenue,
      total_revenue: revenue,
      orders: totalOrders,
      total_orders: totalOrders,
      customers: customerCount,
      total_customers: customerCount,
      active_stores: storeCount,
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

export const getStoreDependencies = async (id) => {
  const [store] = await db.select().from(stores).where(eq(stores.id, id));
  if (!store) return null;

  const [prodCount] = await db.select({ count: count() }).from(products).where(eq(products.storeId, id));
  const [orderCount] = await db.select({ count: count() }).from(orders).where(eq(orders.storeId, id));
  const [riderCount] = await db.select({ count: count() }).from(riders).where(eq(riders.assignedStoreId, id));

  return {
    store,
    productCount: Number(prodCount?.count || 0),
    orderCount: Number(orderCount?.count || 0),
    riderCount: Number(riderCount?.count || 0),
    hasManager: !!store.managerUserId,
    managerUserId: store.managerUserId
  };
};

export const deleteStore = async (id, { deleteManager = false } = {}) => {
  const [store] = await db.select().from(stores).where(eq(stores.id, id));
  if (!store) return null;

  const managerId = store.managerUserId;

  // Clean up any remaining cart items for this store
  await db.delete(cartItems).where(eq(cartItems.storeId, id));

  // Delete the store
  const deleted = await db.delete(stores).where(eq(stores.id, id)).returning();

  // If requested and manager exists, delete the manager profile
  if (deleteManager && managerId) {
    try {
      await db.delete(profiles).where(eq(profiles.id, managerId));
    } catch (mgrErr) {
      console.warn('Could not delete manager profile after store deletion:', mgrErr.message);
    }
  }

  return deleted;
};

// --- RIDERS ---
export const listRiders = async ({ search, storeId, startDate, endDate, approvalStatus, isOnline, limit = 100, offset = 0 } = {}) => {
  const { start, end } = normalizeDateRange(startDate, endDate);
  const conditions = [];
  if (storeId) conditions.push(eq(riders.storeId, storeId));
  if (approvalStatus) conditions.push(eq(riders.approvalStatus, approvalStatus));
  if (isOnline !== undefined && isOnline !== '') {
    conditions.push(eq(riders.isOnline, isOnline === 'true' || isOnline === true));
  }
  if (start) conditions.push(gte(riders.createdAt, start));
  if (end) conditions.push(lte(riders.createdAt, end));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const rawRiders = await db.query.riders.findMany({
    where: whereClause,
    with: {
      profile: true,
      store: true
    },
    orderBy: [desc(riders.createdAt)],
    limit,
    offset
  });

  if (search) {
    const s = search.toLowerCase();
    return rawRiders.filter(r =>
      (r.profile?.fullName && r.profile.fullName.toLowerCase().includes(s)) ||
      (r.profile?.phone && r.profile.phone.toLowerCase().includes(s)) ||
      (r.vehicleNumber && r.vehicleNumber.toLowerCase().includes(s))
    );
  }

  return rawRiders;
};

export const updateRiderStatus = async (riderId, data) => {
  const [updated] = await db.update(riders).set({ ...data, updatedAt: new Date() }).where(eq(riders.id, riderId)).returning();
  return updated;
};

export const listRiderDistanceLogs = async ({ startDate, endDate, storeId, limit = 50, offset = 0 } = {}) => {
  const { start, end } = normalizeDateRange(startDate, endDate);
  const conditions = [];
  if (storeId) conditions.push(eq(riderDistanceLogs.storeId, storeId));
  if (start) conditions.push(gte(riderDistanceLogs.logDate, start));
  if (end) conditions.push(lte(riderDistanceLogs.logDate, end));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  return await db.query.riderDistanceLogs.findMany({
    where: whereClause,
    with: {
      rider: {
        with: {
          profile: true,
          store: true
        }
      }
    },
    orderBy: [desc(riderDistanceLogs.logDate)],
    limit,
    offset
  });
};

// --- ORDERS ---
export const listOrders = async ({ limit = 50, offset = 0, status, storeId, startDate, endDate, search, orderId, id }) => {
  const { start, end } = normalizeDateRange(startDate, endDate);
  const conditions = [];
  const targetId = orderId || id;
  if (targetId) {
    conditions.push(eq(orders.id, targetId));
  } else {
    if (status && status !== 'all') conditions.push(eq(orders.status, status));
    if (storeId) conditions.push(eq(orders.storeId, storeId));
    if (start) conditions.push(gte(orders.createdAt, start));
    if (end) conditions.push(lte(orders.createdAt, end));
    if (search) {
      conditions.push(
        sql`(${orders.orderNumber} ILIKE ${`%${search}%`} OR ${orders.userId} IN (SELECT id FROM profiles WHERE full_name ILIKE ${`%${search}%`} OR phone ILIKE ${`%${search}%`}))`
      );
    }
  }

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

export const getOrderById = async (orderId) => {
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  return order;
};

export const updateOrderRefund = async (orderId, { refundAmount, reason }) => {
  const [updated] = await db
    .update(orders)
    .set({
      paymentStatus: 'refunded',
      cancellationReason: reason ? `[REFUND ₹${refundAmount}]: ${reason}` : undefined,
      updatedAt: new Date()
    })
    .where(eq(orders.id, orderId))
    .returning();
  return updated;
};

export const updateOrderStatus = async (orderId, status, extraFields = {}) => {
  const [updated] = await db.update(orders).set({ status, updatedAt: new Date(), ...extraFields }).where(eq(orders.id, orderId)).returning();
  return updated;
};

// --- STAFF & PROFILES ---
export const listStaff = async () => {
  return await db.select().from(profiles).where(inArray(profiles.role, ['admin', 'store_manager', 'rider'])).orderBy(desc(profiles.createdAt));
};

export const listCustomers = async ({ search, storeId, startDate, endDate, limit = 50, offset = 0 } = {}) => {
  const { start, end } = normalizeDateRange(startDate, endDate);
  const conditions = [eq(profiles.role, 'customer')];
  if (search) {
    conditions.push(
      sql`(${profiles.fullName} ILIKE ${`%${search}%`} OR ${profiles.phone} ILIKE ${`%${search}%`} OR ${profiles.email} ILIKE ${`%${search}%`})`
    );
  }
  if (start) conditions.push(gte(profiles.createdAt, start));
  if (end) conditions.push(lte(profiles.createdAt, end));
  if (storeId) {
    conditions.push(
      sql`${profiles.id} IN (SELECT DISTINCT user_id FROM orders WHERE store_id = ${storeId} AND user_id IS NOT NULL)`
    );
  }

  const whereClause = and(...conditions);
  const items = await db.select().from(profiles).where(whereClause).orderBy(desc(profiles.createdAt)).limit(limit).offset(offset);
  const totalRes = await db.select({ count: count() }).from(profiles).where(whereClause);

  return { customers: items, total: totalRes[0]?.count || 0 };
};

export const deleteStaff = async (id) => {
  return await db.delete(profiles).where(eq(profiles.id, id));
};

export const findProfileByEmail = async (email) => {
  if (!email) return null;
  const [profile] = await db.select().from(profiles).where(eq(profiles.email, email.trim().toLowerCase())).limit(1);
  return profile;
};

export const createCustomer = async (data) => {
  const [customer] = await db.insert(profiles).values({
    ...data,
    role: 'customer',
    createdAt: new Date(),
    updatedAt: new Date()
  }).returning();
  return customer;
};

export const getCustomerById = async (id) => {
  const [customer] = await db.select().from(profiles).where(and(eq(profiles.id, id), eq(profiles.role, 'customer'))).limit(1);
  return customer;
};

export const getCustomerAddresses = async (userId) => {
  try {
    return await db.select().from(addresses).where(eq(addresses.userId, userId)).orderBy(desc(addresses.isDefault), desc(addresses.createdAt));
  } catch (err) {
    console.warn('Error fetching customer addresses:', err.message);
    return [];
  }
};

export const getCustomerOrders = async (userId, limit = 10) => {
  try {
    return await db.select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt)).limit(limit);
  } catch (err) {
    console.warn('Error fetching customer orders:', err.message);
    return [];
  }
};

export const getCustomerOrderStats = async (userId) => {
  try {
    const [stats] = await db.select({
      totalOrders: count(),
      totalSpent: sql`COALESCE(SUM(CASE WHEN ${orders.paymentStatus} = 'completed' OR ${orders.status} = 'delivered' THEN ${orders.totalAmount}::numeric ELSE 0 END), 0)::numeric`,
      lastOrderDate: sql`MAX(${orders.createdAt})`
    }).from(orders).where(eq(orders.userId, userId));

    return {
      totalOrders: Number(stats?.totalOrders || 0),
      totalSpent: Number(stats?.totalSpent || 0),
      lastOrderDate: stats?.lastOrderDate || null
    };
  } catch (err) {
    console.warn('Error fetching customer order stats:', err.message);
    return {
      totalOrders: 0,
      totalSpent: 0,
      lastOrderDate: null
    };
  }
};

export const updateCustomer = async (id, data) => {
  const [customer] = await db.update(profiles)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(profiles.id, id), eq(profiles.role, 'customer')))
    .returning();
  return customer;
};

export const deleteCustomer = async (id) => {
  // Check if customer has any order history
  const [orderCheck] = await db.select({ count: count() }).from(orders).where(eq(orders.userId, id));
  const orderCount = Number(orderCheck?.count || 0);

  if (orderCount > 0) {
    // Perform safe deactivation to preserve ledger history
    const [deactivated] = await db.update(profiles)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(profiles.id, id))
      .returning();
    return { action: 'deactivated', customer: deactivated, orderCount };
  } else {
    // Clean delete if no orders
    const [deleted] = await db.delete(profiles).where(eq(profiles.id, id)).returning();
    return { action: 'deleted', customer: deleted, orderCount: 0 };
  }
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

export const getCategoryById = async (id) => {
  const [cat] = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
  return cat;
};

export const deleteCategory = async (id) => {
  const [cat] = await db.delete(categories).where(eq(categories.id, id)).returning();
  return cat;
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

export const getSubCategoryById = async (id) => {
  const [sub] = await db.select().from(subCategories).where(eq(subCategories.id, id)).limit(1);
  return sub;
};

export const deleteSubCategory = async (id) => {
  const [sub] = await db.delete(subCategories).where(eq(subCategories.id, id)).returning();
  return sub;
};

export const listProducts = async ({ limit = 50, offset = 0, storeId, search, productId, id } = {}) => {
  const conditions = [];
  const targetId = productId || id;
  if (targetId) {
    conditions.push(eq(products.id, targetId));
  } else {
    if (storeId) conditions.push(eq(products.storeId, storeId));
    if (search) conditions.push(ilike(products.name, `%${search}%`));
  }

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

export const updateProduct = async (id, data, variants) => {
  return await db.transaction(async (tx) => {
    const [prod] = await tx.update(products).set({ ...data, updatedAt: new Date() }).where(eq(products.id, id)).returning();
    if (variants !== undefined && Array.isArray(variants)) {
      const existingVars = await tx.select({ id: productVariants.id }).from(productVariants).where(eq(productVariants.productId, id));
      const existingIds = existingVars.map(v => v.id);
      
      const newVariants = variants.filter(v => !v.id);
      const updateVariants = variants.filter(v => !!v.id);
      const updateIds = updateVariants.map(v => v.id);
      
      const idsToDelete = existingIds.filter(eid => !updateIds.includes(eid));
      if (idsToDelete.length > 0) {
        await tx.delete(productVariants).where(inArray(productVariants.id, idsToDelete));
      }
      
      for (const uv of updateVariants) {
        await tx.update(productVariants).set({ ...uv, productId: id }).where(eq(productVariants.id, uv.id));
      }
      
      if (newVariants.length > 0) {
        await tx.insert(productVariants).values(newVariants.map(v => ({ ...v, productId: id })));
      }
    }
    return prod;
  });
};

export const getProductById = async (id) => {
  const [prod] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return prod;
};

export const deleteProduct = async (id) => {
  return await db.transaction(async (tx) => {
    const vars = await tx.select({ imageUrl: productVariants.imageUrl }).from(productVariants).where(eq(productVariants.productId, id));
    const [prod] = await tx.delete(products).where(eq(products.id, id)).returning();
    return {
      product: prod,
      variantImageUrls: vars.map(v => v.imageUrl).filter(Boolean)
    };
  });
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

export const getBannerById = async (id) => {
  const [b] = await db.select().from(banners).where(eq(banners.id, id)).limit(1);
  return b;
};

export const deleteBanner = async (id) => {
  const [b] = await db.delete(banners).where(eq(banners.id, id)).returning();
  return b;
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
