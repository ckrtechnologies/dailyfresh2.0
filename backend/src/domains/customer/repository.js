import { db } from '../../db/index.js';
import { 
  products, productVariants, categories, subCategories, banners, homeSections,
  stores, deliverySlots, cartItems, orders, orderItems, profiles, addresses, 
  userFavorites, coupons, notifications
} from '../../db/schema.js';
import { eq, and, desc, asc, ilike, inArray, sql } from 'drizzle-orm';

// --- CATALOGUE DATA ACCESS ---
export const getActiveStores = async () => {
  return await db.select().from(stores).where(eq(stores.isActive, true));
};

export const getCategories = async () => {
  return await db.select().from(categories).where(eq(categories.isActive, true)).orderBy(asc(categories.displayOrder));
};

export const getCategoryTree = async () => {
  return await db.query.categories.findMany({
    where: eq(categories.isActive, true),
    orderBy: [asc(categories.displayOrder)],
    with: {
      subCategories: {
        where: eq(subCategories.isActive, true),
        orderBy: [asc(subCategories.displayOrder)]
      }
    }
  });
};

export const getBanners = async () => {
  return await db.select().from(banners).where(eq(banners.isActive, true)).orderBy(asc(banners.displayOrder));
};

export const getHomeSections = async () => {
  return await db.select().from(homeSections).where(eq(homeSections.isActive, true)).orderBy(asc(homeSections.displayOrder));
};

export const getDeliverySlots = async () => {
  return await db.select().from(deliverySlots).where(eq(deliverySlots.isActive, true)).orderBy(asc(deliverySlots.type), asc(deliverySlots.displayOrder));
};

export const findProducts = async ({ storeId, search, categoryId, subCategoryId, limit = 50, offset = 0 }) => {
  const conditions = [eq(products.isActive, true)];

  if (storeId) {
    conditions.push(eq(products.storeId, storeId));
  }
  if (categoryId) {
    conditions.push(eq(products.categoryId, categoryId));
  }
  if (subCategoryId) {
    conditions.push(eq(products.subCategoryId, subCategoryId));
  }
  if (search) {
    conditions.push(ilike(products.name, `%${search}%`));
  }

  return await db.query.products.findMany({
    where: and(...conditions),
    with: {
      variants: true,
      subCategory: { with: { category: true } }
    },
    limit,
    offset
  });
};

export const findProductById = async (id) => {
  return await db.query.products.findFirst({
    where: eq(products.id, id),
    with: {
      variants: true,
      subCategory: { with: { category: true } }
    }
  });
};

// --- CART DATA ACCESS ---
export const getCartItemsWithVariants = async (userId) => {
  return await db.query.cartItems.findMany({
    where: eq(cartItems.userId, userId),
    with: {
      product: true,
      variant: true
    }
  });
};

export const clearUserCart = async (userId) => {
  return await db.delete(cartItems).where(eq(cartItems.userId, userId));
};

export const insertCartItems = async (items) => {
  if (!items || items.length === 0) return [];
  return await db.insert(cartItems).values(items).returning();
};

export const getVariantsByIds = async (variantIds) => {
  if (!variantIds || variantIds.length === 0) return [];
  return await db.select().from(productVariants).where(inArray(productVariants.id, variantIds));
};

// --- ORDER DATA ACCESS ---
export const createOrderWithItems = async (orderData, itemsData) => {
  return await db.transaction(async (tx) => {
    const [newOrder] = await tx.insert(orders).values(orderData).returning();

    const formattedItems = itemsData.map(item => ({
      ...item,
      orderId: newOrder.id
    }));

    await tx.insert(orderItems).values(formattedItems);

    // Decrement inventory stock
    for (const item of itemsData) {
      await tx.update(productVariants)
        .set({
          stockQuantity: sql`GREATEST(0, ${productVariants.stockQuantity} - ${item.quantity})`,
          updatedAt: new Date()
        })
        .where(eq(productVariants.id, item.variantId));
    }

    return newOrder;
  });
};

export const getCustomerOrders = async (userId, limit = 50, offset = 0) => {
  return await db.query.orders.findMany({
    where: eq(orders.userId, userId),
    orderBy: [desc(orders.createdAt)],
    limit,
    offset,
    with: {
      items: {
        with: {
          product: true,
          variant: true
        }
      },
      store: true,
      
    }
  });
};

