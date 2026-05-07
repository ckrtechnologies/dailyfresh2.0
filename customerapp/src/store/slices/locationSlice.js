import { createSlice } from '@reduxjs/toolkit';
import storage from '../../utils/storage';

const initialState = {
  pincode: null,
  address: null,
  coords: null, // { lat, lng }
  storeId: null, // nearest store assigned at location pick
  storeName: null,
  isServiceable: false,
  isHydrated: false,
  selectedAddress: null, // Full address object from DB
};

const locationSlice = createSlice({
  name: 'location',
  initialState,
  reducers: {
    setLocation: (state, action) => {
      const { pincode, address, coords, isServiceable, storeId, storeName } = action.payload;
      state.pincode = pincode;
      state.address = address;
      state.coords = coords || null; // Force null if not provided
      state.isServiceable = isServiceable;
      state.storeId = storeId || null;
      state.storeName = storeName || null;

      if (pincode) storage.setItem('pincode', pincode);
      if (address) storage.setItem('address', address);
      if (storeId) storage.setItem('store_id', storeId);
      if (storeName) storage.setItem('store_name', storeName);
      
      if (coords) {
        storage.setItem('coords', coords);
      } else {
        storage.removeItem('coords');
      }
    },
    setSelectedAddress: (state, action) => {
      state.selectedAddress = action.payload;
      if (action.payload) {
        state.pincode = action.payload.pincode;
        state.address = action.payload.line1 + (action.payload.line2 ? `, ${action.payload.line2}` : '');
        state.coords = action.payload.latitude ? { lat: action.payload.latitude, lng: action.payload.longitude } : null;
        state.storeId = action.payload.store_id || null;
        state.storeName = action.payload.store_name || null;
        state.isServiceable = !!action.payload.store_id;
        
        storage.setItem('selected_address', action.payload);
        if (action.payload.pincode) storage.setItem('pincode', action.payload.pincode);
        if (state.address) storage.setItem('address', state.address);
        if (action.payload.store_id) storage.setItem('store_id', action.payload.store_id);
        
        if (state.coords) {
          storage.setItem('coords', state.coords);
        } else {
          storage.removeItem('coords');
        }
      } else {
        storage.removeItem('selected_address');
        storage.removeItem('coords');
      }
    },
    clearLocation: (state) => {
      state.pincode = null;
      state.address = null;
      state.coords = null;
      state.isServiceable = false;
      state.storeId = null;
      state.storeName = null;
      state.selectedAddress = null;
      state.isHydrated = false;
      
      storage.removeItem('pincode');
      storage.removeItem('address');
      storage.removeItem('store_id');
      storage.removeItem('store_name');
      storage.removeItem('coords');
      storage.removeItem('selected_address');
    },
    hydrateLocation: (state, action) => {
      state.pincode = action.payload.pincode;
      state.address = action.payload.address;
      state.coords = action.payload.coords || null;
      state.storeId = action.payload.storeId || null;
      state.storeName = action.payload.storeName || null;
      state.selectedAddress = action.payload.selectedAddress || null;
      // It is only truly serviceable if we have an assigned storeId
      state.isServiceable = !!action.payload.storeId;
      state.isHydrated = true;
    },
    setServiceability: (state, action) => {
      state.isServiceable = action.payload.isServiceable;
      if (action.payload.storeId !== undefined) {
        state.storeId = action.payload.storeId;
      }
      if (action.payload.storeName !== undefined) {
        state.storeName = action.payload.storeName;
      }
      storage.setItem('store_id', state.storeId);
      storage.setItem('store_name', state.storeName);
    },
  },
});

export const { setLocation, setSelectedAddress, clearLocation, hydrateLocation, setServiceability } = locationSlice.actions;
export default locationSlice.reducer;
