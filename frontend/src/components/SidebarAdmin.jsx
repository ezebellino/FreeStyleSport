// src/components/SidebarAdmin.jsx
import React from 'react';
import { Nav } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import '../styles/SidebarAdmin.css';

const SidebarAdmin = () => {
  return (
    <Nav className="flex-column sidebar-admin" style={{ backgroundColor: '#343a40', height: '100vh', padding: '20px', borderRadius: '0.5rem' }}>
      <Nav.Link as={Link} to="/dashboard/profile" className="text-center text-white">Perfil</Nav.Link>
      <Nav.Link as={Link} to="/dashboard/orders" className="text-center text-white">Historial de Compras</Nav.Link>
      <hr />
      {/* Rutas para Admin (asegúrate de que estas rutas sean las definidas en DashboardAdmin) */}
      <Nav.Link as={Link} to="/admin/dashboard/products/create" className="text-center text-white">Crear Producto</Nav.Link>
      <Nav.Link as={Link} to="/admin/dashboard/users" className="text-center text-white">Gestionar Usuarios</Nav.Link>
      <Nav.Link as={Link} to="/admin/dashboard/coupons" className="text-center text-white">Gestionar Cupones</Nav.Link>
      <Nav.Link as={Link} to="/admin/dashboard/orders" className="text-center text-white">Gestionar Pedidos</Nav.Link>
    </Nav>
  );
};

export default SidebarAdmin;