export const getCustomerOrderById = async (orderId, userId) => {
  return await db.query.orders.findFirst({
    where: and(eq(orders.id, orderId), eq(orders.userId, userId)),
    with: {
      items: {
        with: {
          product: true,
          variant: true
        }
      },
      store: true,
      
    }
  });
};

export const updateOrderPayment = async (orderId, updateFields) => {
  const [updated] = await db.update(orders)
    .set(updateFields)
    .where(eq(orders.id, orderId))
    .returning();
  return updated;
};

// --- PROFILE & ADDRESS DATA ACCESS ---
export const getProfileById = async (userId) => {
  const [user] = await db.select().from(profiles).where(eq(profiles.id, userId)).limit(1);
  return user || null;
};

export const updateProfile = async (userId, data) => {
  const [updated] = await db.update(profiles).set(data).where(eq(profiles.id, userId)).returning();
  return updated || null;
};

export const getAddresses = async (userId) => {
  return await db.select().from(addresses).where(eq(addresses.userId, userId)).orderBy(desc(addresses.isDefault));
};

export const createAddress = async (userId, addressData) => {
  if (addressData.is_default || addressData.isDefault) {
    await db.update(addresses).set({ isDefault: false }).where(eq(addresses.userId, userId));
  }
  const [newAddr] = await db.insert(addresses).values({
    userId,
    addressLine1: addressData.address_line1 || addressData.addressLine1,
    addressLine2: addressData.address_line2 || addressData.addressLine2,
    city: addressData.city || 'Kolkata',
    state: addressData.state || 'West Bengal',
    pincode: addressData.pincode,
    latitude: addressData.latitude ? String(addressData.latitude) : null,
    longitude: addressData.longitude ? String(addressData.longitude) : null,
    type: addressData.type || 'home',
    landmark: addressData.landmark,
    isDefault: addressData.is_default || addressData.isDefault || false
  }).returning();
  return newAddr;
};

export const updateAddress = async (id, userId, addressData) => {
  if (addressData.is_default || addressData.isDefault) {
    await db.update(addresses).set({ isDefault: false }).where(eq(addresses.userId, userId));
  }
  const updateData = {};
  if (addressData.address_line1) updateData.addressLine1 = addressData.address_line1;
  if (addressData.address_line2) updateData.addressLine2 = addressData.address_line2;
  if (addressData.city) updateData.city = addressData.city;
  if (addressData.state) updateData.state = addressData.state;
  if (addressData.pincode) updateData.pincode = addressData.pincode;
  if (addressData.latitude) updateData.latitude = String(addressData.latitude);
  if (addressData.longitude) updateData.longitude = String(addressData.longitude);
  if (addressData.type) updateData.type = addressData.type;
  if (addressData.landmark) updateData.landmark = addressData.landmark;
  if (addressData.is_default !== undefined) updateData.isDefault = addressData.is_default;

  const [updated] = await db.update(addresses).set(updateData).where(and(eq(addresses.id, id), eq(addresses.userId, userId))).returning();
  return updated;
};

export const deleteAddress = async (id, userId) => {
  return await db.delete(addresses).where(and(eq(addresses.id, id), eq(addresses.userId, userId)));
};

// --- FAVORITES DATA ACCESS ---
export const getFavorites = async (userId) => {
  return await db.query.userFavorites.findMany({
    where: eq(userFavorites.userId, userId),
    with: {
      product: {
        with: {
          variants: true
        }
      }
    }
  });
};

export const toggleFavorite = async (userId, productId) => {
  const [existing] = await db.select().from(userFavorites)
    .where(and(eq(userFavorites.userId, userId), eq(userFavorites.productId, productId)))
    .limit(1);

  if (existing) {
    await db.delete(userFavorites).where(eq(userFavorites.id, existing.id));
    return { is_favorite: false };
  } else {
    await db.insert(userFavorites).values({ userId, productId });
    return { is_favorite: true };
  }
};

// --- COUPONS DATA ACCESS ---
export const getActiveCoupons = async () => {
  return await db.select().from(coupons).where(eq(coupons.isActive, true)).orderBy(desc(coupons.createdAt));
};

export const findCouponByCode = async (code) => {
  const [c] = await db.select().from(coupons).where(and(eq(coupons.code, code.toUpperCase()), eq(coupons.isActive, true))).limit(1);
  return c || null;
};
