// src/components/ProductCard.jsx
import React, { useState } from 'react';
import '../styles/ProductCard.css';

const ProductCard = ({ product }) => {
  const [flipped, setFlipped] = useState(false);

  const handleCardClick = () => {
    setFlipped(prev => !prev);
  };

  return (
    <div className="flip-card" onClick={handleCardClick}>
      <div className={`flip-card-inner ${flipped ? 'flipped' : ''}`}>
        {/* Cara frontal */}
        <div
          className="flip-card-front"
          style={{ backgroundImage: `url(${product.image_url})` }}>
          <div className="front-overlay">
            <h3 className="product-name">{product.name}</h3>
          </div>
        </div>
        {/* Cara trasera con overlay para la descripción */}
        <div
          className="flip-card-back"
          style={{ backgroundImage: `url(${product.image_url})` }}>
          <div className="back-overlay">
            <p className="product-description">{product.description}</p>
          </div>
        </div>
      </div>
      {/* Footer fuera del contenedor rotativo */}
      <div className="flip-card-footer">
        <p>Precio: ${product.price}</p>
        <p>Stock: {product.stock}</p>
        <button className="btn btn-primary">Agregar al carrito</button>
      </div>
    </div>
  );
};

export default ProductCard;
