import { 
  pgSchema,
  uuid, 
  text, 
  integer, 
  numeric, 
  boolean, 
  timestamp, 
  time, 
  date, 
  jsonb,
  uniqueIndex,
  index
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

// Explicit client schema namespace
export const dailyfreshSchema = pgSchema('dailyfresh');
const pgTable = dailyfreshSchema.table;

// ============================================================
// 1. PROFILES (Users & Staff)
// ============================================================
export const profiles = pgTable('profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  fullName: text('full_name').notNull(),
  email: text('email').notNull().unique(),
  phone: text('phone'),
  passwordHash: text('password_hash'),
  avatarUrl: text('avatar_url'),
  role: text('role').notNull().default('customer'), // customer, store_manager, rider, admin
  authProvider: text('auth_provider').default('local'), // local, google
  googleId: text('google_id'),
  fcmToken: text('fcm_token'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('idx_profiles_role').on(table.role),
  index('idx_profiles_phone').on(table.phone),
  index('idx_profiles_google_id').on(table.googleId),
]);

// ============================================================
// 2. STORES
// ============================================================
export const stores = pgTable('stores', {
  id: uuid('id').defaultRandom().primaryKey(),
  managerUserId: uuid('manager_user_id').references(() => profiles.id),
  name: text('name').notNull(),
  logoUrl: text('logo_url'),
  coverUrl: text('cover_url'),
  description: text('description'),
  address: text('address'),
  city: text('city'),
  state: text('state'),
  pincode: text('pincode').notNull(),
  latitude: numeric('latitude', { precision: 10, scale: 7 }),
  longitude: numeric('longitude', { precision: 10, scale: 7 }),
  phone: text('phone'),
  email: text('email'),
  openingTime: time('opening_time'),
  closingTime: time('closing_time'),
  deliveryRadiusKm: numeric('delivery_radius_km', { precision: 5, scale: 2 }).default('10.00'),
  serviceablePincodes: text('serviceable_pincodes').array().default(sql`'{}'::text[]`),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ============================================================
// 3. RIDERS
// ============================================================
export const riders = pgTable('riders', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().unique().references(() => profiles.id, { onDelete: 'cascade' }),
  assignedStoreId: uuid('assigned_store_id').references(() => stores.id),
  vehicleType: text('vehicle_type'),
  vehicleNumber: text('vehicle_number'),
  licenseNumber: text('license_number'),
  govtIdUrl: text('govt_id_url'),
  licenseUrl: text('license_url'),
  fcmToken: text('fcm_token'),
  isOnline: boolean('is_online').default(false),
  currentLat: numeric('current_lat', { precision: 10, scale: 7 }),
  currentLng: numeric('current_lng', { precision: 10, scale: 7 }),
  approvalStatus: text('approval_status').notNull().default('pending'), // pending, approved, rejected
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ============================================================
// 4. CATEGORIES
// ============================================================
export const categories = pgTable('categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  imageUrl: text('image_url'),
  displayOrder: integer('display_order').default(0),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ============================================================
// 5. SUB_CATEGORIES
// ============================================================
export const subCategories = pgTable('sub_categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  categoryId: uuid('category_id').notNull().references(() => categories.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  imageUrl: text('image_url'),
  displayOrder: integer('display_order').default(0),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ============================================================
// 6. PRODUCTS
// ============================================================
export const products = pgTable('products', {
  id: uuid('id').defaultRandom().primaryKey(),
  storeId: uuid('store_id').notNull().references(() => stores.id),
  subCategoryId: uuid('sub_category_id').references(() => subCategories.id),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  cookingGuide: text('cooking_guide'),
  productHighlights: jsonb('product_highlights').default(sql`'[]'::jsonb`),
  sku: text('sku').unique(),
  price: numeric('price', { precision: 10, scale: 2 }).notNull().default('0.00'),
  discountPrice: numeric('discount_price', { precision: 10, scale: 2 }),
  weightUnit: text('weight_unit').notNull().default('kg'),
  stockQuantity: integer('stock_quantity').default(0),
  expressStockQty: integer('express_stock_qty').default(0),
  scheduledStockQty: integer('scheduled_stock_qty').default(0),
  deliveryOptions: jsonb('delivery_options').default(sql`'["express", "tomorrow_morning", "tomorrow_evening"]'::jsonb`),
  isActive: boolean('is_active').default(true),
  isFeatured: boolean('is_featured').default(false),
  isDeal: boolean('is_deal').default(false),
  isFlashSale: boolean('is_flash_sale').default(false),
  isExclusive: boolean('is_exclusive').default(false),
  isTrending: boolean('is_trending').default(false),
  isFrozen: boolean('is_frozen').default(false),
  isNewLaunch: boolean('is_new_launch').default(false),
  cutOptions: text('cut_options').array().default(sql`'{}'::text[]`),
  cleaningOptions: text('cleaning_options').array().default(sql`'{}'::text[]`),
  images: text('images').array().default(sql`'{}'::text[]`),
  imageUrl: text('image_url'),
  metadata: jsonb('metadata').default(sql`'{}'::jsonb`),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('idx_products_store').on(table.storeId),
  index('idx_products_sub_cat').on(table.subCategoryId),
  index('idx_products_active').on(table.isActive),
]);

// ============================================================
// 7. PRODUCT_VARIANTS
// ============================================================
export const productVariants = pgTable('product_variants', {
  id: uuid('id').defaultRandom().primaryKey(),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  price: numeric('price', { precision: 10, scale: 2 }).notNull().default('0.00'),
  discountPrice: numeric('discount_price', { precision: 10, scale: 2 }),
  weightText: text('weight_text'),
  grossWeightText: text('gross_weight_text'),
  imageUrl: text('image_url'),
  deliveryInfo: text('delivery_info').array().default(sql`ARRAY['tomorrow_morning']::text[]`),
  displayOrder: integer('display_order').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ============================================================
// 8. ADDRESSES
// ============================================================
export const addresses = pgTable('addresses', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  label: text('label').default('Home'),
  fullName: text('full_name').notNull(),
  phone: text('phone').notNull(),
  line1: text('line1').notNull(),
  line2: text('line2'),
  city: text('city').notNull(),
  state: text('state').notNull(),
  pincode: text('pincode').notNull(),
  latitude: numeric('latitude', { precision: 10, scale: 7 }),
  longitude: numeric('longitude', { precision: 10, scale: 7 }),
  isDefault: boolean('is_default').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ============================================================
// 9. DELIVERY_SLOTS
// ============================================================
export const deliverySlots = pgTable('delivery_slots', {
  id: uuid('id').defaultRandom().primaryKey(),
  type: text('type').notNull(), // tomorrow_morning, tomorrow_evening
  slotName: text('slot_name').notNull(),
  startTime: time('start_time'),
  endTime: time('end_time'),
  displayOrder: integer('display_order').default(0),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ============================================================
// 10. COUPONS
// ============================================================
export const coupons = pgTable('coupons', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: text('code').notNull().unique(),
  description: text('description'),
  discountType: text('discount_type').notNull(), // fixed, percentage
  discountValue: numeric('discount_value', { precision: 10, scale: 2 }).notNull(),
  minOrderAmount: numeric('min_order_amount', { precision: 10, scale: 2 }).default('0.00'),
  maxDiscountAmount: numeric('max_discount_amount', { precision: 10, scale: 2 }),
  startDate: timestamp('start_date', { withTimezone: true }).defaultNow(),
  endDate: timestamp('end_date', { withTimezone: true }),
  usageLimit: integer('usage_limit'),
  usedCount: integer('used_count').default(0),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ============================================================
// 11. ORDERS
// ============================================================
export const orders = pgTable('orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderNumber: text('order_number').notNull().unique(),
  userId: uuid('user_id').notNull().references(() => profiles.id),
  storeId: uuid('store_id').notNull().references(() => stores.id),
  riderId: uuid('rider_id').references(() => profiles.id),
  addressId: uuid('address_id').references(() => addresses.id),
  deliveryType: text('delivery_type').notNull().default('express'), // express, tomorrow_morning, tomorrow_evening
  deliverySlotId: uuid('delivery_slot_id').references(() => deliverySlots.id),
  deliverySlotLabel: text('delivery_slot_label'),
  deliverySlot: text('delivery_slot'),
  latitude: numeric('latitude', { precision: 10, scale: 7 }),
  longitude: numeric('longitude', { precision: 10, scale: 7 }),
  status: text('status').notNull().default('placed'),
  paymentStatus: text('payment_status').notNull().default('unpaid'), // unpaid, paid, failed, refunded
  paymentMethod: text('payment_method').notNull(),
  totalItemsPrice: numeric('total_items_price', { precision: 10, scale: 2 }).notNull(),
  deliveryCharge: numeric('delivery_charge', { precision: 10, scale: 2 }).default('0.00'),
  gstAmount: numeric('gst_amount', { precision: 10, scale: 2 }).default('0.00'),
  discountAmount: numeric('discount_amount', { precision: 10, scale: 2 }).default('0.00'),
  totalAmount: numeric('total_amount', { precision: 10, scale: 2 }).notNull(),
  couponCode: text('coupon_code'),
  couponId: uuid('coupon_id').references(() => coupons.id),
  razorpayOrderId: text('razorpay_order_id'),
  razorpayPaymentId: text('razorpay_payment_id'),
  statusUpdatedAt: timestamp('status_updated_at', { withTimezone: true }),
  statusUpdatedBy: uuid('status_updated_by').references(() => profiles.id),
  statusUpdatedRole: text('status_updated_role'),
  cancellationReason: text('cancellation_reason'),
  customerNotes: text('customer_notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('idx_orders_user').on(table.userId),
  index('idx_orders_store').on(table.storeId),
  index('idx_orders_status').on(table.status),
]);

// ============================================================
// 12. ORDER_ITEMS
// ============================================================
export const orderItems = pgTable('order_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').references(() => products.id),
  variantId: uuid('variant_id').references(() => productVariants.id),
  storeId: uuid('store_id').notNull().references(() => stores.id),
  name: text('name').notNull(),
  quantity: integer('quantity').notNull(),
  unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
  totalPrice: numeric('total_price', { precision: 10, scale: 2 }).notNull(),
  preferences: jsonb('preferences').default(sql`'{}'::jsonb`),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ============================================================
// 13. DELIVERIES
// ============================================================
export const deliveries = pgTable('deliveries', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  riderId: uuid('rider_id').references(() => riders.id),
  storeId: uuid('store_id').notNull().references(() => stores.id),
  status: text('status').notNull().default('pending_assignment'),
  otp: text('otp'),
  deliveryProof: text('delivery_proof'),
  riderEarning: numeric('rider_earning', { precision: 10, scale: 2 }),
  pickedUpAt: timestamp('picked_up_at', { withTimezone: true }),
  deliveredAt: timestamp('delivered_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ============================================================
// 14. CART_ITEMS
// ============================================================
export const cartItems = pgTable('cart_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').notNull().references(() => products.id),
  variantId: uuid('variant_id').references(() => productVariants.id),
  storeId: uuid('store_id').notNull().references(() => stores.id),
  quantity: integer('quantity').notNull().default(1),
  cutPreference: text('cut_preference'),
  cleaningPreference: text('cleaning_preference'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ============================================================
// 15. USER_FAVORITES
// ============================================================
export const userFavorites = pgTable('user_favorites', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  uniqueIndex('uq_user_favorite').on(table.userId, table.productId)
]);

// ============================================================
// 16. NOTIFICATIONS
// ============================================================
export const notifications = pgTable('notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  body: text('body').notNull(),
  type: text('type').notNull(),
  data: jsonb('data').default(sql`'{}'::jsonb`),
  isRead: boolean('is_read').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ============================================================
// 17. BANNERS
// ============================================================
export const banners = pgTable('banners', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  imageUrl: text('image_url').notNull(),
  linkUrl: text('link_url'),
  placement: text('placement').notNull().default('hero'), // hero, promotional, category_page
  displayOrder: integer('display_order').default(0),
  isActive: boolean('is_active').default(true),
  validFrom: timestamp('valid_from', { withTimezone: true }).defaultNow(),
  validUntil: timestamp('valid_until', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ============================================================
// 18. HOME_SECTIONS
// ============================================================
export const homeSections = pgTable('home_sections', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  subtitle: text('subtitle'),
  sectionType: text('section_type'),
  config: jsonb('config').default(sql`'{}'::jsonb`),
  displayOrder: integer('display_order').default(0),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ============================================================
// 19. SETTINGS
// ============================================================
export const settings = pgTable('settings', {
  id: uuid('id').defaultRandom().primaryKey(),
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
  dataType: text('data_type'), // string, number, boolean, json
  description: text('description'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ============================================================
// 20. RIDER_DISTANCE_LOGS
// ============================================================
export const riderDistanceLogs = pgTable('rider_distance_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  riderId: uuid('rider_id').references(() => riders.id, { onDelete: 'cascade' }),
  logDate: date('log_date').notNull(),
  startReading: numeric('start_reading', { precision: 10, scale: 2 }),
  endReading: numeric('end_reading', { precision: 10, scale: 2 }),
  distanceKm: numeric('distance_km', { precision: 10, scale: 2 }).notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  uniqueIndex('uq_rider_log_date').on(table.riderId, table.logDate)
]);

// ============================================================
// RELATIONS
// ============================================================
export const profilesRelations = relations(profiles, ({ many, one }) => ({
  addresses: many(addresses),
  orders: many(orders),
  cartItems: many(cartItems),
  favorites: many(userFavorites),
  notifications: many(notifications),
  riderProfile: one(riders, {
    fields: [profiles.id],
    references: [riders.userId]
  })
}));

export const storesRelations = relations(stores, ({ one, many }) => ({
  manager: one(profiles, {
    fields: [stores.managerUserId],
    references: [profiles.id]
  }),
  products: many(products),
  riders: many(riders),
  orders: many(orders),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  subCategories: many(subCategories),
}));

export const subCategoriesRelations = relations(subCategories, ({ one, many }) => ({
  category: one(categories, {
    fields: [subCategories.categoryId],
    references: [categories.id]
  }),
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  store: one(stores, {
    fields: [products.storeId],
    references: [stores.id]
  }),
  subCategory: one(subCategories, {
    fields: [products.subCategoryId],
    references: [subCategories.id]
  }),
  variants: many(productVariants),
  orderItems: many(orderItems),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(profiles, {
    fields: [orders.userId],
    references: [profiles.id]
  }),
  store: one(stores, {
    fields: [orders.storeId],
    references: [stores.id]
  }),
  rider: one(profiles, {
    fields: [orders.riderId],
    references: [profiles.id]
  }),
  address: one(addresses, {
    fields: [orders.addressId],
    references: [addresses.id]
  }),
  items: many(orderItems),
  delivery: one(deliveries, {
    fields: [orders.id],
    references: [deliveries.orderId]
  }),
  deliverySlot: one(deliverySlots, {
    fields: [orders.deliverySlotId],
    references: [deliverySlots.id]
  })
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id]
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id]
  }),
  variant: one(productVariants, {
    fields: [orderItems.variantId],
    references: [productVariants.id]
  })
}));

export const productVariantsRelations = relations(productVariants, ({ one, many }) => ({
  product: one(products, {
    fields: [productVariants.productId],
    references: [products.id]
  }),
  orderItems: many(orderItems),
  cartItems: many(cartItems),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  user: one(profiles, {
    fields: [cartItems.userId],
    references: [profiles.id]
  }),
  product: one(products, {
    fields: [cartItems.productId],
    references: [products.id]
  }),
  variant: one(productVariants, {
    fields: [cartItems.variantId],
    references: [productVariants.id]
  }),
  store: one(stores, {
    fields: [cartItems.storeId],
    references: [stores.id]
  }),
}));

export const ridersRelations = relations(riders, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [riders.userId],
    references: [profiles.id]
  }),
  store: one(stores, {
    fields: [riders.assignedStoreId],
    references: [stores.id]
  }),
  distanceLogs: many(riderDistanceLogs),
}));

export const riderDistanceLogsRelations = relations(riderDistanceLogs, ({ one }) => ({
  rider: one(riders, {
    fields: [riderDistanceLogs.riderId],
    references: [riders.id]
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  profile: one(profiles, {
    fields: [notifications.userId],
    references: [profiles.id]
  }),
}));
