// src/pages/Login.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import Swal from 'sweetalert2';
import { setCredentials } from '../features/userSlice';
import { Container, Form, Button, Alert } from 'react-bootstrap';

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [credentials, setCredentialsState] = useState({ username: '', password: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Ejemplo: redirigir si ya hay sesión activa
      const isAdmin = JSON.parse(localStorage.getItem('isAdmin') || "false");
      navigate(isAdmin ? '/admin/dashboard' : '/dashboard');
    }
  }, [navigate]);

  const handleChange = (e) => {
    setCredentialsState({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const params = new URLSearchParams();
      params.append('username', credentials.username);
      params.append('password', credentials.password);

      const response = await axios.post('http://127.0.0.1:8000/auth/login', params);
      console.log("Login response:", response.data);
      const { access_token, is_admin, user_data } = response.data;
      if (!access_token) throw new Error("No se recibió token");

      localStorage.setItem('token', access_token);
      localStorage.setItem('isAdmin', JSON.stringify(is_admin));

      // Este dispatch se realiza aquí, en Login.jsx, para actualizar el store
      dispatch(setCredentials({
        token: access_token,
        isAdmin: is_admin,
        userData: user_data || { email: credentials.username }
      }));

      Swal.fire({
        title: is_admin ? 'Bienvenido, Admin!' : 'Bienvenido!',
        text: 'Has iniciado sesión exitosamente.',
        icon: 'success',
      }).then(() => {
        navigate(is_admin ? '/admin/dashboard' : '/dashboard');
      });
    } catch (err) {
      console.error(err);
      Swal.fire({
        title: 'Error',
        text: 'Usuario o contraseña incorrectos',
        icon: 'error',
      });
      setError('Error al iniciar sesión');
    }
  };

  return (
    <Container className="mt-5" style={{ maxWidth: '500px' }}>
      <h2 className="mb-4 text-center">Iniciar Sesión</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Email</Form.Label>
          <Form.Control 
            type="email"
            name="username"
            placeholder="Ingrese su email"
            value={credentials.username}
            onChange={handleChange}
            required
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Contraseña</Form.Label>
          <Form.Control 
            type="password"
            name="password"
            placeholder="Ingrese su contraseña"
            value={credentials.password}
            onChange={handleChange}
            required
          />
        </Form.Group>
        <Button variant="primary" type="submit" className="w-100">
          Ingresar
        </Button>
      </Form>
      <div className="text-center mt-3">
        <p>
          ¿Aún no te has registrado?{" "}
          <Link to="/register">Haz click aquí para registrarte</Link>
        </p>
      </div>
    </Container>
  );
};

export default Login;
