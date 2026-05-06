import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  storeId: null,
  dashboardStats: null,
  globalFilter: {
    dateRange: 'all',
    customRange: { 
      start: new Date().toISOString(), 
      end: new Date().toISOString() 
    }
  }
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setStoreId: (state, action) => {
      state.storeId = action.payload;
    },
    setDashboardStats: (state, action) => {
      state.dashboardStats = action.payload;
      state.storeId = action.payload.store_id;
    },
    setGlobalFilter: (state, action) => {
      state.globalFilter = {
        ...state.globalFilter,
        ...action.payload
      };
    },
  },
});

export const { setStoreId, setDashboardStats, setGlobalFilter } = appSlice.actions;
export default appSlice.reducer;
