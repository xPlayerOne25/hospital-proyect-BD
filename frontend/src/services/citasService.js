// services/citasService.js - VERSIÓN CORREGIDA
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

console.log('🔧 Configurando citasService con URL:', API_URL);

// ✅ CREAR INSTANCIA PROPIA DE AXIOS
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// ✅ INTERCEPTORS PARA EL TOKEN
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('hospital_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`📤 CitasService: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ Error en request interceptor:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log(`📥 CitasService Response ${response.status} from ${response.config.url}`);
    return response.data; // ✅ RETORNAR SOLO response.data
  },
  (error) => {
    const { response } = error;
    console.error('❌ Error en CitasService response:', {
      status: response?.status,
      url: response?.config?.url,
      message: response?.data?.message
    });
    
    if (response?.status === 401) {
      localStorage.removeItem('hospital_token');
      localStorage.removeItem('hospital_user');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ✅ SERVICIO DE CITAS CORREGIDO
export const citasService = {
  // Obtener especialidades
  getEspecialidades: async () => {
    try {
      console.log('🏥 CitasService: Obteniendo especialidades...');
      const response = await api.get('/citas/especialidades');
      console.log('✅ Especialidades obtenidas:', response);
      
      if (response.success) {
        return response.data;
      }
      throw new Error(response.message || 'Respuesta inválida al obtener especialidades');
    } catch (error) {
      console.error('🚨 Error en getEspecialidades:', error);
      throw error;
    }
  },

  // Obtener médicos por especialidad
  getMedicosByEspecialidad: async (especialidadId) => {
    try {
      console.log('👨‍⚕️ CitasService: Obteniendo médicos para especialidad:', especialidadId);
      const response = await api.get(`/citas/medicos/${especialidadId}`);
      console.log('✅ Médicos obtenidos:', response);
      
      if (response.success) {
        return response.data;
      }
      throw new Error(response.message || 'No se pudieron obtener los médicos');
    } catch (error) {
      console.error('🚨 Error en getMedicosByEspecialidad:', error);
      throw error;
    }
  },

  // Obtener fechas disponibles
  getFechasDisponibles: async () => {
    try {
      console.log('📅 CitasService: Obteniendo fechas disponibles...');
      const response = await api.get('/citas/fechas-disponibles');
      console.log('✅ Fechas disponibles obtenidas:', response);
      
      if (response.success) {
        return response.data;
      }
      throw new Error(response.message || 'No se pudieron obtener las fechas');
    } catch (error) {
      console.error('🚨 Error en getFechasDisponibles:', error);
      throw error;
    }
  },

  // Obtener horarios disponibles
  getHorariosDisponibles: async (cedula, fecha) => {
    try {
      console.log('⏰ CitasService: Obteniendo horarios disponibles:', { cedula, fecha });
      const response = await api.get(`/citas/doctor/${cedula}/horarios/${fecha}`);
      console.log('✅ Horarios disponibles obtenidos:', response);
      
      if (response.success) {
        return response.data;
      }
      throw new Error(response.message || 'No se pudieron obtener los horarios');
    } catch (error) {
      console.error('🚨 Error en getHorariosDisponibles:', error);
      throw error;
    }
  },

  // Generar nueva cita
  generarCita: async (citaData) => {
    try {
      console.log('📝 CitasService: Generando nueva cita:', citaData);
      const response = await api.post('/citas/generar', citaData);
      console.log('✅ Cita generada:', response);
      
      if (response.success) {
        return response.data;
      }
      throw new Error(response.message || 'Error al generar cita');
    } catch (error) {
      console.error('🚨 Error en generarCita:', error);
      throw error;
    }
  },

  // ✅ FUNCIÓN CORREGIDA: Obtener citas del paciente autenticado
  getCitasPaciente: async () => {
    try {
      console.log('📋 CitasService: Obteniendo citas del paciente...');
      const response = await api.get('/citas/paciente');
      console.log('✅ Citas del paciente obtenidas:', response);
      
      // ✅ VERIFICAR LA ESTRUCTURA DE LA RESPUESTA
      if (response && response.success) {
        console.log('✅ Respuesta exitosa, datos:', response.data);
        return response; // Retornar toda la respuesta para mantener compatibilidad
      } else if (response && Array.isArray(response.data)) {
        // Si viene directamente el array
        return { success: true, data: response.data };
      } else if (response && Array.isArray(response)) {
        // Si la respuesta ES el array
        return { success: true, data: response };
      } else {
        console.error('❌ Estructura de respuesta inesperada:', response);
        throw new Error('Formato de respuesta inválido');
      }
    } catch (error) {
      console.error('🚨 Error en getCitasPaciente:', error);
      console.error('🚨 Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error;
    }
  },

  // Obtener citas pendientes de pago
  getCitasPendientesPago: async () => {
    try {
      console.log('💳 CitasService: Obteniendo citas pendientes...');
      const response = await api.get('/citas/pendientes-pago');
      console.log('✅ Citas pendientes obtenidas:', response);
      
      if (response.success) {
        return response.citas || response.data;
      }
      throw new Error(response.message || 'No se pudieron obtener las citas pendientes');
    } catch (error) {
      console.error('🚨 Error en getCitasPendientesPago:', error);
      throw error;
    }
  },

  // Cancelar cita con política
  cancelarCita: async (folio, motivo = null) => {
    try {
      console.log('❌ CitasService: Cancelando cita:', folio);
      const payload = {};
      if (motivo) {
        payload.motivo_cancelacion = motivo;
      }
      
      const response = await api.put(`/citas/cancelar/${folio}`, payload);
      console.log('✅ Cita cancelada:', response);
      
      if (response.success) {
        return response;
      }
      throw new Error(response.message || 'No se pudo cancelar la cita');
    } catch (error) {
      console.error('❌ Error en cancelarCita:', error);
      throw error;
    }
  },

  // Obtener política de cancelación
  getPoliticaCancelacion: async (folio) => {
    try {
      console.log('📋 CitasService: Obteniendo política de cancelación:', folio);
      const response = await api.get(`/citas/${folio}/politica-cancelacion`);
      console.log('✅ Política obtenida:', response);
      
      if (response.success) {
        return response.data;
      }
      throw new Error(response.message || 'No se pudo obtener la política');
    } catch (error) {
      console.error('❌ Error en getPoliticaCancelacion:', error);
      throw error;
    }
  },

  // Obtener citas del recepcionista
  getCitasRecepcionista: async () => {
    try {
      console.log('👩‍💼 CitasService: Obteniendo citas para recepcionista...');
      const response = await api.get('/recepcionista/citas');
      console.log('✅ Citas de recepcionista obtenidas:', response);
      
      if (Array.isArray(response)) {
        return response;
      }
      if (response.success && response.data) {
        return response.data;
      }
      if (response.data) {
        return response.data;
      }
      throw new Error('No se pudieron obtener las citas');
    } catch (error) {
      console.error('❌ Error en getCitasRecepcionista:', error);
      throw error;
    }
  },

  // Actualizar estatus de una cita
  actualizarEstatusCita: async (folio, nuevo_estatus) => {
    try {
      console.log('🔄 CitasService: Actualizando estatus:', { folio, nuevo_estatus });
      const response = await api.put(`/citas/${folio}/estatus`, { nuevo_estatus });
      console.log('✅ Estatus actualizado:', response);
      
      if (response.success) {
        return response.message;
      }
      throw new Error(response.message || 'No se pudo actualizar el estatus');
    } catch (error) {
      console.error('❌ Error en actualizarEstatusCita:', error);
      throw error;
    }
  }
};

console.log('✅ CitasService configurado correctamente');

export default citasService;