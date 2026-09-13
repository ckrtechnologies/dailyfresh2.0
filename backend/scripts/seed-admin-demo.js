import { db, pool } from '../src/db/index.js';
import { 
  profiles, 
  stores, 
  riders,
  addresses,
  categories, 
  subCategories, 
  products, 
  productVariants, 
  settings, 
  deliverySlots,
  coupons,
  banners,
  orders,
  orderItems,
  deliveries
} from '../src/db/schema.js';
import bcrypt from 'bcryptjs';
import { eq, inArray } from 'drizzle-orm';

async function seedAdminDemo() {
  console.log('🌱 [Admin Demo Seed] Starting realistic seed generation for DailyFresh Admin Panel...');

  const passwordHash = await bcrypt.hash('password@1', 10);

  // 1. DELIVERY SLOTS
  console.log('1. Ensuring delivery slots...');
  let slots = await db.select().from(deliverySlots);
  if (slots.length === 0) {
    slots = await db.insert(deliverySlots).values([
      { type: 'tomorrow_morning', slotName: '7 AM - 10 AM', startTime: '07:00', endTime: '10:00', displayOrder: 1, isActive: true },
      { type: 'tomorrow_morning', slotName: '10 AM - 1 PM', startTime: '10:00', endTime: '13:00', displayOrder: 2, isActive: true },
      { type: 'tomorrow_evening', slotName: '4 PM - 7 PM', startTime: '16:00', endTime: '19:00', displayOrder: 1, isActive: true },
      { type: 'tomorrow_evening', slotName: '7 PM - 10 PM', startTime: '19:00', endTime: '22:00', displayOrder: 2, isActive: true },
    ]).returning();
  }

  // 2. STORE MANAGERS PROFILES
  console.log('2. Seeding store managers...');
  const managerData = [
    { fullName: 'Sourav Ganguly (South)', email: 'manager.south@dailyfresh.com', phone: '+919830000001' },
    { fullName: 'Debashis Roy (Salt Lake)', email: 'manager.saltlake@dailyfresh.com', phone: '+919830000002' },
    { fullName: 'Priyanka Banerjee (New Town)', email: 'manager.newtown@dailyfresh.com', phone: '+919830000003' },
    { fullName: 'Abir Chatterjee (Howrah)', email: 'manager.howrah@dailyfresh.com', phone: '+919830000004' },
  ];

  const managers = [];
  for (const m of managerData) {
    const [mgr] = await db.insert(profiles).values({
      fullName: m.fullName,
      email: m.email,
      phone: m.phone,
      passwordHash,
      role: 'store_manager',
      authProvider: 'local',
      avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(m.fullName)}`,
      isActive: true
    }).onConflictDoUpdate({
      target: profiles.email,
      set: { fullName: m.fullName, phone: m.phone, role: 'store_manager', passwordHash }
    }).returning();
    managers.push(mgr);
  }

  // 3. STORES (4 Hubs)
  console.log('3. Seeding stores...');
  const storeDefs = [
    {
      name: 'DailyFresh Flagship Store - South Kolkata',
      address: '14/2 Park Street, Near Forum Mall',
      city: 'Kolkata', state: 'West Bengal', pincode: '700016',
      latitude: '22.5505000', longitude: '88.3527000',
      phone: '+919876543211', email: 'south-kolkata@dailyfresh.com',
      openingTime: '06:00:00', closingTime: '22:00:00', deliveryRadiusKm: '15.00',
      serviceablePincodes: ['700016', '700017', '700019', '700020', '700029', '700032'],
      managerUserId: managers[0].id, isActive: true
    },
    {
      name: 'DailyFresh Hub - Salt Lake Sector V',
      address: 'Block EP & GP, Sector V, Salt Lake',
      city: 'Kolkata', state: 'West Bengal', pincode: '700091',
      latitude: '22.5735000', longitude: '88.4331000',
      phone: '+919876543212', email: 'saltlake-hub@dailyfresh.com',
      openingTime: '06:00:00', closingTime: '22:00:00', deliveryRadiusKm: '12.00',
      serviceablePincodes: ['700091', '700064', '700098', '700106'],
      managerUserId: managers[1].id, isActive: true
    },
    {
      name: 'DailyFresh Hub - New Town Rajarhat',
      address: 'Action Area II, Major Arterial Road, New Town',
      city: 'Kolkata', state: 'West Bengal', pincode: '700156',
      latitude: '22.5937000', longitude: '88.4800000',
      phone: '+919876543213', email: 'newtown-hub@dailyfresh.com',
      openingTime: '06:00:00', closingTime: '22:00:00', deliveryRadiusKm: '15.00',
      serviceablePincodes: ['700156', '700135', '700157', '700160'],
      managerUserId: managers[2].id, isActive: true
    },
    {
      name: 'DailyFresh Hub - Howrah Central',
      address: '12/1 G.T. Road, Near Howrah Station',
      city: 'Howrah', state: 'West Bengal', pincode: '711101',
      latitude: '22.5892000', longitude: '88.3411000',
      phone: '+919876543214', email: 'howrah-hub@dailyfresh.com',
      openingTime: '06:00:00', closingTime: '21:00:00', deliveryRadiusKm: '10.00',
      serviceablePincodes: ['711101', '711102', '711103', '711106'],
      managerUserId: managers[3].id, isActive: true
    }
  ];

  const seededStores = [];
  for (const s of storeDefs) {
    const [existing] = await db.select().from(stores).where(eq(stores.name, s.name)).limit(1);
    if (existing) {
      const [updated] = await db.update(stores).set(s).where(eq(stores.id, existing.id)).returning();
      seededStores.push(updated);
    } else {
      const [created] = await db.insert(stores).values(s).returning();
      seededStores.push(created);
    }
  }

  // 4. RIDERS (5 Riders with Profiles and Active Fleets)
  console.log('4. Seeding delivery riders...');
  const riderDefs = [
    {
      fullName: 'Subhasish Bose', email: 'rider.subhasish@dailyfresh.com', phone: '+919830111221',
      vehicleType: 'Bike', vehicleNumber: 'WB-01-AB-1234', storeIndex: 0, isOnline: true, approvalStatus: 'approved'
    },
    {
      fullName: 'Rahul Mondal', email: 'rider.rahul@dailyfresh.com', phone: '+919830111222',
      vehicleType: 'Scooter', vehicleNumber: 'WB-02-CD-5678', storeIndex: 1, isOnline: true, approvalStatus: 'approved'
    },
    {
      fullName: 'Aniket Das', email: 'rider.aniket@dailyfresh.com', phone: '+919830111223',
      vehicleType: 'Bike', vehicleNumber: 'WB-03-EF-9012', storeIndex: 2, isOnline: false, approvalStatus: 'approved'
    },
    {
      fullName: 'Bikram Ghosh', email: 'rider.bikram@dailyfresh.com', phone: '+919830111224',
      vehicleType: 'Scooter', vehicleNumber: 'WB-04-GH-3456', storeIndex: 0, isOnline: true, approvalStatus: 'approved'
    },
    {
      fullName: 'Manish Sharma', email: 'rider.manish@dailyfresh.com', phone: '+919830111225',
      vehicleType: 'EV Bike', vehicleNumber: 'WB-05-IJ-7890', storeIndex: 3, isOnline: false, approvalStatus: 'pending'
    }
  ];

  const seededRiders = [];
  for (const r of riderDefs) {
    const [userProfile] = await db.insert(profiles).values({
      fullName: r.fullName,
      email: r.email,
      phone: r.phone,
      passwordHash,
      role: 'rider',
      authProvider: 'local',
      avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(r.fullName)}`,
      isActive: true
    }).onConflictDoUpdate({
      target: profiles.email,
      set: { fullName: r.fullName, phone: r.phone, role: 'rider' }
    }).returning();

    const [existingRider] = await db.select().from(riders).where(eq(riders.userId, userProfile.id)).limit(1);
    const riderFields = {
      userId: userProfile.id,
      assignedStoreId: seededStores[r.storeIndex].id,
      vehicleType: r.vehicleType,
      vehicleNumber: r.vehicleNumber,
      licenseNumber: `DL-${Math.floor(100000 + Math.random() * 900000)}`,
      approvalStatus: r.approvalStatus,
      isOnline: r.isOnline,
      currentLat: seededStores[r.storeIndex].latitude,
      currentLng: seededStores[r.storeIndex].longitude
    };

    let riderRecord;
    if (existingRider) {
      [riderRecord] = await db.update(riders).set(riderFields).where(eq(riders.id, existingRider.id)).returning();
    } else {
      [riderRecord] = await db.insert(riders).values(riderFields).returning();
    }
    seededRiders.push({ ...riderRecord, profile: userProfile });
  }

  // 5. CUSTOMERS & ADDRESSES
  console.log('5. Seeding customers and delivery addresses...');
  const customerDefs = [
    {
      fullName: 'Arun Mukherjee', email: 'arun.mukherjee@gmail.com', phone: '+919874561001',
      address: { label: 'Home', line1: 'Flat 4B, Heritage Tower', line2: 'Park Street', city: 'Kolkata', pincode: '700016', lat: '22.5510', lng: '88.3530' }
    },
    {
      fullName: 'Swati Sen', email: 'swati.sen@gmail.com', phone: '+919874561002',
      address: { label: 'Home', line1: 'Block CA, Plot 14', line2: 'Sector 1, Salt Lake', city: 'Kolkata', pincode: '700064', lat: '22.5850', lng: '88.4120' }
    },
    {
      fullName: 'Tanmoy Bhattacharya', email: 'tanmoy.bhattacharya@gmail.com', phone: '+919874561003',
      address: { label: 'Office', line1: 'Unit 502, EcoSpace Tech Park', line2: 'Action Area II, New Town', city: 'Kolkata', pincode: '700156', lat: '22.5940', lng: '88.4810' }
    },
    {
      fullName: 'Megha Dasgupta', email: 'megha.dasgupta@gmail.com', phone: '+919874561004',
      address: { label: 'Home', line1: '24/1 Ballygunge Circular Rd', line2: 'Opposite CCFC Club', city: 'Kolkata', pincode: '700019', lat: '22.5320', lng: '88.3610' }
    },
    {
      fullName: 'Rohit Chatterjee', email: 'rohit.chatterjee@gmail.com', phone: '+919874561005',
      address: { label: 'Home', line1: '88 Mandirtala Lane', line2: 'Near Nabanna', city: 'Howrah', pincode: '711102', lat: '22.5620', lng: '88.3220' }
    }
  ];

  const seededCustomers = [];
  for (const c of customerDefs) {
    const [custProfile] = await db.insert(profiles).values({
      fullName: c.fullName,
      email: c.email,
      phone: c.phone,
      passwordHash,
      role: 'customer',
      authProvider: 'local',
      avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(c.fullName)}`,
      isActive: true
    }).onConflictDoUpdate({
      target: profiles.email,
      set: { fullName: c.fullName, phone: c.phone, role: 'customer' }
    }).returning();

    const [existingAddr] = await db.select().from(addresses).where(eq(addresses.userId, custProfile.id)).limit(1);
    let addr;
    if (existingAddr) {
      addr = existingAddr;
    } else {
      [addr] = await db.insert(addresses).values({
        userId: custProfile.id,
        label: c.address.label,
        fullName: c.fullName,
        phone: c.phone,
        line1: c.address.line1,
        line2: c.address.line2,
        city: c.address.city,
        state: 'West Bengal',
        pincode: c.address.pincode,
        latitude: c.address.lat,
        longitude: c.address.lng,
        isDefault: true
      }).returning();
    }
    seededCustomers.push({ profile: custProfile, address: addr });
  }

  // 6. COUPONS
  console.log('6. Seeding promotional coupons...');
  const couponDefs = [
    {
      code: 'WELCOME50',
      description: '50% off on your first DailyFresh order above ₹299',
      discountType: 'percentage',
      discountValue: '50.00',
      minOrderAmount: '299.00',
      maxDiscountAmount: '150.00',
      usageLimit: 1000,
      isActive: true,
      startDate: new Date(),
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
    },
    {
      code: 'FRESH100',
      description: 'Flat ₹100 instant discount on orders above ₹699',
      discountType: 'flat',
      discountValue: '100.00',
      minOrderAmount: '699.00',
      maxDiscountAmount: '100.00',
      usageLimit: 500,
      isActive: true,
      startDate: new Date(),
      endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
    },
    {
      code: 'SEAFOOD25',
      description: '25% off on all Fresh Catch and Prawn orders',
      discountType: 'percentage',
      discountValue: '25.00',
      minOrderAmount: '499.00',
      maxDiscountAmount: '200.00',
      usageLimit: 300,
      isActive: true,
      startDate: new Date(),
      endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000)
    },
    {
      code: 'WEEKEND20',
      description: 'Weekend special 20% discount on orders above ₹399',
      discountType: 'percentage',
      discountValue: '20.00',
      minOrderAmount: '399.00',
      maxDiscountAmount: '120.00',
      usageLimit: 400,
      isActive: true,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }
  ];

  for (const cp of couponDefs) {
    const [existing] = await db.select().from(coupons).where(eq(coupons.code, cp.code)).limit(1);
    if (existing) {
      await db.update(coupons).set(cp).where(eq(coupons.id, existing.id));
    } else {
      await db.insert(coupons).values(cp);
    }
  }

  // 7. BANNERS
  console.log('7. Seeding promotional banners...');
  const bannerDefs = [
    {
      title: 'Midnight Caught Fresh River Hilsa',
      imageUrl: 'https://images.unsplash.com/photo-1534939561126-855b8675edd7?auto=format&fit=crop&w=1200&q=80',
      linkUrl: '/category/fresh-fish',
      placement: 'home_top',
      displayOrder: 1,
      isActive: true
    },
    {
      title: 'Farm Fresh Chicken - Cleaned & Antibiotic Free',
      imageUrl: 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?auto=format&fit=crop&w=1200&q=80',
      linkUrl: '/category/poultry',
      placement: 'home_top',
      displayOrder: 2,
      isActive: true
    },
    {
      title: 'Bengali Special Sunday Mutton Cuts',
      imageUrl: 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?auto=format&fit=crop&w=1200&q=80',
      linkUrl: '/category/mutton',
      placement: 'home_top',
      displayOrder: 3,
      isActive: true
    }
  ];

  for (const b of bannerDefs) {
    const [existing] = await db.select().from(banners).where(eq(banners.title, b.title)).limit(1);
    if (existing) {
      await db.update(banners).set(b).where(eq(banners.id, existing.id));
    } else {
      await db.insert(banners).values(b);
    }
  }

  // 8. PRODUCTS & INVENTORY
  console.log('8. Seeding rich catalog items & low-stock alerts...');
  const catRows = await db.select().from(categories);
  const subCatRows = await db.select().from(subCategories);

  const getSubCatId = (slug) => {
    const sc = subCatRows.find(s => s.slug === slug);
    return sc ? sc.id : subCatRows[0]?.id;
  };

  const productDefs = [
    {
      name: 'Farm Fresh Chicken Breast (Boneless)',
      slug: 'fresh-chicken-breast-boneless',
      description: 'Tender, skinless and boneless chicken breast fillets trimmed to perfection.',
      price: '280.00', discountPrice: '250.00', weightUnit: 'kg', stockQuantity: 45,
      expressStockQty: 25, scheduledStockQty: 20,
      subCategoryId: getSubCatId('chicken-curry-cut'), storeId: seededStores[0].id,
      imageUrl: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=600&q=80',
      isFeatured: true, isDeal: true, isActive: true
    },
    {
      name: 'Tender Bengal Mutton (Curry Cut)',
      slug: 'bengal-mutton-curry-cut',
      description: 'Fresh succulent goat meat curry cut, freshly sourced from local pastures.',
      price: '790.00', discountPrice: '740.00', weightUnit: 'kg', stockQuantity: 3, // LOW STOCK ALERT
      expressStockQty: 2, scheduledStockQty: 1,
      subCategoryId: getSubCatId('chicken-curry-cut'), storeId: seededStores[0].id,
      imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
      isFeatured: true, isDeal: false, isActive: true
    },
    {
      name: 'Premium Padma River Hilsa (Ilish)',
      slug: 'padma-river-hilsa-fish',
      description: 'Exquisite silver Hilsa with rich natural oil content, cleaned and steak-cut.',
      price: '1290.00', discountPrice: '1190.00', weightUnit: 'kg', stockQuantity: 2, // LOW STOCK ALERT
      expressStockQty: 1, scheduledStockQty: 1,
      subCategoryId: getSubCatId('freshwater-fish'), storeId: seededStores[1].id,
      imageUrl: 'https://images.unsplash.com/photo-1534939561126-855b8675edd7?auto=format&fit=crop&w=600&q=80',
      isFeatured: true, isDeal: true, isActive: true
    },
    {
      name: 'Jumbo Freshwater Tiger Prawns',
      slug: 'jumbo-tiger-prawns',
      description: 'Deveined, head-on giant sweet water prawns ideal for Malaikari recipes.',
      price: '650.00', discountPrice: '599.00', weightUnit: 'kg', stockQuantity: 18,
      expressStockQty: 10, scheduledStockQty: 8,
      subCategoryId: getSubCatId('prawns-crabs'), storeId: seededStores[2].id,
      imageUrl: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?auto=format&fit=crop&w=600&q=80',
      isFeatured: true, isDeal: false, isActive: true
    },
    {
      name: 'Farm Fresh Country Eggs (Pack of 12)',
      slug: 'farm-fresh-country-eggs-12',
      description: 'Brown free-range eggs rich in Omega-3 and natural yellow yolk.',
      price: '120.00', discountPrice: '105.00', weightUnit: 'pack', stockQuantity: 4, // LOW STOCK ALERT
      expressStockQty: 2, scheduledStockQty: 2,
      subCategoryId: getSubCatId('chicken-curry-cut'), storeId: seededStores[3].id,
      imageUrl: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=600&q=80',
      isFeatured: false, isDeal: true, isActive: true
    }
  ];

  const seededProducts = [];
  for (const p of productDefs) {
    const [existing] = await db.select().from(products).where(eq(products.slug, p.slug)).limit(1);
    let prod;
    if (existing) {
      [prod] = await db.update(products).set(p).where(eq(products.id, existing.id)).returning();
    } else {
      [prod] = await db.insert(products).values(p).returning();
    }
    seededProducts.push(prod);
  }

  // 9. ORDERS & ORDER ITEMS (Diverse statuses for testing)
  console.log('9. Seeding realistic live and past orders...');
  const orderDefs = [
    {
      orderNumber: `DF-${Date.now()}-101`,
      userIndex: 0, storeIndex: 0, riderIndex: null,
      deliveryType: 'express', status: 'placed', paymentStatus: 'unpaid', paymentMethod: 'cod',
      items: [
        { prodIndex: 0, qty: 1, unitPrice: '250.00', name: 'Farm Fresh Chicken Breast (Boneless)' },
        { prodIndex: 4, qty: 1, unitPrice: '105.00', name: 'Farm Fresh Country Eggs (Pack of 12)' }
      ],
      deliveryCharge: '40.00', gstAmount: '17.75', discountAmount: '0.00', totalAmount: '412.75'
    },
    {
      orderNumber: `DF-${Date.now()}-102`,
      userIndex: 1, storeIndex: 1, riderIndex: null,
      deliveryType: 'tomorrow_morning', status: 'confirmed', paymentStatus: 'paid', paymentMethod: 'razorpay',
      items: [
        { prodIndex: 2, qty: 1, unitPrice: '1190.00', name: 'Premium Padma River Hilsa (Ilish)' }
      ],
      deliveryCharge: '0.00', gstAmount: '59.50', discountAmount: '100.00', totalAmount: '1149.50'
    },
    {
      orderNumber: `DF-${Date.now()}-103`,
      userIndex: 2, storeIndex: 2, riderIndex: null,
      deliveryType: 'express', status: 'preparing', paymentStatus: 'paid', paymentMethod: 'razorpay',
      items: [
        { prodIndex: 3, qty: 2, unitPrice: '599.00', name: 'Jumbo Freshwater Tiger Prawns' }
      ],
      deliveryCharge: '0.00', gstAmount: '59.90', discountAmount: '0.00', totalAmount: '1257.90'
    },
    {
      orderNumber: `DF-${Date.now()}-104`,
      userIndex: 3, storeIndex: 0, riderIndex: 0, // Assigned to Subhasish Bose
      deliveryType: 'express', status: 'out_for_delivery', paymentStatus: 'paid', paymentMethod: 'razorpay',
      items: [
        { prodIndex: 1, qty: 1, unitPrice: '740.00', name: 'Tender Bengal Mutton (Curry Cut)' }
      ],
      deliveryCharge: '0.00', gstAmount: '37.00', discountAmount: '50.00', totalAmount: '727.00'
    },
    {
      orderNumber: `DF-${Date.now()}-105`,
      userIndex: 4, storeIndex: 3, riderIndex: 1, // Delivered
      deliveryType: 'express', status: 'delivered', paymentStatus: 'paid', paymentMethod: 'cod',
      items: [
        { prodIndex: 0, qty: 2, unitPrice: '250.00', name: 'Farm Fresh Chicken Breast (Boneless)' },
        { prodIndex: 4, qty: 2, unitPrice: '105.00', name: 'Farm Fresh Country Eggs (Pack of 12)' }
      ],
      deliveryCharge: '0.00', gstAmount: '35.50', discountAmount: '0.00', totalAmount: '745.50'
    },
    {
      orderNumber: `DF-${Date.now()}-106`,
      userIndex: 0, storeIndex: 0, riderIndex: 3, // Delivered (Revenue booster)
      deliveryType: 'tomorrow_morning', status: 'delivered', paymentStatus: 'paid', paymentMethod: 'razorpay',
      items: [
        { prodIndex: 1, qty: 2, unitPrice: '740.00', name: 'Tender Bengal Mutton (Curry Cut)' }
      ],
      deliveryCharge: '0.00', gstAmount: '74.00', discountAmount: '150.00', totalAmount: '1404.00'
    },
    {
      orderNumber: `DF-${Date.now()}-107`,
      userIndex: 1, storeIndex: 1, riderIndex: 1, // Delivered (Revenue booster)
      deliveryType: 'express', status: 'delivered', paymentStatus: 'paid', paymentMethod: 'razorpay',
      items: [
        { prodIndex: 2, qty: 1, unitPrice: '1190.00', name: 'Premium Padma River Hilsa (Ilish)' }
      ],
      deliveryCharge: '0.00', gstAmount: '59.50', discountAmount: '0.00', totalAmount: '1249.50'
    },
    {
      orderNumber: `DF-${Date.now()}-108`,
      userIndex: 2, storeIndex: 2, riderIndex: null, // Cancelled
      deliveryType: 'express', status: 'cancelled', paymentStatus: 'unpaid', paymentMethod: 'cod',
      items: [
        { prodIndex: 3, qty: 1, unitPrice: '599.00', name: 'Jumbo Freshwater Tiger Prawns' }
      ],
      deliveryCharge: '40.00', gstAmount: '29.95', discountAmount: '0.00', totalAmount: '668.95',
      cancellationReason: 'Customer requested cancellation before dispatch'
    }
  ];

  for (const o of orderDefs) {
    const [existing] = await db.select().from(orders).where(eq(orders.orderNumber, o.orderNumber)).limit(1);
    if (!existing) {
      const customer = seededCustomers[o.userIndex];
      const store = seededStores[o.storeIndex];
      const assignedRider = o.riderIndex !== null ? seededRiders[o.riderIndex] : null;

      const totalItemsPrice = o.items.reduce((sum, item) => sum + (Number(item.unitPrice) * item.qty), 0).toFixed(2);

      const [createdOrder] = await db.insert(orders).values({
        orderNumber: o.orderNumber,
        userId: customer.profile.id,
        storeId: store.id,
        riderId: assignedRider ? assignedRider.profile.id : null,
        addressId: customer.address.id,
        deliveryType: o.deliveryType,
        deliverySlotId: slots[0]?.id || null,
        deliverySlotLabel: slots[0]?.slotName || 'Standard Express',
        latitude: customer.address.latitude,
        longitude: customer.address.longitude,
        status: o.status,
        paymentStatus: o.paymentStatus,
        paymentMethod: o.paymentMethod,
        totalItemsPrice,
        deliveryCharge: o.deliveryCharge,
        gstAmount: o.gstAmount,
        discountAmount: o.discountAmount,
        totalAmount: o.totalAmount,
        cancellationReason: o.cancellationReason || null
      }).returning();

      for (const item of o.items) {
        const prod = seededProducts[item.prodIndex];
        await db.insert(orderItems).values({
          orderId: createdOrder.id,
          productId: prod.id,
          storeId: store.id,
          name: item.name,
          quantity: item.qty,
          unitPrice: item.unitPrice,
          totalPrice: (Number(item.unitPrice) * item.qty).toFixed(2)
        });
      }

      if (assignedRider) {
        await db.insert(deliveries).values({
          orderId: createdOrder.id,
          riderId: assignedRider.id,
          storeId: store.id,
          status: o.status === 'delivered' ? 'delivered' : 'out_for_delivery',
          otp: '1234',
          riderEarning: '65.00',
          pickedUpAt: new Date(),
          deliveredAt: o.status === 'delivered' ? new Date() : null
        });
      }
    }
  }

  console.log('✅ [Admin Demo Seed] Seed data generated successfully!');
  process.exit(0);
}

seedAdminDemo().catch(err => {
  console.error('❌ [Admin Demo Seed Error]:', err);
  process.exit(1);
});
