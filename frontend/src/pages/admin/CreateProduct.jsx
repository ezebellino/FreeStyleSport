// src/admin/CreateProduct.jsx
import React, { useState } from 'react';
import { Container, Form, Button, Alert, Row, Col } from 'react-bootstrap';
import { useDispatch } from 'react-redux';
import { createProduct } from '../../features/productSlice';
import Swal from 'sweetalert2';
import ImageUploader from '../../components/ImageUploader'; // Asegúrate de que la ruta sea correcta

const CreateProduct = () => {
  const dispatch = useDispatch();
  const [productData, setProductData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    type: 'sports_product',  // Modificar a "sports_product" para que coincida con el schema
    size: '',
    color: '',
    brand: '',
    model: '',
    image_url: '',
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setProductData({
      ...productData,
      [e.target.name]: e.target.value,
    });
  };

  // Función para manejar la subida de imágenes
  const handleImageUpload = (url) => {
    setProductData((prev) => ({ ...prev, image_url: url }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const resultAction = await dispatch(createProduct(productData));
      if (createProduct.fulfilled.match(resultAction)) {
        Swal.fire({
          icon: 'success',
          title: 'Producto creado',
          text: 'El producto se ha creado exitosamente.',
          confirmButtonText: 'Aceptar',
        });
        // Limpia el formulario
        setProductData({
          name: '',
          description: '',
          price: '',
          stock: '',
          type: 'sports_product',
          size: '',
          color: '',
          brand: '',
          model: '',
          image_url: '',
        });
      } else {
        throw new Error('Error al crear el producto');
      }
    } catch (err) {
      console.error(err);
      setError('Error al crear el producto');
    }
  };

  return (
    <Container>
      <h2>Crear Producto</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      <Form onSubmit={handleSubmit}>
        <Row>
          <Col md={6}>
            <Form.Group className="mb-3" controlId="formProductName">
              <Form.Label>Nombre del Producto</Form.Label>
              <Form.Control
                type="text"
                placeholder="Ingrese el nombre"
                name="name"
                value={productData.name}
                onChange={handleChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="formProductDescription">
              <Form.Label>Descripción</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Ingrese la descripción"
                name="description"
                value={productData.description}
                onChange={handleChange}
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="formProductPrice">
              <Form.Label>Precio</Form.Label>
              <Form.Control
                type="number"
                placeholder="Ingrese el precio"
                name="price"
                value={productData.price}
                onChange={handleChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="formProductStock">
              <Form.Label>Stock</Form.Label>
              <Form.Control
                type="number"
                placeholder="Ingrese la cantidad en stock"
                name="stock"
                value={productData.stock}
                onChange={handleChange}
                required
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3" controlId="formProductSize">
              <Form.Label>Talla (Size)</Form.Label>
              <Form.Control
                type="text"
                placeholder="Ingrese la talla"
                name="size"
                value={productData.size}
                onChange={handleChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="formProductColor">
              <Form.Label>Color</Form.Label>
              <Form.Control
                type="text"
                placeholder="Ingrese el color (opcional)"
                name="color"
                value={productData.color}
                onChange={handleChange}
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="formProductBrand">
              <Form.Label>Marca</Form.Label>
              <Form.Control
                type="text"
                placeholder="Ingrese la marca (opcional)"
                name="brand"
                value={productData.brand}
                onChange={handleChange}
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="formProductModel">
              <Form.Label>Modelo</Form.Label>
              <Form.Control
                type="text"
                placeholder="Ingrese el modelo (opcional)"
                name="model"
                value={productData.model}
                onChange={handleChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Imagen del Producto</Form.Label>
              <ImageUploader onUpload={handleImageUpload} />
              {productData.image_url && (
                <img
                  src={productData.image_url}
                  alt="Preview del producto"
                  style={{ marginTop: '0.5rem', maxWidth: '100%', height: 'auto' }}
                />
              )}
            </Form.Group>
          </Col>
        </Row>
        {/* Campo fijo para type, solo de lectura */}
        <Form.Group className="mb-3" controlId="formProductType">
          <Form.Label>Tipo</Form.Label>
          <Form.Control
            type="text"
            placeholder="Tipo de producto"
            name="type"
            value={productData.type}
            readOnly
          />
        </Form.Group>
        <Button variant="primary" type="submit" className="w-100">
          Crear Producto
        </Button>
      </Form>
    </Container>
  );
};

export default CreateProduct;
