// src/pages/NotFound.jsx
import React from 'react';
import { Container, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <Container className="text-center mt-5">
      <h1>404 - Página No Encontrada</h1>
      <p>La página que buscas no existe.</p>
      <Button variant="primary" onClick={() => navigate('/')}>
        Volver al Inicio
      </Button>
    </Container>
  );
};

export default NotFound;
