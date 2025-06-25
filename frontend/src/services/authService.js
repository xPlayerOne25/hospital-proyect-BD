import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para requests - agregar token automáticamente
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('hospital_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔐 Token agregado a request:', token.substring(0, 20) + '...');
    } else {
      console.warn('⚠️ No hay token en localStorage para:', config.url);
    }
    return config;
  },
  (error) => {
    console.error('❌ Error en request interceptor:', error);
    return Promise.reject(error);
  }
);

// Interceptor para responses - manejo mejorado de errores
api.interceptors.response.use(
  (response) => {
    console.log('✅ Response exitosa para:', response.config.url);
    // Devolver solo los datos relevantes
    return response.data;
  },
  (error) => {
    console.error('🚨 Error en response interceptor:', error);
    
    const { response, config } = error;
    
    // Solo limpiar sesión en casos específicos
    if (response?.status === 401) {
      console.log('🔍 Error 401 detectado en:', config?.url);
      
      // Solo redirigir si es un error de autenticación real (no de rutas específicas)
      const isAuthError = 
        config?.url?.includes('/auth/') || 
        response?.data?.message?.includes('Token') ||
        response?.data?.message?.includes('inválido') ||
        response?.data?.message?.includes('expirado');
      
      if (isAuthError) {
        console.log('🔒 Limpiando sesión por error de autenticación');
        localStorage.removeItem('hospital_token');
        localStorage.removeItem('hospital_user');
        
        // Solo redirigir si no estamos ya en login
        if (!window.location.pathname.includes('/login')) {
          setTimeout(() => {
            window.location.href = '/login';
          }, 1000); // Dar tiempo para mostrar el error
        }
      }
    }
    
    // Para errores de red, mantener la sesión
    if (!response) {
      console.error('🌐 Error de red - manteniendo sesión');
    }
    
    return Promise.reject(error);
  }
);

// Función para verificar si hay una sesión válida
const hasValidSession = () => {
  const token = localStorage.getItem('hospital_token');
  const user = localStorage.getItem('hospital_user');
  
  if (!token || !user) {
    return false;
  }
  
  try {
    // Verificar si el token no ha expirado (básico)
    const tokenData = JSON.parse(atob(token.split('.')[1]));
    const now = Date.now() / 1000;
    
    if (tokenData.exp < now) {
      console.log('🕐 Token expirado');
      localStorage.removeItem('hospital_token');
      localStorage.removeItem('hospital_user');
      return false;
    }
    
    return true;
  } catch (e) {
    console.error('❌ Error validando token:', e);
    return false;
  }
};

// Función para renovar token (si implementas refresh tokens)
const refreshToken = async () => {
  try {
    // Implementar si tienes refresh tokens
    // const response = await api.post('/auth/refresh');
    // localStorage.setItem('hospital_token', response.token);
    // return response.token;
  } catch (error) {
    console.error('❌ Error renovando token:', error);
    throw error;
  }
};

// Función para logout limpio
const cleanLogout = () => {
  localStorage.removeItem('hospital_token');
  localStorage.removeItem('hospital_user');
  console.log('🔓 Logout limpio realizado');
};

export const authService = {
  login: async (credentials) => {
    try {
      console.log('🔐 Intentando login para:', credentials.usuario_nombre);
      const response = await api.post('/auth/login', credentials);
      console.log('✅ Login exitoso');
      return response;
    } catch (error) {
      console.error('❌ Error en login:', error);
      throw error;
    }
  },

  logout: () => {
    cleanLogout();
  },

  verifyToken: async () => {
    try {
      const response = await api.get('/auth/verify');
      return response;
    } catch (error) {
      console.error('❌ Error verificando token:', error);
      cleanLogout();
      throw error;
    }
  },

register: async (registrationData) => {
  try {
    console.log('📝 Intentando registro para:', registrationData.usuario_nombre);
    // ✅ Esta es la URL correcta que coincide con tu backend
    const response = await api.post('/auth/register-paciente', registrationData);
    console.log('✅ Registro exitoso');
    return response;
  } catch (error) {
    console.error('❌ Error en registro:', error);
    throw error;
  }
},

  hasValidSession,
  refreshToken
};

export default api;