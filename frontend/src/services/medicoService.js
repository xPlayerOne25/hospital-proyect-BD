// src/services/medicoService.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// Configurar interceptor para debug
axios.interceptors.request.use(
  config => {
    console.log('🚀 Request:', config.method?.toUpperCase(), config.url);
    if (config.data) {
      console.log('📤 Request Data:', config.data);
    }
    return config;
  },
  error => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

axios.interceptors.response.use(
  response => {
    console.log('✅ Response exitosa:', response.config.url);
    console.log('📥 Response Status:', response.status);
    console.log('📥 Response Data:', response.data);
    return response;
  },
  error => {
    console.error('❌ Response Error:', error.config?.url, error.response?.status);
    console.error('❌ Error Data:', error.response?.data);
    return Promise.reject(error);
  }
);

export const medicoService = {
  // ===============================
  // GESTIÓN DE PERFIL MÉDICO
  // ===============================
  
  

  async obtenerPerfil(cedula) {
    console.log('🔍 MedicoService.obtenerPerfil - Cédula:', cedula);
    try {
      const response = await axios.get(`${API_URL}/medico/perfil/${cedula}`);
      
      // 🔧 FIX: Verificar estructura de respuesta
      if (response.data && response.data.success) {
        return response.data;
      } else {
        console.warn('⚠️ Respuesta inesperada del perfil:', response.data);
        throw new Error('Formato de respuesta inválido');
      }
    } catch (error) {
      console.error('❌ Error en obtenerPerfil:', error);
      throw error;
    }
  },

  

  
  

  async actualizarPerfil(cedula, datos) {
    console.log('✏️ MedicoService.actualizarPerfil - Cédula:', cedula, 'Datos:', datos);
    try {
      const response = await axios.put(`${API_URL}/medico/perfil/${cedula}`, datos);
      
      if (response.data && response.data.success) {
        return response.data;
      } else {
        throw new Error('Error al actualizar perfil');
      }
    } catch (error) {
      console.error('❌ Error en actualizarPerfil:', error);
      throw error;
    }
  },

  

  

  // ===============================
  // GESTIÓN DE CITAS MÉDICAS
  // ===============================
  
  async obtenerCitas(cedula, filtros = {}) {
    console.log('📅 MedicoService.obtenerCitas - Cédula:', cedula, 'Filtros:', filtros);
    
    try {
      const params = new URLSearchParams();
      if (filtros.estatus) params.append('estatus', filtros.estatus);
      if (filtros.fecha_inicio) params.append('fecha_inicio', filtros.fecha_inicio);
      if (filtros.fecha_fin) params.append('fecha_fin', filtros.fecha_fin);
      
      const url = `${API_URL}/medico/citas/${cedula}${params.toString() ? `?${params.toString()}` : ''}`;
      console.log('🔗 URL completa:', url);
      
      const response = await axios.get(url);
      
      console.log('📋 Respuesta completa del backend:', response.data);
      console.log('📋 Status de respuesta:', response.status);
      console.log('📋 Headers de respuesta:', response.headers);
      
      // 🔧 FIX: Verificar estructura de respuesta específicamente
      if (response.data) {
        const { success, data } = response.data;
        
        console.log('🔍 Verificando respuesta:');
        console.log('  - success:', success);
        console.log('  - data existe:', !!data);
        console.log('  - data es array:', Array.isArray(data));
        console.log('  - longitud de data:', data ? data.length : 'N/A');
        
        if (success && data) {
          if (Array.isArray(data)) {
            console.log('✅ Respuesta válida con', data.length, 'citas');
            return { success: true, data };
          } else {
            console.warn('⚠️ data no es array:', typeof data, data);
            return { success: true, data: [] }; // Fallback a array vacío
          }
        } else if (success && data === null) {
          // Backend devolvió success: true pero data: null
          console.log('ℹ️ Respuesta exitosa sin datos');
          return { success: true, data: [] };
        } else {
          console.warn('⚠️ Respuesta sin success o data:', response.data);
          return { success: false, data: [], message: 'Respuesta inválida del servidor' };
        }
      } else {
        console.error('❌ Respuesta vacía del servidor');
        return { success: false, data: [], message: 'Respuesta vacía del servidor' };
      }
    } catch (error) {
      console.error('❌ Error en obtenerCitas:', error);
      console.error('❌ Error completo:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      });
      throw error;
    }
  },

  async cancelarCita(folioCita, datos) {
    console.log('❌ MedicoService.cancelarCita - Folio:', folioCita, 'Datos:', datos);
    try {
      const response = await axios.post(`${API_URL}/medico/citas/cancelar/${folioCita}`, datos);
      return response.data;
    } catch (error) {
      console.error('❌ Error en cancelarCita:', error);
      throw error;
    }
  },

  async marcarCitaAtendida(folioCita, datos) {
    console.log('✅ MedicoService.marcarCitaAtendida - Folio:', folioCita, 'Datos:', datos);
    try {
      const response = await axios.put(`${API_URL}/medico/citas/atender/${folioCita}`, datos);
      return response.data;
    } catch (error) {
      console.error('❌ Error en marcarCitaAtendida:', error);
      throw error;
    }
  },

  async atenderCitaCompleta(folioCita, datos) {
    console.log('🏥 MedicoService.atenderCitaCompleta - Folio:', folioCita, 'Datos:', datos);
    try {
      const response = await axios.post(`${API_URL}/medico/citas/atender-completa/${folioCita}`, datos);
      return response.data;
    } catch (error) {
      console.error('❌ Error en atenderCitaCompleta:', error);
      throw error;
    }
  },

  // ===============================
  // GESTIÓN DE PACIENTES
  // ===============================
  
async obtenerDatosPaciente(curp) {
  console.log('👤 MedicoService.obtenerDatosPaciente - CURP:', curp);
  try {
    const response = await axios.get(`${API_URL}/medico/pacientes/${curp}`);
    return response.data;
  } catch (error) {
    console.error('❌ Error en obtenerDatosPaciente:', error);
    throw error;
  }
},

  

  // ===============================
  // GESTIÓN DE HISTORIAL MÉDICO
  // ===============================
  
  async obtenerHistorialPaciente(curp) {
    console.log('📋 MedicoService.obtenerHistorialPaciente - CURP:', curp);
    try {
      const response = await axios.get(`${API_URL}/medico/historial/${curp}`);
      return response.data;
    } catch (error) {
      console.error('❌ Error en obtenerHistorialPaciente:', error);
      throw error;
    }
  },

  

  async agregarHistorialMedico(curp, datos) {
    console.log('➕ MedicoService.agregarHistorialMedico - CURP:', curp, 'Datos:', datos);
    try {
      const response = await axios.post(`${API_URL}/medico/historial/${curp}`, datos);
      return response.data;
    } catch (error) {
      console.error('❌ Error en agregarHistorialMedico:', error);
      throw error;
    }
  },

  async obtenerHistorialPropio(cedula, filtros = {}) {
    console.log('📚 MedicoService.obtenerHistorialPropio - Cédula:', cedula, 'Filtros:', filtros);
    try {
      const params = new URLSearchParams();
      if (filtros.fecha_inicio) params.append('fecha_inicio', filtros.fecha_inicio);
      if (filtros.fecha_fin) params.append('fecha_fin', filtros.fecha_fin);
      
      const url = `${API_URL}/medico/historial-propio/${cedula}${params.toString() ? `?${params.toString()}` : ''}`;
      console.log('🔗 URL completa:', url);
      
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error('❌ Error en obtenerHistorialPropio:', error);
      throw error;
    }
  },

  

  // ===============================
  // GESTIÓN DE RECETAS
  // ===============================
  
  async obtenerRecetas(cedula, filtros = {}) {
    console.log('💊 MedicoService.obtenerRecetas - Cédula:', cedula, 'Filtros:', filtros);
    try {
      const params = new URLSearchParams();
      if (filtros.fecha_inicio) params.append('fecha_inicio', filtros.fecha_inicio);
      if (filtros.fecha_fin) params.append('fecha_fin', filtros.fecha_fin);
      if (filtros.paciente_curp) params.append('paciente', filtros.paciente_curp);
      
      const url = `${API_URL}/medico/recetas/${cedula}${params.toString() ? `?${params.toString()}` : ''}`;
      console.log('🔗 URL completa:', url);
      
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error('❌ Error en obtenerRecetas:', error);
      throw error;
    }
  },

  async crearReceta(datos) {
    console.log('📝 MedicoService.crearReceta - Datos:', datos);
    try {
      const response = await axios.post(`${API_URL}/medico/recetas`, datos);
      return response.data;
    } catch (error) {
      console.error('❌ Error en crearReceta:', error);
      throw error;
    }
  },

  async obtenerReceta(idReceta) {
    console.log('🔍 MedicoService.obtenerReceta - ID:', idReceta);
    try {
      const response = await axios.get(`${API_URL}/medico/receta/${idReceta}`);
      return response.data;
    } catch (error) {
      console.error('❌ Error en obtenerReceta:', error);
      throw error;
    }
  },

  // ===============================
  // ESTADÍSTICAS
  // ===============================
  
  async obtenerEstadisticas(cedula) {
    console.log('📊 MedicoService.obtenerEstadisticas - Cédula:', cedula);
    try {
      const response = await axios.get(`${API_URL}/medico/estadisticas/${cedula}`);
      
      if (response.data && response.data.data) {
        return response.data;
      } else {
        throw new Error('Formato de respuesta inválido');
      }

    } catch (error) {
      console.error('❌ Error en obtenerEstadisticas:', error);
      throw error;
    }
  }
};