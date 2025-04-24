// src/pages/RegistrationForm.jsx
import React, { useState } from 'react';
import { Container, Form, Button, Alert } from 'react-bootstrap';
import axios from 'axios';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const RegistrationForm = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({...formData, [e.target.name]: e.target.value});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Ajusta la URL según tu backend
      const response = await axios.post('http://127.0.0.1:8000/users/register', formData);
      console.log('Registro exitoso:', response.data);
      MySwal.fire({
        title: 'Registro Exitoso!',
        text: '¡Gracias por registrarte! Has recibido un cupón de descuento del 10% en tu próxima compra.',
        icon: 'success',
        confirmButtonText: 'Aceptar'
      });
    } catch (err) {
      console.error('Error en el registro:', err);
      setError('Error al registrar usuario.');
    }
  };

  return (
    <Container className="mt-4" style={{ maxWidth: '500px' }}>
      <h1 className="mb-4">Registrarse</h1>
      {error && <Alert variant="danger">{error}</Alert>}
      <Form onSubmit={handleSubmit}>
        <Form.Group controlId="formEmail" className="mb-3">
          <Form.Label>Email</Form.Label>
          <Form.Control 
            type="email" 
            name="email" 
            value={formData.email}
            onChange={handleChange}
            placeholder="Ingrese su email" 
            required 
          />
        </Form.Group>
        <Form.Group controlId="formPassword" className="mb-3">
          <Form.Label>Contraseña</Form.Label>
          <Form.Control 
            type="password" 
            name="password" 
            value={formData.password}
            onChange={handleChange}
            placeholder="Ingrese su contraseña" 
            required 
          />
        </Form.Group>
        <Button variant="primary" type="submit" className="w-100">
          Registrarse
        </Button>
      </Form>
    </Container>
  );
};

export default RegistrationForm;
