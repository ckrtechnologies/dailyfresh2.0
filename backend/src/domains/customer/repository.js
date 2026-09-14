import { db } from '../../db/index.js';
import { 
  products, productVariants, categories, subCategories, banners, homeSections,
  stores, deliverySlots, cartItems, orders, orderItems, profiles, addresses, 
  userFavorites, coupons, notifications
} from '../../db/schema.js';
import { eq, and, desc, asc, ilike, inArray, sql } from 'drizzle-orm';

// --- NORMALIZATION HELPERS (Dual snake_case & camelCase for frontend compatibility) ---
export const formatProduct = (p) => {
  if (!p) return null;
  const imageUrl = p.imageUrl || p.image_url || (Array.isArray(p.images) && p.images[0]) || null;
  return {
    ...p,
    id: p.id,
    storeId: p.storeId || p.store_id,
    store_id: p.storeId || p.store_id,
    subCategoryId: p.subCategoryId || p.sub_category_id,
    sub_category_id: p.subCategoryId || p.sub_category_id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    cookingGuide: p.cookingGuide || p.cooking_guide || null,
    cooking_guide: p.cookingGuide || p.cooking_guide || null,
    price: p.price,
    discountPrice: p.discountPrice !== undefined ? p.discountPrice : p.discount_price,
    discount_price: p.discountPrice !== undefined ? p.discountPrice : p.discount_price,
    weightUnit: p.weightUnit || p.weight_unit || 'kg',
    weight_unit: p.weightUnit || p.weight_unit || 'kg',
    stockQuantity: Number(p.stockQuantity ?? p.stock_quantity ?? 0),
    stock_quantity: Number(p.stockQuantity ?? p.stock_quantity ?? 0),
    expressStockQty: Number(p.expressStockQty ?? p.express_stock_qty ?? 0),
    express_stock_qty: Number(p.expressStockQty ?? p.express_stock_qty ?? 0),
    scheduledStockQty: Number(p.scheduledStockQty ?? p.scheduled_stock_qty ?? 0),
    scheduled_stock_qty: Number(p.scheduledStockQty ?? p.scheduled_stock_qty ?? 0),
    deliveryOptions: p.deliveryOptions ?? p.delivery_options ?? ['express', 'tomorrow_morning', 'tomorrow_evening'],
    delivery_options: p.deliveryOptions ?? p.delivery_options ?? ['express', 'tomorrow_morning', 'tomorrow_evening'],
    isActive: Boolean(p.isActive ?? p.is_active),
    is_active: Boolean(p.isActive ?? p.is_active),
    isFeatured: Boolean(p.isFeatured ?? p.is_featured),
    is_featured: Boolean(p.isFeatured ?? p.is_featured),
    isDeal: Boolean(p.isDeal ?? p.is_deal),
    is_deal: Boolean(p.isDeal ?? p.is_deal),
    isFlashSale: Boolean(p.isFlashSale ?? p.is_flash_sale),
    is_flash_sale: Boolean(p.isFlashSale ?? p.is_flash_sale),
    isExclusive: Boolean(p.isExclusive ?? p.is_exclusive),
    is_exclusive: Boolean(p.isExclusive ?? p.is_exclusive),
    isTrending: Boolean(p.isTrending ?? p.is_trending),
    is_trending: Boolean(p.isTrending ?? p.is_trending),
    isFrozen: Boolean(p.isFrozen ?? p.is_frozen),
    is_frozen: Boolean(p.isFrozen ?? p.is_frozen),
    isNewLaunch: Boolean(p.isNewLaunch ?? p.is_new_launch),
    is_new_launch: Boolean(p.isNewLaunch ?? p.is_new_launch),
    imageUrl,
    image_url: imageUrl,
    cutOptions: p.cutOptions ?? p.cut_options ?? [],
    cut_options: p.cutOptions ?? p.cut_options ?? [],
    cleaningOptions: p.cleaningOptions ?? p.cleaning_options ?? [],
    cleaning_options: p.cleaningOptions ?? p.cleaning_options ?? [],
    variants: (p.variants || []).map(v => ({
      ...v,
      imageUrl: v.imageUrl || v.image_url,
      image_url: v.imageUrl || v.image_url,
      discountPrice: v.discountPrice !== undefined ? v.discountPrice : v.discount_price,
      discount_price: v.discountPrice !== undefined ? v.discountPrice : v.discount_price,
      deliveryInfo: v.deliveryInfo || v.delivery_info,
      delivery_info: v.deliveryInfo || v.delivery_info,
    })),
    subCategory: p.subCategory,
    sub_category: p.subCategory,
  };
};

