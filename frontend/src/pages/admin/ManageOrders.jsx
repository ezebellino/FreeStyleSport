// src/pages/ManageOrders.jsx
import React, { useEffect, useState } from 'react';
import { Container, Table, Spinner, Alert } from 'react-bootstrap';
import axios from 'axios';

const ManageOrders = () => {
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState('idle'); // idle, loading, succeeded, failed
  const [error, setError] = useState(null);

  useEffect(() => {
    setStatus('loading');
    axios.get('http://127.0.0.1:8000/admin/orders/', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
      .then(response => {
        setOrders(response.data);
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
      <h2>Gestión de Órdenes</h2>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>ID Orden</th>
            <th>Usuario</th>
            <th>Total</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(order => (
            <tr key={order.id}>
              <td>{order.id}</td>
              <td>{order.user}</td>
              <td>${order.total}</td>
              <td>{order.status}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Container>
  );
};

export default ManageOrders;
