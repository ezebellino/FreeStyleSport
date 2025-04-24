// src/components/Categories.jsx
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCategories } from '../features/categoriesSlice';
import { ListGroup, Spinner, Alert } from 'react-bootstrap';

const Categories = () => {
  const dispatch = useDispatch();
  const { categories, status, error } = useSelector(state => state.categories);

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchCategories());
    }
  }, [status, dispatch]);

  if (status === 'loading') return <Spinner animation="border" />;
  if (status === 'failed') return <Alert variant="danger">{error}</Alert>;

  return (
    <ListGroup>
      {categories.map(category => (
        <ListGroup.Item key={category.id}>
          {category.name}
        </ListGroup.Item>
      ))}
    </ListGroup>
  );
};

export default Categories;
