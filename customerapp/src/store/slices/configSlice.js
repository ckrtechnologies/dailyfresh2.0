import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  selectedSlot: 'all', // 'all', 'morning', 'afternoon', 'express'
};

const configSlice = createSlice({
  name: 'config',
  initialState,
  reducers: {
    setSelectedSlot: (state, action) => {
      state.selectedSlot = action.payload;
    },
  },
});

export const { setSelectedSlot } = configSlice.actions;
export default configSlice.reducer;
