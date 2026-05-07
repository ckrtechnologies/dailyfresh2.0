import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    alert: {
      visible: false,
      title: '',
      message: '',
      type: 'info', // info, success, error, warning
      buttons: [],
    },
  },
  reducers: {
    showAlert: (state, action) => {
      state.alert = {
        visible: true,
        title: action.payload.title || '',
        message: action.payload.message || '',
        type: action.payload.type || 'info',
        buttons: action.payload.buttons || [{ text: 'OK' }],
      };
    },
    hideAlert: (state) => {
      state.alert.visible = false;
    },
  },
});

export const { showAlert, hideAlert } = uiSlice.actions;
export default uiSlice.reducer;
