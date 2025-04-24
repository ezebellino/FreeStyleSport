// src/features/searchSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000';

export const performSearch = createAsyncThunk(
  'search/performSearch',
  async (query) => {
    const response = await axios.get(`${API_URL}/products/search`, {
      params: { q: query }
    });
    return response.data;
  }
);

const searchSlice = createSlice({
  name: 'search',
  initialState: {
    query: '',
    results: [],
    status: 'idle',
    error: null,
  },
  reducers: {
    setQuery: (state, action) => {
      state.query = action.payload;
    },
    clearResults: (state) => {
      state.results = [];
      state.status = 'idle';
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(performSearch.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(performSearch.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.results = action.payload;
      })
      .addCase(performSearch.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      });
  },
});

export const { setQuery, clearResults } = searchSlice.actions;
export default searchSlice.reducer;
