import { createSlice } from '@reduxjs/toolkit';
import storage from '../../utils/storage';

const initialState = {
  selectedSlot: 'express', // default to express
};

const configSlice = createSlice({
  name: 'config',
  initialState,
  reducers: {
    setSelectedSlot: (state, action) => {
      state.selectedSlot = action.payload;
      storage.setItem('selected_slot', action.payload);
    },
    setDeliveryMode: (state, action) => {
      state.selectedSlot = action.payload;
      storage.setItem('selected_slot', action.payload);
    },
    hydrateConfig: (state, action) => {
      if (action.payload) {
        state.selectedSlot = action.payload;
      }
    },
    resetConfig: (state) => {
      state.selectedSlot = 'express';
      storage.removeItem('selected_slot');
    },
  },
});

export const { setSelectedSlot, setDeliveryMode, hydrateConfig, resetConfig } = configSlice.actions;
export default configSlice.reducer;
