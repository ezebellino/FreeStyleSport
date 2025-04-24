// src/features/reviewSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000';

export const fetchReviews = createAsyncThunk(
  'reviews/fetchReviews',
  async (productId) => {
    const response = await axios.get(`${API_URL}/products/${productId}/reviews`);
    return response.data;
  }
);

export const postReview = createAsyncThunk(
  'reviews/postReview',
  async ({ productId, reviewData }) => {
    const response = await axios.post(`${API_URL}/products/${productId}/reviews`, reviewData);
    return response.data;
  }
);

const reviewSlice = createSlice({
  name: 'reviews',
  initialState: {
    reviews: [],
    status: 'idle',
    error: null,
  },
  reducers: {
    clearReviews: (state) => {
      state.reviews = [];
      state.status = 'idle';
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchReviews.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchReviews.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.reviews = action.payload;
      })
      .addCase(fetchReviews.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(postReview.fulfilled, (state, action) => {
        state.reviews.unshift(action.payload);
      });
  },
});

export const { clearReviews } = reviewSlice.actions;
export default reviewSlice.reducer;
