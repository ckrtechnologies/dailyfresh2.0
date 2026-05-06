import { createSlice } from '@reduxjs/toolkit';

const riderSlice = createSlice({
  name: 'rider',
  initialState: {
    user: null,
    token: null,
    isOnline: false,
    loading: false,
    error: null,
  },
  reducers: {
    setProfile: (state, action) => {
      if (action.payload) {
        state.user = action.payload.user || action.payload;
        state.token = action.payload.access_token || state.token;
        state.isOnline = state.user.is_online || false;
      } else {
        state.user = null;
        state.token = null;
        state.isOnline = false;
      }
    },
    setOnline: (state, action) => {
      state.isOnline = action.payload;
      if (state.user) {
        state.user.is_online = action.payload;
      }
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.isOnline = false;
      state.error = null;
    }
  }
});

export const { setProfile, setOnline, setLoading, setError, logout } = riderSlice.actions;
export default riderSlice.reducer;
