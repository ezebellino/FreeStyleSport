// src/pages/PurchaseHistory.jsx
import React, { useEffect, useState } from 'react';
import { Container, ListGroup } from 'react-bootstrap';
import axios from 'axios';

const PurchaseHistory = () => {
  const [purchases, setPurchases] = useState([]);

  useEffect(() => {
    // En un caso real, harías una petición al backend para obtener el historial de compras del usuario
    // Ejemplo: axios.get('http://127.0.0.1:8000/orders/history', { headers: { Authorization: `Bearer ${token}` } })
    // Simulamos datos:
    setPurchases([
      { id: 1, date: '2023-04-01', total: 1200.0 },
      { id: 2, date: '2023-03-25', total: 3500.0 },
      { id: 3, date: '2023-03-15', total: 980.0 },
    ]);
  }, []);

  return (
    <Container>
      <h2>Historial de Compras</h2>
      <ListGroup>
        {purchases.map(purchase => (
          <ListGroup.Item key={purchase.id}>
            Compra #{purchase.id} - Fecha: {purchase.date} - Total: ${purchase.total}
          </ListGroup.Item>
        ))}
      </ListGroup>
    </Container>
  );
};

export default PurchaseHistory;
