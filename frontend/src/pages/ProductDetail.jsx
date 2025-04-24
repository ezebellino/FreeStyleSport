// src/pages/ProductDetail.jsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Card, Button } from 'react-bootstrap';
import axios from 'axios';

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    axios.get(`http://127.0.0.1:8000/products/${id}`)
      .then((response) => setProduct(response.data))
      .catch((err) => {
        console.error('Error fetching product:', err);
        setError('No se pudo cargar el producto.');
      });
  }, [id]);

  if (error) return <Container className="mt-4"><p>{error}</p></Container>;
  if (!product) return <Container className="mt-4"><p>Cargando...</p></Container>;

  return (
    <Container className="mt-4">
      <Card>
        <Card.Body>
          <Card.Title>{product.name}</Card.Title>
          <Card.Text>{product.description}</Card.Text>
          <Card.Text className="fw-bold">Precio: ${product.price}</Card.Text>
          <Card.Text>Stock: {product.stock}</Card.Text>
          <Card.Img variant="top" src={product.image_url} alt={product.name} className="mb-3" style={{ maxWidth: '300px' }} />
          {/* Puedes agregar botones para agregar al carrito */}
          <Button variant="success">Agregar al Carrito</Button>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ProductDetail;
