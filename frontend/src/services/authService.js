// services/authService.js - ARCHIVO COMPLETO CORREGIDO
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

console.log('🔧 Configurando authService con URL:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 segundos de timeout
});

// ===== INTERCEPTORS =====

// Agrega el token a cada request si existe
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('hospital_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`📤 ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ Error en request interceptor:', error);
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de sesión
api.interceptors.response.use(
  (response) => {
    console.log(`📥 Response ${response.status} from ${response.config.url}`);
    return response.data;
  },
  (error) => {
    const { response } = error;
    console.error('❌ Error en response:', {
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

// ===== SERVICIO PRINCIPAL =====
export const authService = {
  
  

  // ===============================
  // AUTENTICACIÓN
  // ===============================
  login: async (credentials) => {
    try {
      console.log('🔐 Intentando login...');
      const response = await api.post('/auth/login', credentials);
      console.log('✅ Login exitoso');
      return response;
    } catch (error) {
      console.error('❌ Error en login:', error);
      throw error;
    }
  },

  logout: () => {
    console.log('👋 Cerrando sesión...');
    localStorage.removeItem('hospital_token');
    localStorage.removeItem('hospital_user');
    window.location.href = '/login';
  },

  register: async (registrationData) => {
    try {
      console.log('📝 Registrando paciente...');
      const response = await api.post('/auth/register-paciente', registrationData);
      console.log('✅ Registro exitoso');
      return response;
    } catch (error) {
      console.error('❌ Error en registro:', error);
      throw error;
    }
  },

  verifyToken: async () => {
    try {
      const response = await api.get('/auth/verify');
      return response;
    } catch (error) {
      console.error('❌ Error verificando token:', error);
      throw error;
    }
  },

  hasValidSession: () => {
    const token = localStorage.getItem('hospital_token');
    const user = localStorage.getItem('hospital_user');
    if (!token || !user) return false;

    try {
      const tokenData = JSON.parse(atob(token.split('.')[1]));
      return tokenData.exp > Date.now() / 1000;
    } catch {
      return false;
    }
  },

  // ===============================
  // GESTIÓN DE CITAS
  // ===============================

  // Obtener especialidades disponibles
  obtenerEspecialidades: async () => {
    try {
      console.log('🏥 Obteniendo especialidades...');
      const response = await api.get('/citas/especialidades');
      console.log('✅ Especialidades obtenidas:', response.data?.length || 0);
      return response;
    } catch (error) {
      console.error('❌ Error obteniendo especialidades:', error);
      throw error;
    }
  },

  // Obtener médicos por especialidad
  obtenerMedicosPorEspecialidad: async (especialidadId) => {
    try {
      console.log('👨‍⚕️ Obteniendo médicos para especialidad:', especialidadId);
      const response = await api.get(`/pacientes/${especialidadId}`);
      console.log('✅ Médicos obtenidos:', response.data?.length || 0);
      return response;
    } catch (error) {
      console.error('❌ Error obteniendo médicos:', error);
      throw error;
    }
  },

  // Obtener información de un doctor específico
  obtenerInfoDoctor: async (cedula) => {
    try {
      console.log('👨‍⚕️ Obteniendo info del doctor:', cedula);
      const response = await api.get(`/citas/doctor/${cedula}/info`);
      console.log('✅ Info del doctor obtenida');
      return response;
    } catch (error) {
      console.error('❌ Error obteniendo info del doctor:', error);
      throw error;
    }
  },

  // Obtener fechas disponibles
  obtenerFechasDisponibles: async () => {
    try {
      console.log('📅 Obteniendo fechas disponibles...');
      const response = await api.get('/citas/fechas-disponibles');
      console.log('✅ Fechas disponibles obtenidas:', response.data?.length || 0);
      return response;
    } catch (error) {
      console.error('❌ Error obteniendo fechas:', error);
      throw error;
    }
  },

  // Obtener horarios disponibles
  obtenerHorariosDisponibles: async (cedula, fecha) => {
    try {
      console.log('⏰ Obteniendo horarios disponibles:', { cedula, fecha });
      const response = await api.get(`/citas/doctor/${cedula}/horarios/${fecha}`);
      console.log('✅ Horarios obtenidos:', response.data?.horarios_disponibles?.length || 0);
      return response;
    } catch (error) {
      console.error('❌ Error obteniendo horarios:', error);
      throw error;
    }
  },

  // Generar nueva cita
  generarCita: async (datosCita) => {
    try {
      console.log('📝 Generando nueva cita:', datosCita);
      const response = await api.post('/citas/generar', datosCita);
      console.log('✅ Cita generada exitosamente');
      return response;
    } catch (error) {
      console.error('❌ Error generando cita:', error);
      throw error;
    }
  },

  // Obtener citas del paciente
  obtenerCitasPaciente: async () => {
    try {
      console.log('📋 Obteniendo citas del paciente...');
      const response = await api.get('/citas/paciente');
      console.log('✅ Citas del paciente obtenidas:', response.data?.length || 0);
      return response;
    } catch (error) {
      console.error('❌ Error obteniendo citas del paciente:', error);
      throw error;
    }
  },

  // Obtener citas pendientes de pago
  obtenerCitasPendientesPago: async () => {
    try {
      console.log('💳 Obteniendo citas pendientes de pago...');
      const response = await api.get('/citas/pendientes-pago');
      console.log('✅ Citas pendientes obtenidas:', response.citas?.length || 0);
      return response;
    } catch (error) {
      console.error('❌ Error obteniendo citas pendientes:', error);
      throw error;
    }
  },

  // ===============================
  // CANCELACIÓN DE CITAS CON POLÍTICA
  // ===============================

  // Obtener política de cancelación para una cita específica
  obtenerPoliticaCancelacion: async (folioCita) => {
    try {
      console.log('📋 Obteniendo política de cancelación para cita:', folioCita);
      const response = await api.get(`/citas/${folioCita}/politica-cancelacion`);
      console.log('✅ Política de cancelación obtenida');
      return response;
    } catch (error) {
      console.error('❌ Error obteniendo política de cancelación:', error);
      throw error;
    }
  },

  // Cancelar cita con política de devolución
  cancelarCitaConPolitica: async (folioCita, motivoCancelacion = null) => {
    try {
      console.log('🔄 Cancelando cita con política:', folioCita);
      
      const datosEnvio = {};
      if (motivoCancelacion) {
        datosEnvio.motivo_cancelacion = motivoCancelacion;
      }
      
      const response = await api.put(`/citas/cancelar/${folioCita}`, datosEnvio);
      console.log('✅ Cita cancelada exitosamente');
      return response;
    } catch (error) {
      console.error('❌ Error cancelando cita:', error);
      throw error;
    }
  },

  // Cancelar cita (función simplificada)
  cancelarCita: async (folioCita, motivoCancelacion = null) => {
    try {
      console.log('❌ Cancelando cita:', folioCita);
      return await authService.cancelarCitaConPolitica(folioCita, motivoCancelacion);
    } catch (error) {
      console.error('❌ Error cancelando cita:', error);
      throw error;
    }
  },

  // ===============================
  // GESTIÓN DE RECEPCIONISTA
  // ===============================

  // Obtener todas las citas (para recepcionista)
  obtenerCitas: async () => {
    try {
      console.log('📋 Obteniendo todas las citas...');
      const response = await api.get('/recepcionista/citas');
      console.log('✅ Citas obtenidas:', response.data?.length || 0);
      return response;
    } catch (error) {
      console.error('❌ Error obteniendo citas:', error);
      throw error;
    }
  },

  // Obtener estatus de citas disponibles
  obtenerEstatusCita: async () => {
    try {
      console.log('📋 Obteniendo estatus de citas...');
      const response = await api.get('/recepcionista/citas/estatus');
      console.log('✅ Estatus de citas obtenidos:', response.data?.length || 0);
      return response;
    } catch (error) {
      console.error('❌ Error obteniendo estatus de citas:', error);
      throw error;
    }
  },

  // Actualizar estatus de una cita
  actualizarEstatusCita: async (folio, datosActualizacion) => {
    try {
      console.log('🔄 Actualizando estatus de cita:', folio, datosActualizacion);
      const response = await api.put(`/recepcionista/citas/${folio}/estatus`, datosActualizacion);
      console.log('✅ Estatus de cita actualizado');
      return response;
    } catch (error) {
      console.error('❌ Error actualizando estatus de cita:', error);
      throw error;
    }
  },

  // Obtener historial de cambios de una cita
  obtenerHistorialCitaDetallado: async (folio) => {
    try {
      console.log('📋 Obteniendo historial de cita:', folio);
      const response = await api.get(`/recepcionista/citas/${folio}/historial`);
      console.log('✅ Historial de cita obtenido');
      return response;
    } catch (error) {
      console.error('❌ Error obteniendo historial de cita:', error);
      throw error;
    }
  },

  // Procesar citas pasadas (marcar como "No Acudió")
  procesarCitasPasadas: async () => {
    try {
      console.log('🔄 Procesando citas pasadas...');
      const response = await api.post('/recepcionista/citas/procesar-pasadas');
      console.log('✅ Citas pasadas procesadas:', response.data?.citas_procesadas || 0);
      return response;
    } catch (error) {
      console.error('❌ Error procesando citas pasadas:', error);
      throw error;
    }
  },

  // Obtener estadísticas de citas por estatus
  obtenerEstadisticasCitas: async () => {
    try {
      console.log('📊 Obteniendo estadísticas de citas...');
      const response = await api.get('/recepcionista/citas/estadisticas');
      console.log('✅ Estadísticas de citas obtenidas');
      return response;
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas de citas:', error);
      throw error;
    }
  },

  // ===============================
  // GESTIÓN DE PACIENTES
  // ===============================

  obtenerPacientes: async () => {
    try {
      console.log('👥 Obteniendo pacientes...');
      const response = await api.get('/recepcionista/pacientes');
      console.log('✅ Pacientes obtenidos:', response.data?.length || 0);
      return response;
    } catch (error) {
      console.error('❌ Error obteniendo pacientes:', error);
      throw error;
    }
  },

  actualizarPaciente: async (curp, datosActualizados) => {
    try {
      console.log('🔄 Actualizando paciente:', curp);
      const response = await api.put(`/recepcionista/pacientes/${curp}`, datosActualizados);
      console.log('✅ Paciente actualizado');
      return response;
    } catch (error) {
      console.error('❌ Error actualizando paciente:', error);
      throw error;
    }
  },

  crearPaciente: async (datosPaciente) => {
    try {
      console.log('👤 Creando paciente...');
      const response = await api.post('/recepcionista/pacientes', datosPaciente);
      console.log('✅ Paciente creado');
      return response;
    } catch (error) {
      console.error('❌ Error creando paciente:', error);
      throw error;
    }
  },

  // ===============================
  // GESTIÓN DE DOCTORES
  // ===============================

  obtenerDoctores: async () => {
    try {
      console.log('👨‍⚕️ Obteniendo doctores...');
      const response = await api.get('/recepcionista/doctores');
      console.log('✅ Doctores obtenidos:', response.data?.length || 0);
      return response;
    } catch (error) {
      console.error('❌ Error obteniendo doctores:', error);
      throw error;
    }
  },

  // Crear doctor
  crearDoctor: async (datosDoctor) => {
    try {
      console.log('👨‍⚕️ Creando doctor...');
      const response = await api.post('/recepcionista/doctores', datosDoctor);
      console.log('✅ Doctor creado exitosamente');
      return response;
    } catch (error) {
      console.error('❌ Error creando doctor:', error);
      throw error;
    }
  },

  // Crear usuario para doctor existente
  crearUsuarioDoctor: async (cedula) => {
    try {
      console.log('🔐 Creando usuario para doctor:', cedula);
      const response = await api.post(`/recepcionista/doctores/${cedula}/crear-usuario`);
      console.log('✅ Usuario creado para doctor');
      return response;
    } catch (error) {
      console.error('❌ Error creando usuario para doctor:', error);
      throw error;
    }
  },

// Función corregida para darBajaDoctor en authService.js

darBajaDoctor: async (cedula) => {
  try {
    console.log('🗑️ Dando de baja doctor:', cedula);
    
    // 🔧 CORREGIDO: Cambiar de PUT a DELETE y usar la ruta correcta
    const response = await api.delete(`/recepcionista/doctores/${cedula}`);
    
    console.log('✅ Doctor dado de baja');
    return response;
  } catch (error) {
    console.error('❌ Error dando de baja doctor:', error);
    
    // Mejor manejo de errores específicos
    if (error.response) {
      const { status, data } = error.response;
      
      if (status === 400) {
        throw new Error(data.message || 'El doctor tiene citas pendientes y no puede ser dado de baja');
      } else if (status === 404) {
        throw new Error('Doctor no encontrado');
      } else if (status === 500) {
        throw new Error(data.message || 'Error interno del servidor');
      }
    }

    
    
    throw error;
  }
},
  // ===============================
  // GESTIÓN DE COBROS Y TICKETS
  // ===============================

  obtenerCobros: async () => {
    try {
      console.log('💳 Obteniendo información de cobros...');
      const response = await api.get('/recepcionista/cobros');
      console.log('✅ Cobros obtenidos:', response.data?.length || 0);
      return response;
    } catch (error) {
      console.error('❌ Error obteniendo cobros:', error);
      throw error;
    }
  },

  generarTicket: async (folioCita) => {
    try {
      console.log('🧾 Generando ticket para folio:', folioCita);
      const response = await api.get(`/recepcionista/ticket/${folioCita}`);
      console.log('✅ Ticket generado exitosamente');
      return response;
    } catch (error) {
      console.error('❌ Error generando ticket:', error);
      throw error;
    }
  },

  obtenerDetallesTicket: async (folioCita) => {
    try {
      console.log('📋 Obteniendo detalles del ticket para folio:', folioCita);
      const response = await api.get(`/recepcionista/ticket/${folioCita}/detalles`);
      console.log('✅ Detalles del ticket obtenidos');
      return response;
    } catch (error) {
      console.error('❌ Error obteniendo detalles del ticket:', error);
      throw error;
    }
  },

  obtenerTicketCompleto: async (folioCita) => {
    try {
      console.log('🧾 Obteniendo ticket completo para folio:', folioCita);
      
      // Obtener tanto el ticket como los detalles
      const [ticketResponse, detallesResponse] = await Promise.all([
        api.get(`/recepcionista/ticket/${folioCita}`),
        api.get(`/recepcionista/ticket/${folioCita}/detalles`).catch(() => ({ 
          data: { success: true, data: { servicios: [], medicamentos: [] } } 
        }))
      ]);

      if (ticketResponse.success) {
        console.log('✅ Ticket completo obtenido');
        return {
          success: true,
          ticket: ticketResponse.data,
          detalles: detallesResponse.data?.data || { servicios: [], medicamentos: [] }
        };
      } else {
        throw new Error(ticketResponse.message || 'Error obteniendo ticket');
      }
    } catch (error) {
      console.error('❌ Error obteniendo ticket completo:', error);
      throw error;
    }
  },

  // ===============================
  // CATÁLOGOS
  // ===============================

  obtenerEspecialidadesCatalogo: async () => {
    try {
      console.log('🏥 Obteniendo catálogo de especialidades...');
      const response = await api.get('/recepcionista/especialidades');
      console.log('✅ Especialidades del catálogo obtenidas');
      return response;
    } catch (error) {
      console.error('❌ Error obteniendo especialidades del catálogo:', error);
      throw error;
    }
  },

  obtenerConsultorios: async () => {
    try {
      console.log('🏢 Obteniendo consultorios...');
      const response = await api.get('/recepcionista/consultorios');
      console.log('✅ Consultorios obtenidos');
      return response;
    } catch (error) {
      console.error('❌ Error obteniendo consultorios:', error);
      throw error;
    }
  },

  obtenerEstadisticasGeneral: async () => {
    try {
      console.log('📊 Obteniendo estadísticas generales...');
      const response = await api.get('/recepcionista/estadisticas');
      console.log('✅ Estadísticas generales obtenidas');
      return response;
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas generales:', error);
      throw error;
    }
  },

  // ===============================
  // FUNCIONES HELPER
  // ===============================

  // Función helper para formatear montos monetarios
  formatearMonto: (monto) => {
    if (typeof monto !== 'number') {
      monto = parseFloat(monto) || 0;
    }
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(monto);
  },

  // Función helper para generar número de ticket
  generarNumeroTicket: (folio) => {
    const timestamp = Date.now().toString().slice(-6);
    return `TCK-${folio}-${timestamp}`;
  },

  // Función helper para validar datos de ticket antes de generar
  validarDatosTicket: (datosTicket) => {
    const errores = [];

    if (!datosTicket.folio_cita) {
      errores.push('Folio de cita es requerido');
    }

    if (!datosTicket.nombre_paciente) {
      errores.push('Nombre del paciente es requerido');
    }

    if (!datosTicket.nombre_medico) {
      errores.push('Nombre del médico es requerido');
    }

    if (!datosTicket.nombre_especialidad) {
      errores.push('Especialidad es requerida');
    }

    if (!datosTicket.total || datosTicket.total <= 0) {
      errores.push('Total debe ser mayor a 0');
    }

    return {
      esValido: errores.length === 0,
      errores
    };
  },

  // Función helper para manejar impresión de tickets
  imprimirTicket: (ticket, detalles = null) => {
    try {
      console.log('🖨️ Preparando impresión de ticket...');
      
      // Validar datos antes de imprimir
      const validacion = authService.validarDatosTicket(ticket);
      if (!validacion.esValido) {
        throw new Error('Datos del ticket incompletos: ' + validacion.errores.join(', '));
      }

      // Generar número de ticket
      const numeroTicket = authService.generarNumeroTicket(ticket.folio_cita);
      const fechaEmision = new Date().toLocaleString('es-MX');

      // Generar HTML para impresión
      const htmlContent = `
        <!DOCTYPE html>
        <html lang="es">
          <head>
            <title>Ticket de Pago - ${ticket.folio_cita}</title>
            <meta charset="utf-8">
            <style>
              body { 
                font-family: 'Courier New', monospace; 
                margin: 0; 
                padding: 20px;
                font-size: 12px;
                line-height: 1.4;
              }
              .ticket { 
                max-width: 300px; 
                margin: 0 auto; 
                border: 1px solid #333;
                padding: 15px;
              }
              .header { 
                text-align: center; 
                border-bottom: 2px dashed #333; 
                padding-bottom: 10px; 
                margin-bottom: 15px;
              }
              .info-line {
                display: flex;
                justify-content: space-between;
                margin: 5px 0;
                font-size: 11px;
              }
              .total { 
                font-size: 14px; 
                font-weight: bold; 
                border-top: 2px dashed #333; 
                padding-top: 10px; 
                text-align: center;
                margin-top: 15px;
              }
              .footer {
                text-align: center;
                margin-top: 15px;
                font-size: 10px;
                border-top: 1px dashed #333;
                padding-top: 10px;
              }
            </style>
          </head>
          <body>
            <div class="ticket">
              <div class="header">
                <h2>🏥 CLÍNICA MÉDICA</h2>
                <p>Ticket de Pago</p>
                <p>No. ${numeroTicket}</p>
              </div>
              
              <div class="info-line">
                <span><strong>Folio:</strong></span>
                <span>${ticket.folio_cita}</span>
              </div>
              <div class="info-line">
                <span><strong>Fecha:</strong></span>
                <span>${authService.formatearFechaCita(ticket.fecha_hora)}</span>
              </div>
              <div class="info-line">
                <span><strong>Paciente:</strong></span>
                <span>${ticket.nombre_paciente}</span>
              </div>
              <div class="info-line">
                <span><strong>Médico:</strong></span>
                <span>${ticket.nombre_medico}</span>
              </div>
              <div class="info-line">
                <span><strong>Consultorio:</strong></span>
                <span>${ticket.consultorio_numero}</span>
              </div>
              
              <hr style="border: 1px dashed #333; margin: 15px 0;">
              
              <div class="info-line">
                <span>Consulta (${ticket.nombre_especialidad})</span>
                <span>${authService.formatearMonto(ticket.total || 0)}</span>
              </div>
              
              <div class="total">
                TOTAL: ${authService.formatearMonto(ticket.total || 0)}
              </div>
              
              <div class="footer">
                <p>Fecha emisión: ${fechaEmision}</p>
                <p>¡Gracias por su preferencia!</p>
                <p>* Conserve este ticket *</p>
              </div>
            </div>
            
            <script>
              window.onload = function() {
                window.print();
                window.onafterprint = function() {
                  window.close();
                };
              };
            </script>
          </body>
        </html>
      `;
      
      // Abrir ventana de impresión
      const ventanaImpresion = window.open('', '_blank');
      ventanaImpresion.document.write(htmlContent);
      ventanaImpresion.document.close();
      
      console.log('✅ Ticket enviado a impresión');
      return true;
    } catch (error) {
      console.error('❌ Error al imprimir ticket:', error);
      throw error;
    }
  },

  // Función helper para formatear fecha de manera consistente
  formatearFechaCita: (fecha, incluirHora = true) => {
    if (!fecha) return 'Fecha no disponible';
    
    try {
      const fechaObj = new Date(fecha);
      
      if (incluirHora) {
        return fechaObj.toLocaleString('es-MX', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });
      } else {
        return fechaObj.toLocaleDateString('es-MX', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      }
    } catch (error) {
      console.warn('⚠️ Error formateando fecha:', fecha, error);
      return 'Fecha inválida';
    }
  },

  // Formatear datos del doctor para envío al backend
  formatearDatosDoctor: (formData) => {
    console.log('🔧 Formateando datos del doctor:', formData);
    
    // Convertir horario_turno a número
    let turnoNumerico = 0; // Matutino por defecto
    if (formData.horario_turno === 'Vespertino') {
      turnoNumerico = 1;
    }
    
    const datosFormateados = {
      // Datos del médico
      cedula: formData.cedula.trim().toUpperCase(),
      especialidad_id: parseInt(formData.especialidad_id),
      consultorio_id: formData.consultorio_id ? parseInt(formData.consultorio_id) : null,
      
      // Datos del empleado
      empleado_nombre: formData.empleado_nombre.trim(),
      empleado_paterno: formData.empleado_paterno.trim(),
      empleado_materno: formData.empleado_materno ? formData.empleado_materno.trim() : '',
      empleado_tel: formData.empleado_tel.replace(/\D/g, ''), // Solo números
      empleado_correo: formData.empleado_correo.trim().toLowerCase(),
      empleado_curp: formData.empleado_curp ? formData.empleado_curp.trim().toUpperCase() : '',
      
      // Datos del horario
      horario_inicio: formData.horario_inicio || '08:00:00',
      horario_fin: formData.horario_fin || '17:00:00',
      horario_turno: turnoNumerico,
      
      // Datos laborales
      sueldo: parseFloat(formData.sueldo) || 15000,
      
      // Opciones
      crear_usuario: formData.crear_usuario || false
    };
    
    console.log('✅ Datos formateados:', datosFormateados);
    return datosFormateados;
  },

  // Función helper para obtener el color del badge según el estatus
  obtenerColorEstatus: (estatusId) => {
    const colores = {
      1: 'primary',    // Agendada
      2: 'success',    // Pagada
      3: 'warning',    // Cancelada Falta Pago
      4: 'danger',     // Cancelada Paciente
      5: 'secondary',  // Cancelada Doctor
      6: 'info',       // Atendida
      7: 'dark'        // No Acudió
    };
    return colores[estatusId] || 'light';
  },

  // Función helper para obtener el nombre del estatus
  obtenerNombreEstatus: (estatusId) => {
    const nombres = {
      1: 'Agendada',
      2: 'Pagada',
      3: 'Cancelada Falta Pago',
      4: 'Cancelada Paciente',
      5: 'Cancelada Doctor',
      6: 'Atendida',
      7: 'No Acudió'
    };
    return nombres[estatusId] || 'Desconocido';
  },

  // Función helper para validar si se puede cambiar un estatus
  puedeActualizarEstatus: (estatusActual, estatusNuevo, fechaCita) => {
    // No cambiar si es el mismo estatus
    if (estatusActual === estatusNuevo) {
      return { valido: false, mensaje: 'La cita ya tiene ese estatus' };
    }

    if (estatusNuevo === 2) {
      return { valido: true, mensaje: 'La cita se pegará' };
    }

    // No modificar citas atendidas
    if (estatusActual === 6 && estatusNuevo !== 6) {
      return { valido: false, mensaje: 'No se puede modificar una cita ya atendida' };
    }

    // Validaciones específicas por estatus
    const validaciones = {
      2: { // Pagada
        permitidos: [1, 3], // Solo desde Agendada o Cancelada Falta Pago
        mensaje: 'Solo se puede marcar como pagada una cita agendada o cancelada por falta de pago'
      },
      4: { // Cancelada Paciente
        excluidos: [6], // No se puede cancelar si ya fue atendida
        mensaje: 'No se puede cancelar una cita que ya fue atendida'
      },
      5: { // Cancelada Doctor
        excluidos: [6], // No se puede cancelar si ya fue atendida
        mensaje: 'No se puede cancelar una cita que ya fue atendida'
      },
      6: { // Atendida
        permitidos: [1, 2], // Solo desde Agendada o Pagada
        mensaje: 'Solo se puede marcar como atendida una cita agendada o pagada'
      },
      7: { // No Acudió
        validarFecha: true,
        excluidos: [6], // No si ya fue atendida
        mensaje: 'Solo se puede marcar como "No Acudió" citas pasadas que no fueron atendidas'
      }
    };

    const validacion = validaciones[estatusNuevo];
    if (validacion) {
      // Verificar estatus permitidos
      if (validacion.permitidos && !validacion.permitidos.includes(estatusActual)) {
        return { valido: false, mensaje: validacion.mensaje };
      }

      // Verificar estatus excluidos
      if (validacion.excluidos && validacion.excluidos.includes(estatusActual)) {
        return { valido: false, mensaje: validacion.mensaje };
      }

      // Verificar fecha para "No Acudió"
      if (validacion.validarFecha && new Date(fechaCita) >= new Date()) {
        return { valido: false, mensaje: 'Solo se puede marcar como "No Acudió" citas que ya pasaron' };
      }
    }

    return { valido: true, mensaje: 'Cambio permitido' };
  },

  // Función helper para determinar si una cita está en el pasado
  esCitaPasada: (fechaCita, horasMargen = 2) => {
    const ahora = new Date();
    const fecha = new Date(fechaCita);
    const diferenciaMilisegundos = ahora - fecha;
    const diferenciaHoras = diferenciaMilisegundos / (1000 * 60 * 60);
    
    return diferenciaHoras >= horasMargen;
  },

  // Función helper para obtener el estado temporal de una cita
  obtenerEstadoTemporal: (fechaCita) => {
    const ahora = new Date();
    const fecha = new Date(fechaCita);
    const diferencia = fecha - ahora;
    const diferenciaHoras = diferencia / (1000 * 60 * 60);
    const diferenciaDias = diferencia / (1000 * 60 * 60 * 24);

    if (diferencia < 0) {
      return {
        estado: 'pasada',
        texto: 'Cita pasada',
        color: 'text-muted',
        icono: '⏰'
      };
    } else if (diferenciaHoras <= 2) {
      return {
        estado: 'inmediata',
        texto: 'Muy próxima',
        color: 'text-danger',
        icono: '🔥'
      };
    } else if (diferenciaDias <= 1) {
      return {
        estado: 'hoy',
        texto: 'Hoy',
        color: 'text-warning',
        icono: '📅'
      };
    } else if (diferenciaDias <= 7) {
      return {
        estado: 'esta_semana',
        texto: 'Esta semana',
        color: 'text-info',
        icono: '📅'
      };
    } else {
      return {
        estado: 'futura',
        texto: 'Programada',
        color: 'text-success',
        icono: '📅'
      };
    }
  },

  // ===============================
  // MANEJO DE ERRORES
  // ===============================
  
  // Función para manejar errores de manera consistente
  handleError: (error) => {
    if (error.response) {
      // Error de respuesta del servidor
      const message = error.response.data?.message || 'Error del servidor';
      console.error('❌ Error del servidor:', message);
      return message;
    } else if (error.request) {
      // Error de red
      console.error('❌ Error de red:', error.request);
      return 'Error de conexión. Verifica tu conexión a internet.';
    } else {
      // Error de configuración
      console.error('❌ Error:', error.message);
      return error.message;
    }
  }
};

console.log('✅ authService configurado correctamente');

export default authService;