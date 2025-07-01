// src/utils/axiosInstance.js
import axios from 'axios';

// 🔧 CORREGIDO: Cambiado de puerto 5001 a 5000
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de solicitud: agrega el token si existe
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('hospital_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔐 Token agregado a la request:', token.substring(0, 15) + '...');
    } else {
      console.warn('⚠️ No se encontró token en localStorage');
    }
    
    // 🐛 DEBUG: Log de la URL completa que se está llamando
    console.log('📡 Llamando a:', config.baseURL + config.url);
    
    return config;
  },
  (error) => {
    console.error('❌ Error en el interceptor de solicitud:', error);
    return Promise.reject(error);
  }
);

// Interceptor de respuesta: log de éxito o errores
api.interceptors.response.use(
  (response) => {
    console.log('✅ Respuesta exitosa:', response.status);
    return response;
  },
  (error) => {
    console.error('🚨 Error en respuesta:', {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      url: error.config?.url
    });
    return Promise.reject(error);
  }
);

export default api;