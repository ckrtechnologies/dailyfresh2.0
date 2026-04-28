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
      state.coords = coords;
      state.isServiceable = isServiceable;
      state.storeId = storeId || null;
      state.storeName = storeName || null;

      if (pincode) storage.setItem('pincode', pincode);
      if (address) storage.setItem('address', address);
      if (storeId) storage.setItem('store_id', storeId);
      if (storeName) storage.setItem('store_name', storeName);
      if (coords) storage.setItem('coords', JSON.stringify(coords));
    },
    setSelectedAddress: (state, action) => {
      state.selectedAddress = action.payload;
      if (action.payload) {
        state.pincode = action.payload.pincode;
        state.address = action.payload.line1 + (action.payload.line2 ? `, ${action.payload.line2}` : '');
        state.coords = action.payload.latitude ? { lat: action.payload.latitude, lng: action.payload.longitude } : null;
        state.storeId = action.payload.store_id || null;
        state.isServiceable = true;
        
        storage.setItem('selected_address', JSON.stringify(action.payload));
        if (action.payload.pincode) storage.setItem('pincode', action.payload.pincode);
        if (state.address) storage.setItem('address', state.address);
        if (action.payload.store_id) storage.setItem('store_id', action.payload.store_id);
        if (state.coords) storage.setItem('coords', JSON.stringify(state.coords));
      } else {
        storage.removeItem('selected_address');
      }
    },
    clearLocation: (state) => {
      state.pincode = null;
      state.address = null;
      state.coords = null;
      state.isServiceable = false;
      state.storeId = null;
      storage.removeItem('pincode');
      storage.removeItem('address');
      storage.removeItem('store_id');
      storage.removeItem('coords');
    },
    hydrateLocation: (state, action) => {
      state.pincode = action.payload.pincode;
      state.address = action.payload.address;
      state.coords = action.payload.coords || null;
      state.storeId = action.payload.storeId || null;
      state.storeName = action.payload.storeName || null;
      state.isServiceable = !!action.payload.pincode;
      state.isHydrated = true;
    },
  },
});

export const { setLocation, setSelectedAddress, clearLocation, hydrateLocation } = locationSlice.actions;
export default locationSlice.reducer;
