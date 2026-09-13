import axios from 'axios';

const BASE_URL = 'http://localhost:4002/api/v1';
const client = axios.create({ baseURL: BASE_URL });

const results = [];
function record(testName, passed, detail = '') {
  results.push({ testName, passed, detail });
  const icon = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${icon} | ${testName}${detail ? ` -> ${detail}` : ''}`);
}

async function runCrudSuite() {
  console.log('🚀 [DailyFresh Admin Panel CRUD Test Suite]');
  console.log(`Connecting to ${BASE_URL}...\n`);

  // --- 1. AUTHENTICATION ---
  let token = null;
  try {
    const res = await client.post('/auth/login', {
      email: 'admin@dailyfresh.com',
      password: 'password@1'
    });
    token = res.data?.data?.access_token || res.data?.data?.token;
    client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    record('Auth: Login as Super Admin', !!token, `User: ${res.data?.data?.user?.full_name}`);
  } catch (err) {
    record('Auth: Login as Super Admin', false, err.response?.data?.message || err.message);
    process.exit(1);
  }

  // --- 2. DASHBOARD STATS ---
  try {
    const res = await client.get('/admin/stats');
    const stats = res.data?.data?.stats;
    const hasMetrics = stats && stats.orders !== undefined && stats.active_stores !== undefined;
    record('Dashboard: Fetch Live Metrics', hasMetrics, `Orders: ${stats?.orders}, Stores: ${stats?.active_stores}, Revenue: ₹${stats?.revenue}`);
  } catch (err) {
    record('Dashboard: Fetch Live Metrics', false, err.response?.data?.message || err.message);
  }

  // --- 3. CATEGORIES CRUD ---
  let testCategoryId = null;
  try {
    // CREATE
    const createRes = await client.post('/admin/categories', {
      name: 'Organic Greens Test',
      slug: `organic-greens-test-${Date.now()}`,
      description: 'Farm fresh leafy green vegetables',
      display_order: 10,
      is_active: true
    });
    testCategoryId = createRes.data?.data?.category?.id;
    record('Categories: CREATE Category', !!testCategoryId, `ID: ${testCategoryId}`);

    // READ
    const listRes = await client.get('/admin/categories');
    const found = listRes.data?.data?.categories?.find(c => c.id === testCategoryId);
    record('Categories: READ Categories List', !!found, `Found: ${found?.name}`);

    // UPDATE
    const updateRes = await client.patch(`/admin/categories/${testCategoryId}`, {
      name: 'Organic Hydroponic Greens Test',
      display_order: 12
    });
    const updatedName = updateRes.data?.data?.category?.name;
    record('Categories: UPDATE Category', updatedName === 'Organic Hydroponic Greens Test', `Updated Name: ${updatedName}`);
  } catch (err) {
    record('Categories CRUD', false, err.response?.data?.message || err.message);
  }

  // --- 4. SUB-CATEGORIES CRUD ---
  let testSubCategoryId = null;
  try {
    // CREATE
    const createRes = await client.post('/admin/sub-categories', {
      category_id: testCategoryId,
      name: 'Fresh Spinach & Herbs Test',
      slug: `spinach-herbs-test-${Date.now()}`,
      display_order: 1,
      is_active: true
    });
    testSubCategoryId = createRes.data?.data?.sub_category?.id;
    record('Sub-Categories: CREATE Sub-Category', !!testSubCategoryId, `ID: ${testSubCategoryId}`);

    // READ
    const listRes = await client.get('/admin/sub-categories');
    const found = listRes.data?.data?.sub_categories?.find(s => s.id === testSubCategoryId);
    record('Sub-Categories: READ Sub-Categories List', !!found, `Found: ${found?.name}`);

    // UPDATE
    const updateRes = await client.patch(`/admin/sub-categories/${testSubCategoryId}`, {
      name: 'Exotic Hydroponic Spinach Test'
    });
    const updatedName = updateRes.data?.data?.sub_category?.name;
    record('Sub-Categories: UPDATE Sub-Category', updatedName === 'Exotic Hydroponic Spinach Test', `Updated: ${updatedName}`);
  } catch (err) {
    record('Sub-Categories CRUD', false, err.response?.data?.message || err.message);
  }

  // --- 5. STORES CRUD ---
  let testStoreId = null;
  try {
    // CREATE
    const createRes = await client.post('/admin/stores', {
      name: 'DailyFresh Express Hub - Dum Dum Test',
      address: '22 Jessore Road, Near Airport Gate 1',
      city: 'Kolkata',
      state: 'West Bengal',
      pincode: '700028',
      delivery_radius_km: 14,
      phone: '+919876543299',
      email: 'dumdum-hub@dailyfresh.com',
      opening_time: '06:00:00',
      closing_time: '22:00:00',
      is_active: true
    });
    testStoreId = createRes.data?.data?.store?.id;
    record('Stores: CREATE Store Hub', !!testStoreId, `ID: ${testStoreId}`);

    // READ
    const listRes = await client.get('/admin/stores');
    const found = listRes.data?.data?.stores?.find(s => s.id === testStoreId);
    record('Stores: READ Stores List', !!found, `Found: ${found?.name}, Radius: ${found?.delivery_radius_km}km`);

    // UPDATE
    const updateRes = await client.patch(`/admin/stores/${testStoreId}`, {
      delivery_radius_km: 18,
      phone: '+919876543288'
    });
    const updatedRadius = updateRes.data?.data?.store?.deliveryRadiusKm || updateRes.data?.data?.store?.delivery_radius_km;
    record('Stores: UPDATE Store Hub', Number(updatedRadius) === 18, `New Radius: ${updatedRadius}km`);

    // DELETE
    await client.delete(`/admin/stores/${testStoreId}`);
    const afterDelete = await client.get('/admin/stores');
    const stillExists = afterDelete.data?.data?.stores?.some(s => s.id === testStoreId);
    record('Stores: DELETE Store Hub', !stillExists, 'Store successfully removed');
  } catch (err) {
    record('Stores CRUD', false, err.response?.data?.message || err.message);
  }

  // Retrieve an existing active store for product tests
  let activeStoreId = null;
  try {
    const storesRes = await client.get('/admin/stores');
    activeStoreId = storesRes.data?.data?.stores[0]?.id;
  } catch {}

  // --- 6. PRODUCTS CRUD (Matches User Modal) ---
  let testProductId = null;
  try {
    // CREATE
    const createRes = await client.post('/admin/products', {
      name: 'Alphonso Mangoes (Devgad Premium Test)',
      slug: `alphonso-mangoes-test-${Date.now()}`,
      description: 'Naturally ripened, premium export quality GI-tagged Alphonso mangoes.',
      price: 650,
      discount_price: 599,
      stock_quantity: 35,
      express_stock_qty: 20,
      scheduled_stock_qty: 15,
      weight_unit: 'kg',
      store_id: activeStoreId,
      sub_category_id: testSubCategoryId,
      is_deal: true,
      is_featured: true,
      is_active: true,
      variants: [
        { name: '1 kg Pack (4-5 pcs)', price: '650.00', discount_price: '599.00', stock_quantity: 20 },
        { name: '2 kg Box (8-10 pcs)', price: '1250.00', discount_price: '1150.00', stock_quantity: 15 }
      ]
    });
    testProductId = createRes.data?.data?.product?.id;
    record('Products: CREATE Product with Variants', !!testProductId, `ID: ${testProductId}, Name: ${createRes.data?.data?.product?.name}`);

    // READ
    const listRes = await client.get('/admin/products');
    const found = listRes.data?.data?.products?.find(p => p.id === testProductId);
    record('Products: READ Product List', !!found, `Found: ${found?.name}, Price: ₹${found?.price}, Stock: ${found?.stock_quantity}`);

    // UPDATE
    const updateRes = await client.patch(`/admin/products/${testProductId}`, {
      price: 620,
      discount_price: 550,
      stock_quantity: 40,
      description: 'Naturally tree-ripened organic Ratnagiri Alphonso mangoes.'
    });
    const updatedPrice = updateRes.data?.data?.product?.price;
    record('Products: UPDATE Product', Number(updatedPrice) === 620, `Updated Price: ₹${updatedPrice}`);

    // DELETE
    await client.delete(`/admin/products/${testProductId}`);
    const afterDelete = await client.get('/admin/products');
    const stillExists = afterDelete.data?.data?.products?.some(p => p.id === testProductId);
    record('Products: DELETE Product', !stillExists, 'Product successfully removed');
  } catch (err) {
    record('Products CRUD', false, err.response?.data?.message || err.message);
  }

  // --- 7. RIDERS WORKFLOW & CRUD ---
  let testRiderId = null;
  let testRiderUserId = null;
  try {
    // ONBOARD
    const uniqueRiderEmail = `testrider_${Date.now()}@dailyfresh.com`;
    const onboardRes = await client.post('/admin/onboard-staff', {
      full_name: 'Tanmay Karmakar Test',
      email: uniqueRiderEmail,
      phone: '+919830999888',
      password: 'password@1',
      role: 'rider',
      store_id: activeStoreId,
      vehicle_type: 'Honda Shine',
      vehicle_number: 'WB-06-TEST-9999'
    });
    testRiderUserId = onboardRes.data?.data?.staff?.id;
    record('Riders: ONBOARD Delivery Rider', !!testRiderUserId, `User ID: ${testRiderUserId}`);

    // READ
    const ridersRes = await client.get('/admin/riders');
    const rider = ridersRes.data?.data?.riders?.find(r => r.user_id === testRiderUserId);
    testRiderId = rider?.id;
    record('Riders: READ Rider Fleet', !!testRiderId, `Rider ID: ${testRiderId}, Vehicle: ${rider?.vehicle_number}`);

    // UPDATE STATUS
    const toggleRes = await client.patch(`/admin/riders/${testRiderId}`, {
      is_online: true
    });
    record('Riders: UPDATE Online Status', toggleRes.data?.data?.rider?.isOnline === true, 'Marked Online');

    // APPROVE
    const approveRes = await client.patch(`/admin/riders/${testRiderId}/approve`);
    record('Riders: APPROVE Rider Status', approveRes.data?.data?.rider?.approvalStatus === 'approved', 'Status: approved');
  } catch (err) {
    record('Riders Workflow', false, err.response?.data?.message || err.message);
  }

  // --- 8. COUPONS CRUD ---
  let testCouponId = null;
  try {
    const couponCode = `TESTPROMO_${Date.now() % 10000}`;
    // CREATE
    const createRes = await client.post('/admin/coupons', {
      code: couponCode,
      description: 'Test coupon for automated verification',
      discount_type: 'flat',
      discount_value: 75,
      min_order_amount: 399,
      max_discount_amount: 75,
      usage_limit: 100,
      is_active: true,
      start_date: new Date(),
      end_date: new Date(Date.now() + 15 * 86400000)
    });
    testCouponId = createRes.data?.data?.coupon?.id;
    record('Coupons: CREATE Coupon', !!testCouponId, `Code: ${couponCode}`);

    // READ
    const listRes = await client.get('/admin/coupons');
    const found = listRes.data?.data?.coupons?.find(c => c.id === testCouponId);
    record('Coupons: READ Coupon List', !!found, `Found: ${found?.code}, Value: ₹${found?.discount_value}`);

    // UPDATE
    const updateRes = await client.patch(`/admin/coupons/${testCouponId}`, {
      discount_value: 85,
      description: 'Updated test coupon value'
    });
    const updatedVal = updateRes.data?.data?.coupon?.discountValue || updateRes.data?.data?.coupon?.discount_value;
    record('Coupons: UPDATE Coupon', Number(updatedVal) === 85, `Updated Value: ₹${updatedVal}`);

    // DELETE
    await client.delete(`/admin/coupons/${testCouponId}`);
    const afterDelete = await client.get('/admin/coupons');
    const stillExists = afterDelete.data?.data?.coupons?.some(c => c.id === testCouponId);
    record('Coupons: DELETE Coupon', !stillExists, 'Coupon successfully removed');
  } catch (err) {
    record('Coupons CRUD', false, err.response?.data?.message || err.message);
  }

  // --- 9. DELIVERY SLOTS CRUD ---
  let testSlotId = null;
  try {
    // CREATE
    const createRes = await client.post('/admin/delivery-slots', {
      type: 'tomorrow_morning',
      slot_name: 'Test Morning Express Slot',
      start_time: '08:00',
      end_time: '10:00',
      display_order: 5,
      is_active: true
    });
    testSlotId = createRes.data?.data?.slot?.id;
    record('Delivery Slots: CREATE Slot', !!testSlotId, `ID: ${testSlotId}`);

    // READ
    const listRes = await client.get('/admin/delivery-slots');
    const found = listRes.data?.data?.slots?.find(s => s.id === testSlotId);
    record('Delivery Slots: READ Slots List', !!found, `Found: ${found?.slot_name}`);

    // UPDATE
    const updateRes = await client.patch(`/admin/delivery-slots/${testSlotId}`, {
      slot_name: 'Test Premium Morning Slot',
      display_order: 6
    });
    const updatedName = updateRes.data?.data?.slot?.slotName || updateRes.data?.data?.slot?.slot_name;
    record('Delivery Slots: UPDATE Slot', updatedName === 'Test Premium Morning Slot', `Updated Name: ${updatedName}`);

    // DELETE
    await client.delete(`/admin/delivery-slots/${testSlotId}`);
    const afterDelete = await client.get('/admin/delivery-slots');
    const stillExists = afterDelete.data?.data?.slots?.some(s => s.id === testSlotId);
    record('Delivery Slots: DELETE Slot', !stillExists, 'Slot successfully removed');
  } catch (err) {
    record('Delivery Slots CRUD', false, err.response?.data?.message || err.message);
  }

  // --- 10. BANNERS CRUD ---
  let testBannerId = null;
  try {
    // CREATE
    const createRes = await client.post('/admin/banners', {
      title: 'Automated Test Promo Banner',
      image_url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80',
      link_url: '/category/test',
      placement: 'home_top',
      display_order: 10,
      is_active: true
    });
    testBannerId = createRes.data?.data?.banner?.id;
    record('Banners: CREATE Promotional Banner', !!testBannerId, `ID: ${testBannerId}`);

    // READ
    const listRes = await client.get('/admin/banners');
    const found = listRes.data?.data?.banners?.find(b => b.id === testBannerId);
    record('Banners: READ Banners List', !!found, `Found: ${found?.title}`);

    // UPDATE
    const updateRes = await client.patch(`/admin/banners/${testBannerId}`, {
      title: 'Updated Test Promo Banner',
      display_order: 12
    });
    const updatedTitle = updateRes.data?.data?.banner?.title;
    record('Banners: UPDATE Banner', updatedTitle === 'Updated Test Promo Banner', `Updated Title: ${updatedTitle}`);

    // DELETE
    await client.delete(`/admin/banners/${testBannerId}`);
    const afterDelete = await client.get('/admin/banners');
    const stillExists = afterDelete.data?.data?.banners?.some(b => b.id === testBannerId);
    record('Banners: DELETE Banner', !stillExists, 'Banner successfully removed');
  } catch (err) {
    record('Banners CRUD', false, err.response?.data?.message || err.message);
  }

  // --- 11. ORDERS WORKFLOW & STATUS TRANSITIONS ---
  try {
    const ordersRes = await client.get('/admin/orders');
    const allOrders = ordersRes.data?.data?.orders || [];
    const targetOrder = allOrders.find(o => o.status === 'placed') || allOrders[0];

    if (targetOrder) {
      record('Orders: READ Orders Feed', true, `Order #${targetOrder.order_number}, Status: ${targetOrder.status}, Total: ₹${targetOrder.total_amount}`);

      // Transition to 'confirmed'
      const confirmRes = await client.patch(`/admin/orders/${targetOrder.id}/status`, {
        status: 'confirmed'
      });
      record('Orders: STATUS placed -> confirmed', confirmRes.data?.data?.order?.status === 'confirmed', 'Status updated');

      // Transition to 'preparing'
      const prepareRes = await client.patch(`/admin/orders/${targetOrder.id}/status`, {
        status: 'preparing'
      });
      record('Orders: STATUS confirmed -> preparing', prepareRes.data?.data?.order?.status === 'preparing', 'Status updated');

      // Assign rider & transition to 'out_for_delivery'
      const dispatchRes = await client.patch(`/admin/orders/${targetOrder.id}/status`, {
        status: 'out_for_delivery',
        rider_id: testRiderUserId
      });
      const isDispatched = dispatchRes.data?.data?.order?.status === 'out_for_delivery';
      record('Orders: ASSIGN RIDER & out_for_delivery', isDispatched, `Assigned Rider: ${testRiderUserId}`);
    } else {
      record('Orders: Workflow', false, 'No test orders found in database');
    }
  } catch (err) {
    record('Orders Workflow', false, err.response?.data?.message || err.message);
  }

  // --- 12. PLATFORM CONFIG & APP RELEASES POLICIES ---
  try {
    // READ
    const configRes = await client.get('/admin/config');
    const initialConfig = configRes.data?.data?.settings || configRes.data?.data?.config;
    record('Config: READ Global Settings & Policies', !!initialConfig, `GST: ${initialConfig?.gst_rate}%, Min Order: ₹${initialConfig?.min_order_value}`);

    // UPDATE POLICIES & SETTINGS
    const testMessage = `Automated Verification Maintenance: ${new Date().toLocaleTimeString()}`;
    const updateRes = await client.patch('/admin/config', {
      gst_rate: 5,
      standard_delivery_fee: 55,
      maintenance_mode: {
        is_active: false,
        message: testMessage
      },
      app_version_customer_android: {
        min_supported_version: '1.0.0',
        latest_version: '1.2.5',
        force_update: false,
        update_url: 'https://play.google.com/store/apps/details?id=com.dailyfresh.customer',
        title: 'New Update Available',
        message: 'A new version of DailyFresh is available.'
      }
    });

    // VERIFY PERSISTENCE
    const verifyRes = await client.get('/admin/config');
    const updatedSettings = verifyRes.data?.data?.settings || verifyRes.data?.data?.config;
    const isMaintenancePersisted = updatedSettings?.maintenance_mode?.message === testMessage;
    const isVersionPersisted = updatedSettings?.app_version_customer_android?.latest_version === '1.2.5';
    record('Config: UPDATE App Releases & Policies', isMaintenancePersisted && isVersionPersisted, `Verified: latest_version=1.2.5, maintenance message synced`);
  } catch (err) {
    record('Config & Release Policies', false, err.response?.data?.message || err.message);
  }

  // --- CLEANUP TEST DATA ---
  try {
    if (testSubCategoryId) await client.delete(`/admin/sub-categories/${testSubCategoryId}`);
    if (testCategoryId) await client.delete(`/admin/categories/${testCategoryId}`);
    record('Cleanup: Remove Test SubCategory & Category', true, 'Cleaned up temporary entities');
  } catch (err) {
    record('Cleanup', false, err.message);
  }

  // --- SUMMARY ---
  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.filter(r => !r.passed).length;
  console.log('\n========================================');
  console.log(`🏁 TEST SUITE RESULT: ${passedCount}/${results.length} PASSED (${failedCount} FAILED)`);
  console.log('========================================\n');

  if (failedCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runCrudSuite().catch(err => {
  console.error('Fatal Test Suite Error:', err);
  process.exit(1);
});
