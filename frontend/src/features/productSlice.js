// src/features/productSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = "http://127.0.0.1:8000";

export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async () => {
    const response = await axios.get(`${API_URL}/products/`);
    return response.data;
  }
);

// Thunk para crear un producto, incluyendo el token en los headers
export const createProduct = createAsyncThunk(
  'products/createProduct',
  async (productData, { rejectWithValue }) => {
    try {
      // Obtener el token de localStorage (o de Redux si lo prefieres)
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/admin/products/sports/`,
        productData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      // Puedes retornar rejectWithValue para manejar errores en el componente
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const initialState = {
  products: [],
  status: 'idle', // idle, loading, succeeded, failed
  error: null,
};

const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // fetchProducts
      .addCase(fetchProducts.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.products = action.payload;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      // createProduct
      .addCase(createProduct.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(createProduct.fulfilled, (state, action) => {
        state.status = 'succeeded';
        // Agregamos el producto creado a la lista (opcional)
        state.products.push(action.payload);
      })
      .addCase(createProduct.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || action.error.message;
      });
  },
});

export default productSlice.reducer;
