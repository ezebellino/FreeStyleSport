// src/features/userSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  token: null,
  isAdmin: false,
  userData: {},  // Puedes incluir otros datos del usuario
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      state.token = action.payload.token;
      state.isAdmin = action.payload.isAdmin;
      state.userData = action.payload.userData;
    },
    logOut: (state) => {
      state.token = null;
      state.isAdmin = false;
      state.userData = {};
    },
  },
});

export const { setCredentials, logOut } = userSlice.actions;
export default userSlice.reducer;
