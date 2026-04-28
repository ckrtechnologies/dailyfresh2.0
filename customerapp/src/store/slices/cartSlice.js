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
      const payload = action.payload;
      
      // Determine if we are receiving a { product, ... } structure or a flattened item
      const product = payload.product || payload;
      const quantity = payload.quantity || 1;
      const variant = payload.variant || null;
      const cutPreference = payload.cutPreference || null;
      const cleaningPreference = payload.cleaningPreference || null;
      
      const existingItemIndex = state.items.findIndex(
        (item) => item.id === product.id && 
                  item.variant?.id === variant?.id &&
                  item.cutPreference === cutPreference && 
                  item.cleaningPreference === cleaningPreference
      );

      if (existingItemIndex > -1) {
        state.items[existingItemIndex].quantity += quantity;
      } else {
        // Store flattened but keep specific fields
        state.items.push({
          ...product,
          quantity,
          variant,
          cutPreference,
          cleaningPreference,
        });
      }

      state.totalCount += quantity;
      state.totalAmount += product.price * quantity;
    },
    removeItem: (state, action) => {
      const payload = action.payload;
      const id = typeof payload === 'object' ? payload.id : payload;
      const variantId = typeof payload === 'object' ? payload.variant?.id : null;
      const cutPref = typeof payload === 'object' ? payload.cutPreference : null;
      const cleaningPref = typeof payload === 'object' ? payload.cleaningPreference : null;

      const itemIndex = state.items.findIndex(
        (item) => item.id === id && 
                  item.variant?.id === variantId &&
                  item.cutPreference === cutPref &&
                  item.cleaningPreference === cleaningPref
      );

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
