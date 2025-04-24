// src/components/SearchBar.jsx
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setQuery, performSearch, clearResults } from '../features/searchSlice';
import { Form, Button, InputGroup, Spinner, ListGroup } from 'react-bootstrap';

const SearchBar = () => {
  const dispatch = useDispatch();
  const [localQuery, setLocalQuery] = useState('');
  const { results, status } = useSelector(state => state.search);

  const handleSearch = () => {
    if (localQuery.trim() === '') {
      dispatch(clearResults());
    } else {
      dispatch(setQuery(localQuery));
      dispatch(performSearch(localQuery));
    }
  };

  return (
    <div>
      <InputGroup className="mb-3">
        <Form.Control
          placeholder="Buscar productos..."
          value={localQuery}
          onChange={e => setLocalQuery(e.target.value)}
        />
        <Button onClick={handleSearch}>Buscar</Button>
      </InputGroup>
      {status === 'loading' && <Spinner animation="border" size="sm" />}
      {results.length > 0 && (
        <ListGroup>
          {results.map(product => (
            <ListGroup.Item key={product.id}>
              {product.name}
            </ListGroup.Item>
          ))}
        </ListGroup>
      )}
    </div>
  );
};

export default SearchBar;
