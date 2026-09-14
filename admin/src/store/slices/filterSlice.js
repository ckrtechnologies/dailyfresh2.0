import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  globalStoreId: '',
  searchQuery: '',
  preset: 'all',
  dateRange: {
    startDate: '', // YYYY-MM-DD
    endDate: ''
  }
};

const filterSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    setGlobalStoreId: (state, action) => {
      state.globalStoreId = action.payload || '';
    },
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload || '';
    },
    setPreset: (state, action) => {
      state.preset = action.payload || 'all';
    },
    setDateRange: (state, action) => {
      if (typeof action.payload === 'function') {
        state.dateRange = action.payload(state.dateRange);
      } else {
        state.dateRange = {
          startDate: action.payload?.startDate || '',
          endDate: action.payload?.endDate || ''
        };
      }
    },
    clearFilters: (state) => {
      state.globalStoreId = '';
      state.searchQuery = '';
      state.preset = 'all';
      state.dateRange = { startDate: '', endDate: '' };
    }
  }
});

export const {
  setGlobalStoreId,
  setSearchQuery,
  setPreset,
  setDateRange,
  clearFilters
} = filterSlice.actions;

// Selectors
export const selectGlobalStoreId = (state) => state.filters.globalStoreId;
export const selectSearchQuery = (state) => state.filters.searchQuery;
export const selectDateRange = (state) => state.filters.dateRange;
export const selectPreset = (state) => state.filters.preset;
export const selectAllFilters = (state) => state.filters;

export default filterSlice.reducer;
