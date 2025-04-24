// src/App.jsx
import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import DashboardUser from './pages/DashboardUser.jsx';
import DashboardAdmin from './pages/DashboardAdmin.jsx';
import Profile from './pages/Profile.jsx';
import PurchaseHistory from './pages/PurchaseHistory.jsx';
import Coupons from './pages/Coupons.jsx';
import ProductList from './pages/ProductList';
import ProductDetail from './pages/ProductDetail';
import ManageUsers from './pages/admin/ManageUsers';
import CreateProduct from './pages/admin/CreateProduct';
import RequireAdmin from './components/RequireAdmin';
import { useDispatch } from 'react-redux';
import { setCredentials } from './features/userSlice';
import axios from 'axios';
import Login from './pages/Login';
import RegistrationForm from './pages/RegistrationForm';
import Checkout from './pages/Checkout';
import NotFound from './pages/NotFound';

const App = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        axios.get('http://127.0.0.1:8000/users/me', {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((response) => {
            dispatch(
              setCredentials({
                token,
                isAdmin: response.data.is_admin,
                userData: response.data,
              })
            );
          })
          .catch((error) => {
            console.error('Error al rehidratar el usuario:', error);
            localStorage.removeItem('token');
          });
      }
    }
  }, [dispatch]);
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<RegistrationForm />} />
        <Route path="/products" element={<ProductList />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        {/* Dashboard de Usuario */}
        <Route path="/dashboard" element={<DashboardUser />}>
          <Route path="profile" element={<Profile />} />
          <Route path="history" element={<PurchaseHistory />} />
          <Route path="coupons" element={<Coupons />} />
        </Route>
        {/* Dashboard de admin con rutas anidadas protegidas */}
        <Route element={<RequireAdmin />}>
          <Route path="/admin/dashboard" element={<DashboardAdmin />}>
            <Route path="products/create" element={<CreateProduct />} />
            <Route path="users" element={<ManageUsers />} />
            {/* Otras rutas de admin */}
          </Route>
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

export default App;
