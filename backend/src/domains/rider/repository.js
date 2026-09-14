import { db } from '../../db/index.js';
import { riders, orders, riderDistanceLogs } from '../../db/schema.js';
import { eq, and, desc, isNull, inArray, gte, lte, count } from 'drizzle-orm';

export const findRiderByUserId = async (userId) => {
  return await db.query.riders.findFirst({
    where: eq(riders.userId, userId),
    with: {
      profile: true,
      store: true
    }
  });
};

export const updateRiderByUserId = async (userId, data) => {
  const [updated] = await db
    .update(riders)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(riders.userId, userId))
    .returning();
  return updated;
};

export const findActiveDelivery = async (userId) => {
  return await db.query.orders.findFirst({
    where: and(
      eq(orders.riderId, userId),
      inArray(orders.status, ['accepted', 'preparing', 'ready', 'picked_up'])
    ),
    with: {
      store: true,
      address: true,
      user: true,
      items: {
        with: {
          product: true,
          variant: true
        }
      }
    }
  });
};

export const findAvailableOrders = async () => {
  return await db.query.orders.findMany({
    where: and(
      eq(orders.status, 'ready'),
      isNull(orders.riderId)
    ),
    with: {
      store: true
    },
    orderBy: [desc(orders.createdAt)]
  });
};

export const assignRiderToOrder = async (orderId, riderUserId) => {
  const [updated] = await db
    .update(orders)
    .set({
      riderId: riderUserId,
      status: 'accepted',
      updatedAt: new Date()
    })
    .where(and(eq(orders.id, orderId), isNull(orders.riderId)))
    .returning();
  return updated;
};

export const updateOrderStatus = async (orderId, riderUserId, status) => {
  const updateData = {
    status,
    updatedAt: new Date()
  };
  if (status === 'delivered') {
    updateData.paymentStatus = 'paid';
  }
  const [updated] = await db
    .update(orders)
    .set(updateData)
    .where(and(eq(orders.id, orderId), eq(orders.riderId, riderUserId)))
    .returning();
  return updated;
};

export const findOrderWithDetails = async (orderId) => {
  return await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    with: {
      store: true,
      address: true,
      user: true,
      items: true
    }
  });
};

export const countDeliveredOrdersSince = async (riderUserId, date) => {
  const [res] = await db
    .select({ count: count() })
    .from(orders)
    .where(and(
      eq(orders.riderId, riderUserId),
      eq(orders.status, 'delivered'),
      gte(orders.updatedAt, date)
    ));
  return res?.count || 0;
};

export const findRecentRiderOrders = async (riderUserId, limit = 5) => {
  return await db.query.orders.findMany({
    where: eq(orders.riderId, riderUserId),
    with: {
      store: true
    },
    orderBy: [desc(orders.updatedAt)],
    limit
  });
};

export const findOrderHistory = async (riderUserId, { startDate, endDate, status, limit, offset }) => {
  const conditions = [eq(orders.riderId, riderUserId)];
  if (startDate) conditions.push(gte(orders.updatedAt, new Date(startDate)));
  if (endDate) conditions.push(lte(orders.updatedAt, new Date(`${endDate} 23:59:59`)));
  if (status && status !== 'all') conditions.push(eq(orders.status, status));

  const whereClause = and(...conditions);

  const [data, totalRes] = await Promise.all([
    db.query.orders.findMany({
      where: whereClause,
      with: { store: true },
      orderBy: [desc(orders.updatedAt)],
      limit,
      offset
    }),
    db.select({ count: count() }).from(orders).where(whereClause)
  ]);

  return { orders: data, total: totalRes[0]?.count || 0 };
};

export const upsertDistanceLog = async (riderId, date, startReading, endReading, distanceKm, notes) => {
  const [log] = await db
    .insert(riderDistanceLogs)
    .values({
      riderId,
      logDate: date,
      startReading: String(startReading),
      endReading: String(endReading),
      distanceKm: String(distanceKm),
      notes: notes || null,
      updatedAt: new Date()
    })
    .onConflictDoUpdate({
      target: [riderDistanceLogs.riderId, riderDistanceLogs.logDate],
      set: {
        startReading: String(startReading),
        endReading: String(endReading),
        distanceKm: String(distanceKm),
        notes: notes || null,
        updatedAt: new Date()
      }
    })
    .returning();
  return log;
};

export const findDistanceLogs = async (riderId, limit = 30) => {
  return await db.query.riderDistanceLogs.findMany({
    where: eq(riderDistanceLogs.riderId, riderId),
    orderBy: [desc(riderDistanceLogs.logDate)],
    limit
  });
};
