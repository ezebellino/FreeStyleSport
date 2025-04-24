// Crear pasarela de Productos
// src/components/ProductPasarel.jsx
import React from 'react';
import { Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import '../styles/ProductPasarel.css'; // Asegúrate de tener este archivo CSS para estilos adicionales
import { useSelector } from 'react-redux';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchProducts } from '../features/productSlice'; // Asegúrate de que la ruta sea correcta



const ProductPasarel = () => {
    const { products } = useSelector((state) => state.products); // Asegúrate de que el estado tenga la propiedad correcta
    const dispatch = useDispatch();
    const { type } = useParams(); // Obtén el tipo de producto desde la URL

    // Estado para almacenar los productos filtrados
    const [filteredProducts, setFilteredProducts] = useState([]);

    useEffect(() => {
        dispatch(fetchProducts()); // Llama a la acción para obtener productos al cargar el componente
    }, [dispatch]);

    useEffect(() => {
        if (products) {
            // Filtra los productos según el tipo
            const filtered = products.filter((product) => product.type === type);
            setFilteredProducts(filtered);
        }
    }, [products, type]);

    return (
        <div className="product-pasarel">
            <h2 className="pasarel-title">Productos {type}</h2>
            <div className="product-grid">
                {filteredProducts.map((product) => (
                    <Card key={product.id} className="product-card">
                        <Card.Img variant="top" src={product.image_url} alt={product.name} />
                        <Card.Body>
                            <Card.Title>{product.name}</Card.Title>
                            <Card.Text>{product.description}</Card.Text>
                            <Card.Text>Precio: ${product.price}</Card.Text>
                            <Link to={`/products/${product.id}`}>
                                <Button variant="primary">Ver Detalles</Button>
                            </Link>
                        </Card.Body>
                    </Card>
                ))}
            </div>
        </div>
    );
}


export default ProductPasarel;