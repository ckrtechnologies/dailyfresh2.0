import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  token: null,
  user: null,
  isAuthenticated: false,
  isLoading: true,
  stores: [],
  activeStoreId: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.isLoading = false;
    },
    setStores: (state, action) => {
      state.stores = action.payload;
      if (action.payload.length > 0 && !state.activeStoreId) {
        state.activeStoreId = action.payload[0].id;
      }
    },
    setActiveStoreId: (state, action) => {
      state.activeStoreId = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.stores = [];
      state.activeStoreId = null;
    },
    setAuthLoading: (state, action) => {
      state.isLoading = action.payload;
    },
  },
});

export const { setCredentials, logout, setAuthLoading, setStores, setActiveStoreId } = authSlice.actions;
export default authSlice.reducer;
