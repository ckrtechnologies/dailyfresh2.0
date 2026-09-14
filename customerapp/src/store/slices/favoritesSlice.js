import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import favoritesService from '../../api/favoritesService';

const matchesProduct = (item, targetId) => {
  if (!item || !targetId) return false;
  const targetStr = String(targetId);
  return (
    String(item.id) === targetStr ||
    String(item.productId) === targetStr ||
    String(item.product_id) === targetStr ||
    String(item.product?.id) === targetStr ||
    String(item.product?.productId) === targetStr
  );
};

export const fetchFavoritesAsync = createAsyncThunk(
  'favorites/fetchAsync',
  async (_, { rejectWithValue }) => {
    try {
      const response = await favoritesService.getFavorites();
      if (response.success) {
        return response.data;
      }
      return rejectWithValue(response.message);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const toggleFavoriteAsync = createAsyncThunk(
  'favorites/toggleAsync',
  async (product, { rejectWithValue }) => {
    try {
      const targetId = product.id || product.productId || product.product_id;
      const response = await favoritesService.toggleFavorite(targetId);
      if (response.success) {
        const isFav = response.data?.is_favorite !== undefined 
          ? Boolean(response.data.is_favorite) 
          : (response.data?.isFavorite !== undefined ? Boolean(response.data.isFavorite) : undefined);
        return { product, isFavorite: isFav };
      }
      return rejectWithValue(response.message);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  items: [],
  loading: false,
};

const favoritesSlice = createSlice({
  name: 'favorites',
  initialState,
  reducers: {
    toggleFavorite: (state, action) => {
      const product = action.payload;
      const targetId = product?.id || product?.productId || product?.product_id;
      if (!targetId) return;

      const existsIndex = state.items.findIndex(item => matchesProduct(item, targetId));
      if (existsIndex >= 0) {
        state.items.splice(existsIndex, 1);
      } else {
        state.items.push(product);
      }
    },
    setFavorites: (state, action) => {
      state.items = Array.isArray(action.payload) ? action.payload : [];
    },
    clearFavorites: (state) => {
      state.items = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFavoritesAsync.fulfilled, (state, action) => {
        state.items = Array.isArray(action.payload) ? action.payload : [];
        state.loading = false;
      })
      .addCase(fetchFavoritesAsync.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchFavoritesAsync.rejected, (state) => {
        state.loading = false;
      })
      .addCase(toggleFavoriteAsync.fulfilled, (state, action) => {
        const { product, isFavorite } = action.payload;
        const targetId = product?.id || product?.productId || product?.product_id;
        if (!targetId) return;

        if (isFavorite === true) {
          if (!state.items.some(item => matchesProduct(item, targetId))) {
            state.items.push(product);
          }
        } else if (isFavorite === false) {
          state.items = state.items.filter(item => !matchesProduct(item, targetId));
        }
      });
  }
});

export const { toggleFavorite, clearFavorites, setFavorites } = favoritesSlice.actions;
export default favoritesSlice.reducer;
