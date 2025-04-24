import React, { useEffect, useState } from 'react';
import { Container, Card, Button, Row, Col } from 'react-bootstrap';
import axios from 'axios';

const Coupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    axios.get('http://127.0.0.1:8000/coupons/')
      .then((res) => setCoupons(res.data))
      .catch((err) => {
        console.error('Error fetching coupons:', err);
        setError('Error al cargar cupones.');
      });
  }, []);

  return (
    <Container className="mt-4">
      <h2>Cupones Disponibles</h2>
      {error && <p className="text-danger">{error}</p>}
      <Row>
        {coupons.map(coupon => (
          <Col key={coupon.id} md={4} className="mb-3">
            <Card>
              <Card.Body>
                <Card.Title>{coupon.code}</Card.Title>
                <Card.Text>
                  Descuento: {coupon.discount_percentage}%<br />
                  Expira: {new Date(coupon.expiration_date).toLocaleDateString()}
                </Card.Text>
                <Button variant="outline-primary">Aplicar Cupón</Button>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default Coupons;
