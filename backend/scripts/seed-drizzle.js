import { db, pool } from '../src/db/index.js';
import { 
  profiles, 
  stores, 
  categories, 
  subCategories, 
  products, 
  productVariants, 
  settings, 
  deliverySlots,
  banners
} from '../src/db/schema.js';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';

async function seed() {
  console.log('🌱 [Drizzle Seed] Starting database seeding for DailyFresh...');

  try {
    // 1. Settings
    console.log('1. Seeding settings...');
    const defaultSettings = [
      { key: 'gst_rate', value: '5', dataType: 'number', description: 'GST percentage applied to orders' },
      { key: 'free_delivery_above', value: '499', dataType: 'number', description: 'Order value above which delivery is free (INR)' },
      { key: 'default_delivery_charge', value: '60', dataType: 'number', description: 'Standard delivery charge below free threshold (INR)' },
      { key: 'min_order_value', value: '99', dataType: 'number', description: 'Minimum order amount allowed (INR)' },
      { key: 'contact_support_phone', value: '+91 98765 43210', dataType: 'string', description: 'Customer support phone number' },
      { key: 'contact_support_email', value: 'support@dailyfreshkolkata.in', dataType: 'string', description: 'Customer support email address' },
    ];

    for (const s of defaultSettings) {
      await db.insert(settings).values(s).onConflictDoUpdate({
        target: settings.key,
        set: { value: s.value, dataType: s.dataType, description: s.description }
      });
    }

    // 2. Delivery Slots
    console.log('2. Seeding delivery slots...');
    const existingSlots = await db.select().from(deliverySlots);
    if (existingSlots.length === 0) {
      await db.insert(deliverySlots).values([
        { type: 'tomorrow_morning', slotName: '9 AM - 10 AM', startTime: '09:00', endTime: '10:00', displayOrder: 1 },
        { type: 'tomorrow_morning', slotName: '10 AM - 12 PM', startTime: '10:00', endTime: '12:00', displayOrder: 2 },
        { type: 'tomorrow_evening', slotName: '4 PM - 6 PM', startTime: '16:00', endTime: '18:00', displayOrder: 1 },
        { type: 'tomorrow_evening', slotName: '6 PM - 8 PM', startTime: '18:00', endTime: '20:00', displayOrder: 2 },
      ]);
    }

    // 3. Admin & Manager Profiles
    console.log('3. Seeding admin & manager profiles...');
    const passwordHash = await bcrypt.hash('password@1', 10);

    const [adminUser] = await db.insert(profiles).values({
      fullName: 'DailyFresh Super Admin',
      email: 'admin@dailyfresh.com',
      phone: '+919876543210',
      passwordHash,
      role: 'admin',
      authProvider: 'local',
      avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=admin',
      isActive: true
    }).onConflictDoUpdate({
      target: profiles.email,
      set: { passwordHash, role: 'admin', fullName: 'DailyFresh Super Admin' }
    }).returning();

    const [managerUser] = await db.insert(profiles).values({
      fullName: 'Kolkata Hub Manager',
      email: 'manager@dailyfresh.com',
      phone: '+919876543211',
      passwordHash,
      role: 'store_manager',
      authProvider: 'local',
      avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=manager',
      isActive: true
    }).onConflictDoUpdate({
      target: profiles.email,
      set: { passwordHash, role: 'store_manager' }
    }).returning();

    // 4. Default Store
    console.log('4. Seeding default store...');
    let [mainStore] = await db.select().from(stores).where(eq(stores.name, 'DailyFresh Flagship Store - South Kolkata'));
    if (!mainStore) {
      [mainStore] = await db.insert(stores).values({
        name: 'DailyFresh Flagship Store - South Kolkata',
        managerUserId: managerUser.id,
        address: '14/2 Park Street, Near Forum Mall',
        city: 'Kolkata',
        state: 'West Bengal',
        pincode: '700016',
        phone: '+919876543211',
        email: 'kolkata-hub@dailyfresh.com',
        latitude: '22.5505000',
        longitude: '88.3527000',
        openingTime: '06:00',
        closingTime: '22:00',
        deliveryRadiusKm: '15.00',
        serviceablePincodes: ['700016', '700017', '700019', '700020', '700029', '700032'],
        isActive: true
      }).returning();
    }

    // 5. Categories & Subcategories
    console.log('5. Seeding categories...');
    const catList = [
      { name: 'Fresh Fruits', slug: 'fresh-fruits', imageUrl: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=400&q=80', displayOrder: 1 },
      { name: 'Organic Vegetables', slug: 'organic-vegetables', imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=400&q=80', displayOrder: 2 },
      { name: 'Fish & Seafood', slug: 'fish-seafood', imageUrl: 'https://images.unsplash.com/photo-1534939561126-855b8675edd7?auto=format&fit=crop&w=400&q=80', displayOrder: 3 },
      { name: 'Poultry & Meat', slug: 'poultry-meat', imageUrl: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=400&q=80', displayOrder: 4 },
      { name: 'Dairy & Eggs', slug: 'dairy-eggs', imageUrl: 'https://images.unsplash.com/photo-1527153857715-3908f2bae5e8?auto=format&fit=crop&w=400&q=80', displayOrder: 5 },
    ];

    const categoryMap = {};
    for (const c of catList) {
      const [insertedCat] = await db.insert(categories).values(c).onConflictDoUpdate({
        target: categories.slug,
        set: { name: c.name, imageUrl: c.imageUrl, displayOrder: c.displayOrder }
      }).returning();
      categoryMap[c.slug] = insertedCat.id;
    }

    // Subcategories
    const subCatList = [
      { categoryId: categoryMap['fresh-fruits'], name: 'Seasonal Fruits', slug: 'seasonal-fruits', displayOrder: 1 },
      { categoryId: categoryMap['fresh-fruits'], name: 'Exotic Fruits', slug: 'exotic-fruits', displayOrder: 2 },
      { categoryId: categoryMap['organic-vegetables'], name: 'Leafy Greens', slug: 'leafy-greens', displayOrder: 1 },
      { categoryId: categoryMap['organic-vegetables'], name: 'Root Vegetables', slug: 'root-vegetables', displayOrder: 2 },
      { categoryId: categoryMap['fish-seafood'], name: 'Freshwater Fish', slug: 'freshwater-fish', displayOrder: 1 },
      { categoryId: categoryMap['fish-seafood'], name: 'Prawns & Crabs', slug: 'prawns-crabs', displayOrder: 2 },
      { categoryId: categoryMap['poultry-meat'], name: 'Farm Chicken', slug: 'farm-chicken', displayOrder: 1 },
      { categoryId: categoryMap['dairy-eggs'], name: 'Fresh Milk & Paneer', slug: 'milk-paneer', displayOrder: 1 },
    ];

    const subCategoryMap = {};
    for (const sc of subCatList) {
      const [insertedSub] = await db.insert(subCategories).values(sc).onConflictDoUpdate({
        target: subCategories.slug,
        set: { name: sc.name, categoryId: sc.categoryId }
      }).returning();
      subCategoryMap[sc.slug] = insertedSub.id;
    }

    // 6. Products
    console.log('6. Seeding products & variants...');
    const productList = [
      {
        storeId: mainStore.id,
        subCategoryId: subCategoryMap['seasonal-fruits'],
        name: 'Alphonso Mangoes (Ratnagiri Prime)',
        slug: 'alphonso-mangoes-ratnagiri',
        sku: 'FRU-MAN-001',
        description: 'Naturally ripened, premium export quality GI-tagged Alphonso mangoes.',
        price: '599.00',
        discountPrice: '529.00',
        weightUnit: 'box',
        stockQuantity: 120,
        expressStockQty: 40,
        scheduledStockQty: 80,
        isOrganic: true,
        isFeatured: true,
        isDeal: true,
        imageUrl: 'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=600&q=80',
        variants: [
          { name: 'Box of 6 Pcs (Standard)', price: '529.00', weightText: '6 Pcs (~1.5kg)' },
          { name: 'Box of 12 Pcs (Family Pack)', price: '999.00', discountPrice: '949.00', weightText: '12 Pcs (~3kg)' }
        ]
      },
      {
        storeId: mainStore.id,
        subCategoryId: subCategoryMap['leafy-greens'],
        name: 'Organic Hydroponic Baby Spinach',
        slug: 'organic-baby-spinach',
        sku: 'VEG-SPI-002',
        description: 'Tender, pesticide-free baby spinach grown in climate-controlled hydroponic farms.',
        price: '79.00',
        discountPrice: '59.00',
        weightUnit: 'pack',
        stockQuantity: 85,
        expressStockQty: 50,
        isOrganic: true,
        isFeatured: true,
        imageUrl: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=600&q=80',
        variants: [
          { name: '200g Fresh Pack', price: '59.00', weightText: '200g' }
        ]
      },
      {
        storeId: mainStore.id,
        subCategoryId: subCategoryMap['freshwater-fish'],
        name: 'Fresh Bengali Rohu Fish (Curry Cut)',
        slug: 'fresh-rohu-fish-curry-cut',
        sku: 'FSH-ROH-003',
        description: 'Freshly caught river Rohu, thoroughly cleaned, gutted and sliced into uniform curry pieces.',
        price: '340.00',
        discountPrice: '299.00',
        weightUnit: 'kg',
        stockQuantity: 45,
        expressStockQty: 25,
        cutOptions: ['Curry Cut with Head', 'Curry Cut without Head', 'Fillet Steaks'],
        cleaningOptions: ['Descaled & Gutted', 'Full Clean with Haldi Rinse'],
        imageUrl: 'https://images.unsplash.com/photo-1534939561126-855b8675edd7?auto=format&fit=crop&w=600&q=80',
        variants: [
          { name: '500g Net Cut', price: '159.00', weightText: '500g (Gross: ~650g)' },
          { name: '1000g Net Cut', price: '299.00', weightText: '1kg (Gross: ~1.3kg)' }
        ]
      },
      {
        storeId: mainStore.id,
        subCategoryId: subCategoryMap['farm-chicken'],
        name: 'Farm Fresh Chicken Breast (Boneless)',
        slug: 'chicken-breast-boneless',
        sku: 'PLT-CHK-004',
        description: '100% antibiotic-free, tender chicken breast fillets, trimmed and ready to cook.',
        price: '280.00',
        discountPrice: '249.00',
        weightUnit: 'pack',
        stockQuantity: 70,
        expressStockQty: 35,
        isFeatured: true,
        imageUrl: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=600&q=80',
        variants: [
          { name: '450g Pack (2-3 fillets)', price: '249.00', weightText: '450g' }
        ]
      }
    ];

    for (const p of productList) {
      const { variants, ...prodData } = p;
      const [insertedProd] = await db.insert(products).values(prodData).onConflictDoUpdate({
        target: products.slug,
        set: prodData
      }).returning();

      if (variants && variants.length > 0) {
        for (const v of variants) {
          await db.insert(productVariants).values({
            productId: insertedProd.id,
            name: v.name,
            price: v.price,
            discountPrice: v.discountPrice || null,
            weightText: v.weightText || null
          });
        }
      }
    }

    // 7. Hero Banners
    console.log('7. Seeding banners...');
    const existingBanners = await db.select().from(banners);
    if (existingBanners.length === 0) {
      await db.insert(banners).values([
        {
          title: 'Morning Catch - Fresh Hilsa & Rohu Delivered in 90 Mins',
          imageUrl: 'https://images.unsplash.com/photo-1534939561126-855b8675edd7?auto=format&fit=crop&w=1200&q=80',
          placement: 'hero',
          displayOrder: 1,
          isActive: true
        },
        {
          title: 'Certified Organic Summer Produce - Up to 25% Off',
          imageUrl: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=1200&q=80',
          placement: 'promotional',
          displayOrder: 2,
          isActive: true
        }
      ]);
    }

    console.log('\n=============================================================');
    console.log('🎉 [DailyFresh Drizzle] Seeding completed successfully!');
    console.log('=============================================================');
    console.log('🔑 Credentials:');
    console.log('   Admin User  : admin@dailyfresh.com / password@1');
    console.log('   Manager User: manager@dailyfresh.com / password@1');
    console.log('   Store       : DailyFresh Flagship Store - South Kolkata');
    console.log('   Categories  :', catList.length);
    console.log('   Products    :', productList.length);
    console.log('=============================================================\n');

  } catch (err) {
    console.error('❌ [Drizzle Seed Error]:', err);
    throw err;
  } finally {
    await pool.end();
  }
}

seed().then(() => process.exit(0)).catch(() => process.exit(1));
