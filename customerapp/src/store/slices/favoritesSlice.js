import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import favoritesService from '../../api/favoritesService';

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
      const response = await favoritesService.toggleFavorite(product.id);
      if (response.success) {
        return { product, isFavorite: response.data?.isFavorite };
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
      const exists = state.items.find(item => item.id === product.id);
      if (exists) {
        state.items = state.items.filter(item => item.id !== product.id);
      } else {
        state.items.push(product);
      }
    },
    setFavorites: (state, action) => {
      state.items = action.payload;
    },
    clearFavorites: (state) => {
      state.items = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFavoritesAsync.fulfilled, (state, action) => {
        state.items = action.payload;
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
        if (isFavorite) {
          if (!state.items.find(item => item.id === product.id)) {
            state.items.push(product);
          }
        } else {
          state.items = state.items.filter(item => item.id !== product.id);
        }
      });
  }
});

export const { toggleFavorite, clearFavorites, setFavorites } = favoritesSlice.actions;
export default favoritesSlice.reducer;
