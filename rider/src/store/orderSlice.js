import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  availableOrders: [],
  activeOrder: null,
  history: [],
  historyPagination: {
    total: 0,
    page: 1,
    pageSize: 20
  },
  totalEarnings: 0,
  loading: false,
};

const orderSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    setAvailableOrders: (state, action) => {
      state.availableOrders = action.payload;
    },
    setHistory: (state, action) => {
      state.history = action.payload.orders;
      state.historyPagination = action.payload.pagination;
    },
    addAvailableOrder: (state, action) => {
      state.availableOrders.unshift(action.payload);
    },
    removeAvailableOrder: (state, action) => {
      state.availableOrders = state.availableOrders.filter(o => o.id !== action.payload);
    },
    setActiveOrder: (state, action) => {
      state.activeOrder = action.payload;
    },
    updateActiveOrderStatus: (state, action) => {
      if (state.activeOrder) {
        state.activeOrder.status = action.payload;
      }
    },
    clearActiveOrder: (state) => {
      state.activeOrder = null;
    },
  },
});

export const { 
  setAvailableOrders, 
  setHistory,
  addAvailableOrder, 
  removeAvailableOrder, 
  setActiveOrder, 
  updateActiveOrderStatus,
  clearActiveOrder 
} = orderSlice.actions;

export default orderSlice.reducer;
