// src/pages/ProfileView.jsx
import React, { useEffect, useState } from 'react';
import { Container, Card, Button, Alert, Row, Col, Image } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import img_avatar from '../assets/default-avatar.png';

const ProfileView = () => {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('http://127.0.0.1:8000/users/me', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
    .then(res => setProfile(res.data))
    .catch(() => setError('Error al cargar el perfil'));
  }, []);

  if (error) return <Alert variant="danger">{error}</Alert>;
  if (!profile) return <p>Cargando...</p>;

  return (
    <Container className="mt-5 d-flex justify-content-center">
      <Card style={{ width: '100%', maxWidth: '600px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <Card.Body>
          <Row>
            <Col xs={12} md={4} className="text-center mb-3 mb-md-0">
              <Image 
                src={profile.avatar_url || img_avatar}
                roundedCircle 
                style={{ width: '120px', height: '120px', objectFit: 'cover' }}
              />
            </Col>
            <Col xs={12} md={8}>
              <h4 className="mb-3">Información del Usuario</h4>
              <p><strong>Nombre:</strong> {profile.first_name || 'No especificado'}</p>
              <p><strong>Apellido:</strong> {profile.last_name || 'No especificado'}</p>
              <p><strong>Dirección:</strong> {profile.address || 'No especificado'}</p>
              <p><strong>Email:</strong> {profile.email}</p>
              <div className="text-end">
                <Button variant="outline-primary" onClick={() => navigate('/dashboard/profile/edit')}>
                  Actualizar información
                </Button>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ProfileView;
