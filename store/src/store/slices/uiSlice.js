import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  alert: {
    visible: false,
    title: '',
    message: '',
    type: 'info', // 'success' | 'error' | 'warning' | 'info'
    buttons: [],
  },
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    showAlert: (state, action) => {
      state.alert = {
        visible: true,
        title: action.payload.title || '',
        message: action.payload.message || '',
        type: action.payload.type || 'info',
        buttons: action.payload.buttons || [],
      };
    },
    hideAlert: (state) => {
      state.alert.visible = false;
    },
  },
});

export const { showAlert, hideAlert } = uiSlice.actions;
export default uiSlice.reducer;
