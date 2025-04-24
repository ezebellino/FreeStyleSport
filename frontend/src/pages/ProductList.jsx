// src/pages/ProductList.jsx
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts } from '../features/productSlice';
import ProductCard from '../components/ProductCard';
import { Container, Row, Col, Alert, Spinner } from 'react-bootstrap';

const ProductList = () => {
  const dispatch = useDispatch();
  const { products, status, error } = useSelector((state) => state.products);

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchProducts());
    }
  }, [status, dispatch]);

  let content;
  if (status === 'loading') {
    content = <Spinner animation="border" />;
  } else if (status === 'failed') {
    content = <Alert variant="danger">{error}</Alert>;
  } else {
    content = (
      <Row>
        {products.map(product => (
          <Col key={product.id} md={4} sm={6} xs={12} className="mb-4">
            <ProductCard product={product} />
          </Col>
        ))}
      </Row>
    );
  }

  return (
    <Container className="mt-4">
      <h1 className="mb-4">Productos Deportivos</h1>
      {content}
    </Container>
  );
};

export default ProductList;
