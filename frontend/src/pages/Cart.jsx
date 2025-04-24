// src/pages/Cart.jsx
import React, { useEffect, useState } from 'react';
import { Container, ListGroup, Alert } from 'react-bootstrap';
import axios from 'axios';

const Cart = () => {
  const [cart, setCart] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    axios.get('http://127.0.0.1:8000/cart/', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(response => setCart(response.data))
      .catch(err => {
        console.error('Error fetching cart:', err);
        setError('No se pudo cargar el carrito.');
      });
  }, []);

  if (error) return <Container className="mt-4"><Alert variant="danger">{error}</Alert></Container>;
  if (!cart) return <Container className="mt-4"><p>Cargando carrito...</p></Container>;

  return (
    <Container className="mt-4 mb-4">
      <h1 className='mt-4 mb-4' style={
        { fontSize: '2.5rem', textAlign: 'center', color: '#333' }
      }>Tu Carrito</h1>
      {cart.items.length === 0 ? (
        <p>No hay productos en tu carrito.</p>
      ) : (
        <ListGroup>
          {cart.items.map(item => (
            <ListGroup.Item key={item.id}>
              Producto ID: {item.product_id} - Cantidad: {item.quantity}
            </ListGroup.Item>
          ))}
        </ListGroup>
      )}
    </Container>
  );
};

export default Cart;
