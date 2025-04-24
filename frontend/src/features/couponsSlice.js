// src/features/couponsSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000';

export const fetchCoupons = createAsyncThunk(
  'coupons/fetchCoupons',
  async () => {
    const response = await axios.get(`${API_URL}/coupons/`);
    return response.data;
  }
);

const couponSlice = createSlice({
  name: 'coupons',
  initialState: {
    coupons: [],
    status: 'idle',
    error: null,
  },
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchCoupons.pending, state => {
        state.status = 'loading';
      })
      .addCase(fetchCoupons.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.coupons = action.payload;
      })
      .addCase(fetchCoupons.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      });
  },
});

export default couponSlice.reducer;
