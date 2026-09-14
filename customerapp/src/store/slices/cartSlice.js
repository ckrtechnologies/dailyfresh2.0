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
        (item) => String(item.id) === String(product.id) && 
                  String(item.variant?.id || '') === String(variant?.id || '') &&
                  String(item.cutPreference || '') === String(cutPreference || '') && 
                  String(item.cleaningPreference || '') === String(cleaningPreference || '')
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
        (item) => String(item.id) === String(id) && 
                  String(item.variant?.id || '') === String(variantId || '') &&
                  String(item.cutPreference || '') === String(cutPref || '') &&
                  String(item.cleaningPreference || '') === String(cleaningPref || '')
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
    updateCartAfterValidation: (state, action) => {
      const { items } = action.payload;
      state.items = items;
      state.totalAmount = items.reduce((acc, item) => {
        const price = item.variant ? (item.variant.discount_price || item.variant.price) : (item.product?.discount_price || item.product?.price || item.price);
        return acc + (Number(price) * item.quantity);
      }, 0);
      state.totalCount = items.reduce((acc, item) => acc + item.quantity, 0);
    },
    setItemQuantity: (state, action) => {
      const { item, quantity } = action.payload;
      const id = typeof item === 'object' ? item.id : item;
      const variantId = typeof item === 'object' ? item.variant?.id : null;
      const cutPref = typeof item === 'object' ? item.cutPreference : null;
      const cleaningPref = typeof item === 'object' ? item.cleaningPreference : null;

      const itemIndex = state.items.findIndex(
        (i) => String(i.id) === String(id) && 
                  String(i.variant?.id || '') === String(variantId || '') &&
                  String(i.cutPreference || '') === String(cutPref || '') &&
                  String(i.cleaningPreference || '') === String(cleaningPref || '')
      );

      if (itemIndex > -1) {
        const existingItem = state.items[itemIndex];
        const newQty = Math.max(0, parseInt(quantity, 10) || 0);
        
        if (newQty === 0) {
          state.totalCount -= existingItem.quantity;
          state.totalAmount -= (existingItem.price * existingItem.quantity);
          state.items.splice(itemIndex, 1);
        } else {
          const diff = newQty - existingItem.quantity;
          existingItem.quantity = newQty;
          state.totalCount += diff;
          state.totalAmount += (existingItem.price * diff);
        }
      }
    },
  },
});

export const { addItem, removeItem, clearCart, setCart, updateCartAfterValidation, setItemQuantity } = cartSlice.actions;
export default cartSlice.reducer;
