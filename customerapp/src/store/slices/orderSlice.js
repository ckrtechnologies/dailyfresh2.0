import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import orderService from '../../api/orderService';

export const fetchActiveOrder = createAsyncThunk(
  'order/fetchActive',
  async (_, { rejectWithValue }) => {
    try {
      const res = await orderService.getMyOrders(); // Get recent orders
      if (res.success && res.data.orders.length > 0) {
        // Find the first order that is NOT delivered or cancelled
        const active = res.data.orders.find(o => 
          !['delivered', 'cancelled'].includes(o.status)
        );
        return active || null;
      }
      return null;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const orderSlice = createSlice({
  name: 'order',
  initialState: {
    activeOrder: null,
    loading: false,
    error: null,
    hidden: false // User manually closed the mini tab
  },
  reducers: {
    setActiveOrder: (state, action) => {
      state.activeOrder = action.payload;
      state.hidden = false; // Reset hidden state when a new update comes
    },
    hideMiniStatus: (state) => {
      state.hidden = true;
    },
    updateOrderStatusLocal: (state, action) => {
      const { orderId, status } = action.payload;
      if (state.activeOrder && state.activeOrder.id === orderId) {
        state.activeOrder.status = status;
        if (['delivered', 'cancelled'].includes(status)) {
           // If it's a final state, we might want to keep it for a bit then hide?
           // For now, let's keep it so user sees "Delivered"
        }
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchActiveOrder.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchActiveOrder.fulfilled, (state, action) => {
        state.loading = false;
        // If the active order has changed, reset hidden to show it
        if (action.payload && (!state.activeOrder || state.activeOrder.id !== action.payload.id)) {
          state.hidden = false;
        }
        state.activeOrder = action.payload;
      })
      .addCase(fetchActiveOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { setActiveOrder, hideMiniStatus, updateOrderStatusLocal } = orderSlice.actions;
export default orderSlice.reducer;