export const formatCategory = (c) => {
  if (!c) return null;
  const imageUrl = c.imageUrl || c.image_url || null;
  return {
    ...c,
    imageUrl,
    image_url: imageUrl,
    displayOrder: c.displayOrder ?? c.display_order ?? 0,
    display_order: c.displayOrder ?? c.display_order ?? 0,
    isActive: Boolean(c.isActive ?? c.is_active),
    is_active: Boolean(c.isActive ?? c.is_active),
    subCategories: (c.subCategories || []).map(s => ({
      ...s,
      imageUrl: s.imageUrl || s.image_url,
      image_url: s.imageUrl || s.image_url,
    }))
  };
};

export const formatBanner = (b) => {
  if (!b) return null;
  const imageUrl = b.imageUrl || b.image_url || null;
  const linkUrl = b.linkUrl || b.link_url || null;
  return {
    ...b,
    imageUrl,
    image_url: imageUrl,
    linkUrl,
    link_url: linkUrl,
    displayOrder: b.displayOrder ?? b.display_order ?? 0,
    display_order: b.displayOrder ?? b.display_order ?? 0,
    isActive: Boolean(b.isActive ?? b.is_active),
    is_active: Boolean(b.isActive ?? b.is_active),
  };
};

export const formatStore = (s) => {
  if (!s) return null;
  return {
    ...s,
    id: s.id,
    name: s.name,
    address: s.address,
    city: s.city,
    state: s.state,
    pincode: s.pincode,
    latitude: s.latitude,
    longitude: s.longitude,
    phone: s.phone,
    email: s.email,
    openingTime: s.openingTime || s.opening_time,
    opening_time: s.openingTime || s.opening_time,
    closingTime: s.closingTime || s.closing_time,
    closing_time: s.closingTime || s.closing_time,
    deliveryRadiusKm: s.deliveryRadiusKm || s.delivery_radius_km,
    delivery_radius_km: s.deliveryRadiusKm || s.delivery_radius_km,
    serviceablePincodes: s.serviceablePincodes || s.serviceable_pincodes || [],
    serviceable_pincodes: s.serviceablePincodes || s.serviceable_pincodes || [],
    isActive: Boolean(s.isActive ?? s.is_active),
    is_active: Boolean(s.isActive ?? s.is_active),
  };
};

// --- CATALOGUE DATA ACCESS ---
export const getActiveStores = async () => {
  const storesList = await db.select().from(stores).where(eq(stores.isActive, true));
  return storesList.map(formatStore);
};

export const findStoreById = async (id) => {
  const [store] = await db.select().from(stores).where(eq(stores.id, id)).limit(1);
  return store ? formatStore(store) : null;
};

export const getCategories = async () => {
  const list = await db.select().from(categories).where(eq(categories.isActive, true)).orderBy(asc(categories.displayOrder));
  return list.map(formatCategory);
};

export const getCategoryTree = async () => {
  const tree = await db.query.categories.findMany({
    where: eq(categories.isActive, true),
    orderBy: [asc(categories.displayOrder)],
    with: {
      subCategories: {
        where: eq(subCategories.isActive, true),
        orderBy: [asc(subCategories.displayOrder)]
      }
    }
  });
  return tree.map(formatCategory);
};

export const getBanners = async () => {
  const list = await db.select().from(banners).where(eq(banners.isActive, true)).orderBy(asc(banners.displayOrder));
  return list.map(formatBanner);
};

export const getHomeSections = async () => {
  return await db.select().from(homeSections).where(eq(homeSections.isActive, true)).orderBy(asc(homeSections.displayOrder));
};

