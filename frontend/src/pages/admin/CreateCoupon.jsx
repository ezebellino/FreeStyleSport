import React from 'react';
import { Container, Form, Button } from 'react-bootstrap';

const CreateCoupon = () => {
  // Aquí iría el formulario para crear un cupón
  return (
    <Container>
      <h2>Crear Cupón</h2>
      <Form>
        <Form.Group className="mb-3" controlId="formCouponCode">
          <Form.Label>Código del Cupón</Form.Label>
          <Form.Control type="text" placeholder="Ingrese el código" />
        </Form.Group>
        <Form.Group className="mb-3" controlId="formDiscount">
          <Form.Label>Descuento (%)</Form.Label>
          <Form.Control type="number" placeholder="Ingrese el porcentaje de descuento" />
        </Form.Group>
        <Form.Group className="mb-3" controlId="formExpiration">
          <Form.Label>Fecha de Expiración</Form.Label>
          <Form.Control type="date" />
        </Form.Group>
        <Button variant="primary" type="submit">
          Crear Cupón
        </Button>
      </Form>
    </Container>
  );
};

export default CreateCoupon;
