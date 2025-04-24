// src/pages/DashboardAdmin.jsx
import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Outlet } from 'react-router-dom';
import SidebarAdmin from '../components/SidebarAdmin';

const DashboardAdmin = () => {
  return (
    <Container fluid>
      <Row>
        {/* Sidebar: ocupa una columna en pantallas medianas y grandes */}
        <Col xs={12} md={3} className="p-0">
          <SidebarAdmin />
        </Col>
        {/* Área de contenido: donde se cargarán las subrutas */}
        <Col xs={12} md={9} className="p-4">
          <Outlet />
        </Col>
      </Row>
    </Container>
  );
};

export default DashboardAdmin;
