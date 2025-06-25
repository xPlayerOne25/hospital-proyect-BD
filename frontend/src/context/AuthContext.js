// contexts/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Verificar autenticación al cargar la app
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      setLoading(true);
      
      // Verificar si hay datos en localStorage
      const storedToken = localStorage.getItem('hospital_token');
      const storedUser = localStorage.getItem('hospital_user');

      if (!storedToken || !storedUser) {
        setLoading(false);
        return;
      }

      // Verificar si el token es válido
      if (authService.hasValidSession()) {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setIsAuthenticated(true);
        console.log('✅ Sesión válida encontrada para:', userData.usuario_nombre);
      } else {
        // Token expirado o inválido
        logout();
        console.log('❌ Sesión expirada o inválida');
      }

    } catch (error) {
      console.error('❌ Error verificando autenticación:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      console.log('🔐 Iniciando proceso de login...');
      const response = await authService.login(credentials);

      if (response.success) {
        const { user, token } = response.data;
        
        // Guardar en localStorage
        localStorage.setItem('hospital_token', token);
        localStorage.setItem('hospital_user', JSON.stringify(user));
        
        // Actualizar estado
        setUser(user);
        setIsAuthenticated(true);
        
        console.log('✅ Login exitoso para:', user.usuario_nombre);
        return { success: true, user };
      } else {
        console.error('❌ Login fallido:', response.message);
        return { success: false, message: response.message };
      }

    } catch (error) {
      console.error('❌ Error en login:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Error de conexión' 
      };
    }
  };

  const logout = () => {
    console.log('🔓 Cerrando sesión...');
    
    // Limpiar localStorage
    localStorage.removeItem('hospital_token');
    localStorage.removeItem('hospital_user');
    
    // Limpiar estado
    setUser(null);
    setIsAuthenticated(false);
    
    // Usar el logout del servicio
    authService.logout();
    
    console.log('✅ Sesión cerrada correctamente');
  };

  const register = async (registrationData) => {
    try {
      console.log('📝 Iniciando proceso de registro...');
      const response = await authService.register(registrationData);

      if (response.success) {
        console.log('✅ Registro exitoso para:', registrationData.usuario_nombre);
        return { success: true, data: response.data };
      } else {
        console.error('❌ Registro fallido:', response.message);
        return { success: false, message: response.message };
      }

    } catch (error) {
      console.error('❌ Error en registro:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Error de conexión' 
      };
    }
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    register,
    checkAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};