import React, { useState } from 'react';
import { Container, Form, Button, Alert } from 'react-bootstrap';
import axios from 'axios';

const Checkout = () => {
  const [couponCode, setCouponCode] = useState('');
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');

  const handleCheckout = async (e) => {
    e.preventDefault();
    try {
      // Envía la solicitud de checkout incluyendo el cupón (si se ingresa)
      const response = await axios.post('http://127.0.0.1:8000/cart/checkout', null, {
        params: { coupon_code: couponCode },
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setOrder(response.data);
    } catch (err) {
      console.error('Error in checkout:', err);
      setError('Error en el checkout');
    }
  };

  return (
    <Container className="mt-4">
      <h1>Checkout</h1>
      {error && <Alert variant="danger">{error}</Alert>}
      <Form onSubmit={handleCheckout}>
        <Form.Group className="mb-3">
          <Form.Label>Cupón de Descuento (opcional)</Form.Label>
          <Form.Control 
            type="text" 
            placeholder="Ingresa tu cupón" 
            value={couponCode} 
            onChange={(e) => setCouponCode(e.target.value)}
          />
        </Form.Group>
        <Button variant="primary" type="submit">Realizar Compra</Button>
      </Form>
      {order && (
        <Alert variant="success" className="mt-3">
          Compra realizada con éxito. Total: ${order.total}
        </Alert>
      )}
    </Container>
  );
};

export default Checkout;
