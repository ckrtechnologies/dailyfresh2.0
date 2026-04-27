import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import locationReducer from './slices/locationSlice';
import productReducer from './slices/productSlice';
import cartReducer from './slices/cartSlice';
import favoritesReducer from './slices/favoritesSlice';
import orderReducer from './slices/orderSlice';

import configReducer from './slices/configSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    location: locationReducer,
    products: productReducer,
    cart: cartReducer,
    favorites: favoritesReducer,
    order: orderReducer,
    config: configReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});
