import axios from 'axios';

const API_URL = "http://127.0.0.1:8000";

export const loginUser = async (email, password) => {
  try {
    const params = new URLSearchParams();
    params.append('username', email);
    params.append('password', password);
    const response = await axios.post(`${API_URL}/auth/login`, params);
    console.log("Login response:", response.data); // Depuración
    return response.data.access_token;
  } catch (error) {
    console.error("Error in loginUser:", error);
    throw error;
  }
};
