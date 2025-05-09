import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Alert, Image } from 'react-bootstrap';
import axios from 'axios';
import ImageUploader from '../components/ImageUploader';
import img_avatar from '../assets/default-avatar.png';
import { useNavigate } from 'react-router-dom';

const ProfileEdit = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    first_name: '',
    last_name: '',
    address: '',
    email: '',
    avatar_url: '',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    axios.get('http://127.0.0.1:8000/users/me', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => {
        const data = res.data;
        setProfile({
          ...data,
          first_name: data.first_name,
          last_name: data.last_name,
        });
      })
      .catch(() => setError('Error al cargar el perfil'));
  }, []);

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put('http://127.0.0.1:8000/users/me', profile, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setProfile(response.data);
      setMessage('Perfil actualizado exitosamente.');
    } catch (err) {
      console.error(err);
      setError('Error al actualizar el perfil.');
    }
  };

  // Función que se llama cuando se sube la imagen y se obtiene la URL de Cloudinary
  const handleImageUpload = (url) => {
    setProfile((prev) => ({ ...prev, avatar_url: url }));
  };

  return (
    <Container className="mt-4">
      <h2>Perfil de Usuario</h2>
      {message && <Alert variant="success">{message}</Alert>}
      {error && <Alert variant="danger">{error}</Alert>}
      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Email</Form.Label>
          <Form.Control type="email" name="email" value={profile.email} readOnly />
        </Form.Group>
        {/* Sección para subir imagen de avatar */}
        <Form.Group className="mb-3">
          <Form.Label>Avatar</Form.Label>
          <ImageUploader onUpload={handleImageUpload} />
        </Form.Group>
        <div className="mb-3">
          <Image
            src={profile.avatar_url || img_avatar}
            rounded-circle
            style={{ maxWidth: '250px', maxHeight: '250px', borderRadius: '50%' }}
            width={150}
            alt="Avatar"
          />
        </div>
        <Form.Group className="mb-3">
          <Form.Label>Nombre</Form.Label>
          <Form.Control
            type="text"
            name="first_name"   // ANTES: "firstName"
            value={profile.first_name || ''}
            onChange={handleChange}
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Apellido</Form.Label>
          <Form.Control
            type="text"
            name="last_name"    // ANTES: "lastName"
            value={profile.last_name || ''}
            onChange={handleChange}
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Dirección</Form.Label>
          <Form.Control
            type="text"
            name="address"
            value={profile.address}
            onChange={handleChange}
          />
        </Form.Group>
        <Button variant="primary" type="submit" onClick={() => navigate('/dashboard/profile')}>
          Actualizar Perfil
        </Button>
      </Form>
    </Container>
  );
};

export default ProfileEdit;
