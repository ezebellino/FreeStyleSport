import axios from 'axios';

const API_URL = "http://127.0.0.1:8000"; // Asegúrate de que este sea el URL correcto de tu backend

export const getProducts = async (skip = 0, limit = 10) => {
  try {
    const response = await axios.get(`${API_URL}/products/?skip=${skip}&limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching products:", error);
    throw error;
  }
};

export const getProductById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/products/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching product with id ${id}:`, error);
    throw error;
  }
};

// Puedes agregar más funciones para crear, actualizar o eliminar productos si es necesario
