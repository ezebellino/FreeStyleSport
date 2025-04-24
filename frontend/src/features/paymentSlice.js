// src/features/paymentSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000';

export const processPayment = createAsyncThunk(
  'payment/processPayment',
  async (paymentData) => {
    // paymentData puede incluir orderId, detalles de pago, etc.
    const response = await axios.post(`${API_URL}/payments/process`, paymentData);
    return response.data;
  }
);

const paymentSlice = createSlice({
  name: 'payment',
  initialState: {
    status: 'idle',
    result: null,
    error: null,
  },
  reducers: {
    resetPayment: (state) => {
      state.status = 'idle';
      state.result = null;
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(processPayment.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(processPayment.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.result = action.payload;
      })
      .addCase(processPayment.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      });
  },
});

export const { resetPayment } = paymentSlice.actions;
export default paymentSlice.reducer;
