import { configureStore } from '@reduxjs/toolkit';
import filterReducer from './slices/filterSlice';

export const store = configureStore({
  reducer: {
    filters: filterReducer
  },
  devTools: import.meta.env.DEV
});

export default store;
