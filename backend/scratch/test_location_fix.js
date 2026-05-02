// Mocking dependencies for Node environment
const storageMock = {
  data: {},
  setItem: function(key, value) {
    // Simulate our storage.js behavior: stringify if it's an object
    this.data[key] = typeof value === 'string' ? value : JSON.stringify(value);
    console.log(`[STORAGE] SET ${key}:`, this.data[key]);
  },
  getItem: function(key) {
    const val = this.data[key];
    if (!val) return null;
    try { return JSON.parse(val); } catch { return val; }
  },
  removeItem: function(key) {
    delete this.data[key];
  }
};

// Simplified version of the slice logic for testing
const testSlice = {
  state: {
    pincode: null,
    address: null,
    coords: null,
    storeId: null,
    isServiceable: false,
    selectedAddress: null
  },
  
  // Logic from setLocation
  setLocation: function(payload) {
    const { pincode, address, coords, storeId } = payload;
    this.state.pincode = pincode;
    this.state.address = address;
    this.state.coords = coords;
    this.state.storeId = storeId;
    this.state.isServiceable = !!storeId;

    if (pincode) storageMock.setItem('pincode', pincode);
    if (coords) storageMock.setItem('coords', coords); // FIX APPLIED HERE: NO JSON.stringify
    if (storeId) storageMock.setItem('store_id', storeId);
  },

  // Logic from hydrateLocation
  hydrateLocation: function(payload) {
    this.state.pincode = payload.pincode;
    this.state.storeId = payload.storeId;
    this.state.isServiceable = !!payload.storeId; // FIX APPLIED HERE
  }
};

console.log('--- TEST 1: Serialization Check ---');
const mockCoords = { lat: 12.97, lng: 77.59 };
testSlice.setLocation({
  pincode: '560001',
  address: 'Test Area',
  coords: mockCoords,
  storeId: 'store-123'
});

const storedCoords = storageMock.data['coords'];
console.log('Stored Coords in AsyncStorage:', storedCoords);
if (storedCoords === JSON.stringify(mockCoords)) {
  console.log('✅ SUCCESS: Coords stored as clean JSON string.');
} else {
  console.log('❌ FAIL: Coords stored incorrectly:', storedCoords);
}

console.log('\n--- TEST 2: Serviceability Check ---');
testSlice.hydrateLocation({ pincode: '123456', storeId: null });
console.log('Hydrated with Pincode but NO StoreId. isServiceable:', testSlice.state.isServiceable);
if (testSlice.state.isServiceable === false) {
  console.log('✅ SUCCESS: Correctly marked as unserviceable.');
} else {
  console.log('❌ FAIL: Incorrectly marked as serviceable.');
}

testSlice.hydrateLocation({ pincode: '123456', storeId: 'valid-store' });
console.log('Hydrated with StoreId. isServiceable:', testSlice.state.isServiceable);
if (testSlice.state.isServiceable === true) {
  console.log('✅ SUCCESS: Correctly marked as serviceable.');
}

console.log('\n--- TEST 3: Deep Retrieval Check ---');
const retrievedCoords = storageMock.getItem('coords');
console.log('Retrieved Coords object:', retrievedCoords);
if (retrievedCoords.lat === 12.97) {
  console.log('✅ SUCCESS: Coords object properties accessible.');
} else {
  console.log('❌ FAIL: Coords properties missing.');
}