export const getDeliverySlots = async () => {
  return await db.select().from(deliverySlots).where(eq(deliverySlots.isActive, true)).orderBy(asc(deliverySlots.type), asc(deliverySlots.displayOrder));
};

export const findProducts = async ({
  storeId,
  search,
  categoryId,
  subCategoryId,
  isDeal,
  isFeatured,
  isFlashSale,
  isTrending,
  isExclusive,
  isNewLaunch,
  isFrozen,
  limit = 50,
  offset = 0
}) => {
  let activeStoreId = storeId;
  if (!activeStoreId) {
    const [firstStore] = await db.select({ id: stores.id }).from(stores).where(eq(stores.isActive, true)).limit(1);
    activeStoreId = firstStore?.id;
    if (!activeStoreId) return [];
  }

  const conditions = [eq(products.isActive, true), eq(products.storeId, activeStoreId)];

  if (categoryId) {
    const matchingSubCats = await db.select({ id: subCategories.id })
      .from(subCategories)
      .where(eq(subCategories.categoryId, categoryId));
    const subCatIds = matchingSubCats.map(s => s.id);
    if (subCatIds.length > 0) {
      conditions.push(inArray(products.subCategoryId, subCatIds));
    } else {
      return [];
    }
  }

  if (subCategoryId) {
    conditions.push(eq(products.subCategoryId, subCategoryId));
  }

  if (search) {
    conditions.push(ilike(products.name, `%${search}%`));
  }

  if (isDeal !== undefined && isDeal !== '') {
    const boolVal = isDeal === true || isDeal === 'true' || isDeal === 1 || isDeal === '1';
    conditions.push(eq(products.isDeal, boolVal));
  }

  if (isFeatured !== undefined && isFeatured !== '') {
    const boolVal = isFeatured === true || isFeatured === 'true' || isFeatured === 1 || isFeatured === '1';
    conditions.push(eq(products.isFeatured, boolVal));
  }

  if (isFlashSale !== undefined && isFlashSale !== '') {
    const boolVal = isFlashSale === true || isFlashSale === 'true' || isFlashSale === 1 || isFlashSale === '1';
    conditions.push(eq(products.isFlashSale, boolVal));
  }

  if (isTrending !== undefined && isTrending !== '') {
    const boolVal = isTrending === true || isTrending === 'true' || isTrending === 1 || isTrending === '1';
    conditions.push(eq(products.isTrending, boolVal));
  }

  if (isExclusive !== undefined && isExclusive !== '') {
    const boolVal = isExclusive === true || isExclusive === 'true' || isExclusive === 1 || isExclusive === '1';
    conditions.push(eq(products.isExclusive, boolVal));
  }

  if (isNewLaunch !== undefined && isNewLaunch !== '') {
    const boolVal = isNewLaunch === true || isNewLaunch === 'true' || isNewLaunch === 1 || isNewLaunch === '1';
    conditions.push(eq(products.isNewLaunch, boolVal));
  }

  if (isFrozen !== undefined && isFrozen !== '') {
    const boolVal = isFrozen === true || isFrozen === 'true' || isFrozen === 1 || isFrozen === '1';
    conditions.push(eq(products.isFrozen, boolVal));
  }

  let results = await db.query.products.findMany({
    where: and(...conditions),
    with: {
      variants: true,
      subCategory: { with: { category: true } }
    },
    limit,
    offset
  });

  return (results || []).map(formatProduct);
};

