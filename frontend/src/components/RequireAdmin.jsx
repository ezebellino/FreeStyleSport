// src/components/RequireAdmin.jsx
import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, Outlet } from 'react-router-dom';

const RequireAdmin = () => {
  const { isAdmin, token } = useSelector((state) => state.user);

  if (!token || !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  // Si es admin, renderiza las rutas anidadas.
  return <Outlet />;
};

export default RequireAdmin;
