// src/components/Navbar.jsx
import React from 'react';
import { Navbar, Nav, Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import '../styles/Navbar.css';
import logo from '../assets/logo.png'; // Asegúrate de que la ruta sea correcta
import { useSelector, useDispatch } from 'react-redux';
import { logOut } from '../features/userSlice';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

const MyNavbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const token = useSelector((state) => state.user.token);
  const isAdmin = useSelector((state) => state.user.isAdmin);

  const handleLogout = () => {
    dispatch(logOut());
    Swal.fire({
      icon: 'success',
      title: 'Sesión cerrada',
      text: 'Has cerrado sesión correctamente.',
      confirmButtonText: 'Aceptar',
    });
    // Elimina el token del localStorage y redirige al login
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <Navbar className="navbar-custom" expand="lg">
      <Container>
        <Navbar.Brand as={Link} to="/">
          <img
            src={logo}
            alt="Freestyle Sports"
            className="d-inline-block align-top"
            style={{ height: '100px', width: 'auto' }}
          />
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav" className="justify-content-between">
          <Nav className="me-auto navbar-links">
            <Nav.Link as={Link} to="/">Inicio</Nav.Link>
            <Nav.Link as={Link} to="/products">Productos</Nav.Link>
            <Nav.Link as={Link} to="/cart">Carrito</Nav.Link>
          </Nav>
          <Nav>
            {token ? (
              <>
                {/* Botón Dashboard: si el usuario es admin, puedes redirigir a /admin/dashboard */}
                <Nav.Link as={Link} to={isAdmin ? "/admin/dashboard" : "/dashboard"}>
                  Dashboard
                </Nav.Link>
                <Nav.Link onClick={handleLogout}>Cerrar Sesión</Nav.Link>
              </>
            ) : (
              <Nav.Link as={Link} to="/login">Login</Nav.Link>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default MyNavbar;
