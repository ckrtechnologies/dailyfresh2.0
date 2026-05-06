import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  startDate: new Date().toISOString().split('T')[0], // Default to today
  endDate: new Date().toISOString().split('T')[0],
  label: 'Today',
};

const dateRangeSlice = createSlice({
  name: 'dateRange',
  initialState,
  reducers: {
    setDateRange: (state, action) => {
      state.startDate = action.payload.startDate;
      state.endDate = action.payload.endDate;
      state.label = action.payload.label;
    },
    resetDateRange: (state) => {
      state.startDate = initialState.startDate;
      state.endDate = initialState.endDate;
      state.label = initialState.label;
    },
  },
});

export const { setDateRange, resetDateRange } = dateRangeSlice.actions;
export default dateRangeSlice.reducer;
