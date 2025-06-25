import api from './authService';

export const citasService = {
  // Obtener especialidades
  getEspecialidades: async () => {
    try {
      console.log('🌐 Llamando a /citas/especialidades');
      const response = await api.get('/citas/especialidades');
      console.log('📦 Respuesta completa de API:', response);
      
      // La respuesta ya viene procesada por el interceptor de axios
      // Verificar si la respuesta tiene la estructura correcta
      if (response.success) {
        return response; // Ya tiene success: true y data: [...]
      } else {
        throw new Error('Respuesta inválida de la API');
      }
    } catch (error) {
      console.error('🚨 Error en API call:', error);
      throw error;
    }
  },

  // Obtener médicos por especialidad
  getMedicosByEspecialidad: async (especialidadId) => {
    try {
      const response = await api.get(`/citas/medicos/${especialidadId}`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Generar nueva cita
  generarCita: async (citaData) => {
    try {
      const response = await api.post('/citas/generar', citaData);
      return response;
    } catch (error) {
      throw error;
    }
  },

// Obtener citas de un paciente
getCitasPaciente: async () => {
  try {
    console.log('🌐 Llamando a /citas/paciente');
    
    // Usar GET ya que el CURP viene del token, no del body
    const response = await api.get('/citas/paciente');
    console.log('📦 Respuesta completa de API:', response);
    
    return response;
  } catch (error) {
    console.error('🚨 Error en getCitasPaciente:', error);
    throw error;
  }
}

};