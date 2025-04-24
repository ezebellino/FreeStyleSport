// src/pages/Home.jsx
import React from 'react';
import { Container, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import '../styles/Home.css';
import ProductPasarel from '../components/ProductPasarel.jsx';


const Home = () => {
  return (
    <div className="home-hero">
      <Container className="home-content">
        <h1 className="home-title">Bienvenidos a FreeStyle Sports</h1>
        <p className="home-subtitle">
          Descubre la mejor indumentaria deportiva y mejora tu rendimiento. Regístrate para recibir ofertas exclusivas y descuentos especiales.
        </p>
        <div className="home-main-actions">
          <Link to="/products">
            <Button variant="outline-light" size="lg">Ver Productos</Button>
          </Link>
        </div>
        <div section className="action">
          <p>Productos Destacados!</p>
          <ProductPasarel />
        </div>
        <div className="home-secondary-actions">
          <div className="action">
            <p>¿No tienes cuenta?</p>
            <Link to="/register">
              <Button variant="outline-light" size="sm">Regístrate</Button>
            </Link>
          </div>
          <div className="action">
            <p>¿Ya tienes cuenta?</p>
            <Link to="/login">
              <Button variant="outline-light" size="sm">Inicia Sesión</Button>
            </Link>
          </div>
          <div className="action">
            <p>¿Olvidaste tu contraseña?</p>
            <Link to="/reset-password">
              <Button variant="outline-light" size="sm">Recuperar Contraseña</Button>
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default Home;
