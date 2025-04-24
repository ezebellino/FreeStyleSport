// src/features/cartSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [], // Cada item podría tener { productId, quantity }
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addItem: (state, action) => {
      // action.payload debería ser { productId, quantity }
      const item = state.items.find(i => i.productId === action.payload.productId);
      if (item) {
        item.quantity += action.payload.quantity;
      } else {
        state.items.push(action.payload);
      }
    },
    removeItem: (state, action) => {
      // action.payload es el productId
      state.items = state.items.filter(i => i.productId !== action.payload);
    },
    clearCart: (state) => {
      state.items = [];
    },
  },
});

export const { addItem, removeItem, clearCart } = cartSlice.actions;
export default cartSlice.reducer;
