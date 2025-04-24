// src/pages/DashboardUser.jsx
import React from 'react';
import { Container, Nav } from 'react-bootstrap';
import { Outlet, NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';

const DashboardUser = () => {
    const user = useSelector((state) => state.user);

    return (
        <Container className="mt-4" >

            <h1>Dashboard de Usuario </h1>
            <h2>Hola, {user.name}</h2>
            <p>Email: {user.userData.email}</p>
            <p>Rol: {user.isAdmin ? 'Admin' : 'Usuario'}</p>


            < Nav variant="tabs" className="mb-4" >
                <Nav.Item>
                    <Nav.Link as={NavLink} to="profile" > Perfil </Nav.Link>
                </Nav.Item>
                < Nav.Item >
                    <Nav.Link as={NavLink} to="history" > Historial </Nav.Link>
                </Nav.Item>
                < Nav.Item >
                    <Nav.Link as={NavLink} to="coupons" > Cupones </Nav.Link>
                </Nav.Item>
            </Nav>
            < Outlet />
        </Container>
    );
};

export default DashboardUser;
