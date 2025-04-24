// src/features/ordersSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000';

export const fetchOrders = createAsyncThunk(
  'orders/fetchOrders',
  async () => {
    const response = await axios.get(`${API_URL}/orders/`);
    return response.data;
  }
);

const ordersSlice = createSlice({
  name: 'orders',
  initialState: {
    orders: [],
    status: 'idle',
    error: null,
  },
  reducers: {
    addOrder: (state, action) => {
      state.orders.push(action.payload);
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchOrders.pending, state => {
        state.status = 'loading';
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.orders = action.payload;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      });
  },
});

export const { addOrder } = ordersSlice.actions;
export default ordersSlice.reducer;
