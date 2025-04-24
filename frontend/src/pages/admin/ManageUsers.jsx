// src/pages/ManageUsers.jsx
import React, { useEffect, useState } from 'react';
import { Container, Table, Spinner, Alert } from 'react-bootstrap';
import axios from 'axios';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [status, setStatus] = useState('idle'); // idle, loading, succeeded, failed
  const [error, setError] = useState(null);

  useEffect(() => {
    setStatus('loading');
    axios.get('http://127.0.0.1:8000/users/all_users', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
      .then(response => {
        setUsers(response.data);
        setStatus('succeeded');
      })
      .catch(err => {
        setError(err.message);
        setStatus('failed');
      });
  }, []);

  if (status === 'loading') return <Spinner animation="border" />;
  if (status === 'failed') return <Alert variant="danger">Error: {error}</Alert>;

  return (
    <Container>
      <h2>Gestión de Usuarios</h2>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>ID</th>
            <th>Email</th>
            <th>Rol</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td>{user.id}</td>
              <td>{user.email}</td>
              <td>{user.is_admin ? 'Admin' : 'Usuario'}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Container>
  );
};

export default ManageUsers;
