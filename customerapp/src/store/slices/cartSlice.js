import { createSlice } from '@reduxjs/toolkit';

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: [],
    totalAmount: 0,
    totalCount: 0,
  },
  reducers: {
    addItem: (state, action) => {
      const product = action.payload.product || action.payload;
      const quantity = action.payload.quantity || 1;
      const cutPreference = action.payload.cutPreference || null;
      const cleaningPreference = action.payload.cleaningPreference || null;

      const existingItemIndex = state.items.findIndex(
        (item) => item.id === product.id && 
                  item.cutPreference === cutPreference && 
                  item.cleaningPreference === cleaningPreference
      );

      if (existingItemIndex > -1) {
        state.items[existingItemIndex].quantity += quantity;
      } else {
        state.items.push({
          ...product,
          quantity,
          cutPreference,
          cleaningPreference,
        });
      }

      state.totalCount += quantity;
      state.totalAmount += product.price * quantity;
    },
    removeItem: (state, action) => {
      const id = action.payload.id || action.payload;
      const itemIndex = state.items.findIndex((item) => item.id === id);

      if (itemIndex > -1) {
        const item = state.items[itemIndex];
        if (item.quantity > 1) {
          item.quantity -= 1;
          state.totalCount -= 1;
          state.totalAmount -= item.price;
        } else {
          state.totalCount -= 1;
          state.totalAmount -= item.price;
          state.items.splice(itemIndex, 1);
        }
      }
    },
    setCart: (state, action) => {
      state.items = action.payload.items;
      state.totalAmount = action.payload.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
      state.totalCount = action.payload.items.reduce((acc, item) => acc + item.quantity, 0);
    },
    clearCart: (state) => {
      state.items = [];
      state.totalAmount = 0;
      state.totalCount = 0;
    },
  },
});

export const { addItem, removeItem, clearCart, setCart } = cartSlice.actions;
export default cartSlice.reducer;
