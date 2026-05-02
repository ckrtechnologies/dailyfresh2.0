import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  selectedSlot: 'express', // default to express
};

const configSlice = createSlice({
  name: 'config',
  initialState,
  reducers: {
    setSelectedSlot: (state, action) => {
      state.selectedSlot = action.payload;
    },
    setDeliveryMode: (state, action) => {
      state.selectedSlot = action.payload;
    },
    resetConfig: (state) => {
      state.selectedSlot = 'express';
    },
  },
});

export const { setSelectedSlot, setDeliveryMode, resetConfig } = configSlice.actions;
export default configSlice.reducer;