export const findProductById = async (id) => {
  const product = await db.query.products.findFirst({
    where: and(eq(products.id, id), eq(products.isActive, true)),
    with: {
      variants: true,
      subCategory: { with: { category: true } }
    }
  });
  return product ? formatProduct(product) : null;
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

export const getProductsByIds = async (productIds) => {
  if (!productIds || productIds.length === 0) return [];
  return await db.select().from(products).where(inArray(products.id, productIds));
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

    // Decrement inventory stock on products table
    for (const item of itemsData) {
      if (item.productId) {
        await tx.update(products)
          .set({
            stockQuantity: sql`GREATEST(0, ${products.stockQuantity} - ${item.quantity})`,
            updatedAt: new Date()
          })
          .where(eq(products.id, item.productId));
      }
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
      address: true,
      rider: true,
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
      address: true,
      rider: true,
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
    fullName: addressData.full_name || addressData.fullName || 'Valued Customer',
    phone: addressData.phone || '',
    label: addressData.label || addressData.type || 'Home',
    line1: addressData.line1 || addressData.address_line1 || addressData.addressLine1 || '',
    line2: addressData.line2 || addressData.address_line2 || addressData.addressLine2 || null,
    city: addressData.city || 'Kolkata',
    state: addressData.state || 'West Bengal',
    pincode: String(addressData.pincode),
    latitude: addressData.latitude ? String(addressData.latitude) : null,
    longitude: addressData.longitude ? String(addressData.longitude) : null,
    isDefault: Boolean(addressData.is_default || addressData.isDefault || false),
  }).returning();
  return newAddr;
};

export const updateAddress = async (id, userId, addressData) => {
  if (addressData.is_default || addressData.isDefault) {
    await db.update(addresses).set({ isDefault: false }).where(eq(addresses.userId, userId));
  }
  const updateData = {};
  if (addressData.full_name || addressData.fullName) updateData.fullName = addressData.full_name || addressData.fullName;
  if (addressData.phone) updateData.phone = addressData.phone;
  if (addressData.label || addressData.type) updateData.label = addressData.label || addressData.type;
  if (addressData.line1 || addressData.address_line1 || addressData.addressLine1) {
    updateData.line1 = addressData.line1 || addressData.address_line1 || addressData.addressLine1;
  }
  if (addressData.line2 !== undefined || addressData.address_line2 !== undefined) {
    updateData.line2 = addressData.line2 ?? addressData.address_line2 ?? null;
  }
  if (addressData.city) updateData.city = addressData.city;
  if (addressData.state) updateData.state = addressData.state;
  if (addressData.pincode) updateData.pincode = String(addressData.pincode);
  if (addressData.latitude) updateData.latitude = String(addressData.latitude);
  if (addressData.longitude) updateData.longitude = String(addressData.longitude);
  if (addressData.is_default !== undefined || addressData.isDefault !== undefined) {
    updateData.isDefault = Boolean(addressData.is_default ?? addressData.isDefault);
  }

  const [updated] = await db.update(addresses).set(updateData).where(and(eq(addresses.id, id), eq(addresses.userId, userId))).returning();
  return updated;
};

export const deleteAddress = async (id, userId) => {
  return await db.delete(addresses).where(and(eq(addresses.id, id), eq(addresses.userId, userId)));
};

// --- FAVORITES DATA ACCESS ---
export const getFavorites = async (userId) => {
  const favRows = await db.select().from(userFavorites).where(eq(userFavorites.userId, userId));
  if (!favRows || favRows.length === 0) return [];

  const prodIds = favRows.map(f => f.productId).filter(Boolean);
  if (prodIds.length === 0) return [];

  const prodList = await db.query.products.findMany({
    where: inArray(products.id, prodIds),
    with: {
      variants: true,
      subCategory: { with: { category: true } }
    }
  });

  const formattedProds = prodList.map(formatProduct);

  // Clean up any favorite records pointing to deleted products
  const foundProdIds = new Set(formattedProds.map(p => p.id));
  const orphanedFavIds = favRows.filter(f => !foundProdIds.has(f.productId)).map(f => f.id);
  if (orphanedFavIds.length > 0) {
    try {
      await db.delete(userFavorites).where(inArray(userFavorites.id, orphanedFavIds));
    } catch (e) {
      console.warn('Failed to clean up orphaned favorites:', e.message);
    }
  }

  // Return formatted product objects directly so mobile app gets proper ProductCard models
  return formattedProds.map(p => ({
    ...p,
    product: p, // for backward compatibility
    favorite_id: favRows.find(f => f.productId === p.id)?.id,
    is_favorite: true,
    isFavorite: true,
  }));
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
