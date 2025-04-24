// src/components/Wishlist.jsx
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { removeFromWishlist } from '../features/wishlistSlice';
import { ListGroup, Button } from 'react-bootstrap';

const Wishlist = () => {
  const dispatch = useDispatch();
  const items = useSelector(state => state.wishlist.items);

  if (items.length === 0) return <p>No tienes productos en tu lista de deseos.</p>;

  return (
    <ListGroup>
      {items.map(item => (
        <ListGroup.Item key={item.productId}>
          Producto ID: {item.productId}
          <Button variant="danger" size="sm" onClick={() => dispatch(removeFromWishlist(item.productId))}>
            Quitar
          </Button>
        </ListGroup.Item>
      ))}
    </ListGroup>
  );
};

export default Wishlist;
