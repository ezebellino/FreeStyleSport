import { configureStore } from '@reduxjs/toolkit';
import { combineReducers } from 'redux';
import storage from 'redux-persist/lib/storage'; // defaults to localStorage for web
import { persistStore, persistReducer } from 'redux-persist';
import userReducer from '../features/userSlice.js';
import productsReducer from '../features/productSlice.js';
import cartReducer from '../features/cartSlice.js';
import ordersReducer from '../features/ordersSlice.js';
import couponsReducer from '../features/couponsSlice.js';
import reviewsReducer from '../features/reviewsSlice.js';
import categoriesReducer from '../features/categoriesSlice.js';
import notificationsReducer from '../features/notificationsSlice.js';
import wishlistReducer from '../features/wishlistSlice.js';
import searchReducer from '../features/searchSlice.js';
import paymentReducer from '../features/paymentSlice.js';


const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['user'], // solo persistimos el slice de usuario, por ejemplo
};

const rootReducer = combineReducers({
  user: userReducer,
  products: productsReducer,
  cart: cartReducer,
  orders: ordersReducer,
  coupons: couponsReducer,
  reviews: reviewsReducer,
  categories: categoriesReducer,
  notifications: notificationsReducer,
  wishlist: wishlistReducer,
  search: searchReducer,
  payment: paymentReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
}); 

export const persistor = persistStore(store);