import { db } from '../../db/index.js';
import {
  stores, products, productVariants, orders, orderItems,
  profiles, categories, subCategories
} from '../../db/schema.js';
import { eq, and, desc, asc, gte, lte, or, ilike, count, inArray } from 'drizzle-orm';

export const getStoresByManagerUserId = async (managerUserId) => {
  return await db.select().from(stores).where(eq(stores.managerUserId, managerUserId));
};

export const getStoreById = async (storeId) => {
  const [store] = await db.select().from(stores).where(eq(stores.id, storeId)).limit(1);
  return store || null;
};

export const updateStoreById = async (storeId, updateData) => {
  const [updated] = await db.update(stores).set({ ...updateData, updatedAt: new Date() }).where(eq(stores.id, storeId)).returning();
  return updated;
};

export const getStoreProducts = async (storeId, { search, categoryId, status, limit = 50, offset = 0 }) => {
  const conditions = [eq(products.storeId, storeId)];
  if (categoryId) conditions.push(eq(products.categoryId, categoryId));
  if (status === 'active') conditions.push(eq(products.isActive, true));
  if (status === 'inactive') conditions.push(eq(products.isActive, false));
  if (search) conditions.push(ilike(products.name, `%${search}%`));

  const whereClause = and(...conditions);

  const [items, totalRes] = await Promise.all([
    db.query.products.findMany({
      where: whereClause,
      with: {
        variants: true,
        category: true,
        subCategory: true
      },
      limit,
      offset,
      orderBy: [desc(products.createdAt)]
    }),
    db.select({ count: count() }).from(products).where(whereClause)
  ]);

  return { items, total: totalRes[0]?.count || 0 };
};

export const updateVariantStock = async (variantId, stockQuantity) => {
  const [updated] = await db
    .update(productVariants)
    .set({ stockQuantity: Number(stockQuantity), updatedAt: new Date() })
    .where(eq(productVariants.id, variantId))
    .returning();
  return updated;
};

export const updateProductActiveStatus = async (productId, storeId, isActive) => {
  const [updated] = await db
    .update(products)
    .set({ isActive: Boolean(isActive), updatedAt: new Date() })
    .where(and(eq(products.id, productId), eq(products.storeId, storeId)))
    .returning();
  return updated;
};

export const getStoreOrders = async (storeId, { status, search, limit = 50, offset = 0 }) => {
  const conditions = [eq(orders.storeId, storeId)];
  if (status && status !== 'all') conditions.push(eq(orders.status, status));
  if (search) conditions.push(ilike(orders.orderNumber, `%${search}%`));

  const whereClause = and(...conditions);

  const [list, totalRes] = await Promise.all([
    db.query.orders.findMany({
      where: whereClause,
      with: {
        items: {
          with: {
            product: true,
            variant: true
          }
        },
        user: true,
        address: true,
        deliverySlot: true
      },
      orderBy: [desc(orders.createdAt)],
      limit,
      offset
    }),
    db.select({ count: count() }).from(orders).where(whereClause)
  ]);

  return { orders: list, total: totalRes[0]?.count || 0 };
};

export const findOrderWithDetails = async (orderId, storeId) => {
  return await db.query.orders.findFirst({
    where: and(eq(orders.id, orderId), eq(orders.storeId, storeId)),
    with: {
      items: {
        with: {
          product: true,
          variant: true
        }
      },
      user: true,
      address: true,
      deliverySlot: true
    }
  });
};

export const updateOrderStatus = async (orderId, storeId, status) => {
  const [updated] = await db
    .update(orders)
    .set({ status, updatedAt: new Date() })
    .where(and(eq(orders.id, orderId), eq(orders.storeId, storeId)))
    .returning();
  return updated;
};

export const getStoreStats = async (storeId) => {
  const [totalOrdersRes, pendingOrdersRes, totalProductsRes, lowStockRes] = await Promise.all([
    db.select({ count: count() }).from(orders).where(eq(orders.storeId, storeId)),
    db.select({ count: count() }).from(orders).where(and(eq(orders.storeId, storeId), inArray(orders.status, ['pending', 'accepted', 'preparing']))),
    db.select({ count: count() }).from(products).where(eq(products.storeId, storeId)),
    db.select({ count: count() }).from(productVariants).innerJoin(products, eq(productVariants.productId, products.id)).where(and(eq(products.storeId, storeId), lte(productVariants.stockQuantity, 5)))
  ]);

  return {
    total_orders: totalOrdersRes[0]?.count || 0,
    pending_orders: pendingOrdersRes[0]?.count || 0,
    total_products: totalProductsRes[0]?.count || 0,
    low_stock_count: lowStockRes[0]?.count || 0
  };
};

export const getSubCategories = async () => {
  return await db.select().from(subCategories);
};
