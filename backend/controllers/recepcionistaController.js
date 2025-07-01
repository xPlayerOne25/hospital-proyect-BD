const { executeStoredProcedure, executeQuery } = require('../config/database');

// ===============================
// GESTIÓN DE PACIENTES
// ===============================

// Obtener todos los pacientes
const obtenerPacientes = async (req, res) => {
  try {
    const result = await executeStoredProcedure('sp_obtenerPacientes');
    res.json({ success: true, data: result.recordset });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener pacientes', error: error.message });
  }
};

// ✅ Actualizar paciente (solo PACIENTE, no USUARIO)
const actualizarPaciente = async (req, res) => {
  const { curp } = req.params;
  const {
    nombre,
    apellido_paterno,
    apellido_materno,
    telefono,
    fecha_nacimiento,
  } = req.body;

  if (!curp || !nombre || !apellido_paterno) {
    return res.status(400).json({ success: false, message: 'CURP, nombre y apellido paterno son obligatorios' });
  }

  try {
    await executeStoredProcedure('sp_actualizarPaciente', {
      curp,
      nombre,
      paterno: apellido_paterno,
      materno: apellido_materno,
      telefono,
      fechaNacimiento: fecha_nacimiento
    });
    res.json({ success: true, message: 'Paciente actualizado correctamente' });
  } catch (error) {
    console.error('❌ Error al actualizar paciente:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar paciente', error: error.message });
  }
};

// Crear paciente
const crearPaciente = async (req, res) => {
  const {
    curp,
    nombre,
    apellido_paterno,
    apellido_materno,
    telefono,
    fecha_nacimiento,
    correo,
    direccion
  } = req.body;

  if (!curp || !nombre || !apellido_paterno || !correo) {
    return res.status(400).json({ success: false, message: 'CURP, nombre, apellido paterno y correo son obligatorios' });
  }

  try {
    await executeStoredProcedure('sp_crearPaciente', {
      curp,
      nombre,
      apellido_paterno,
      apellido_materno,
      telefono,
      fecha_nacimiento,
      correo,
      direccion
    });
    res.json({ success: true, message: 'Paciente creado correctamente' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al crear paciente', error: error.message });
  }
};

// ===============================
// GESTIÓN DE DOCTORES
// ===============================

// Actualizar función obtenerDoctores para mostrar info de usuario

const obtenerDoctores = async (req, res) => {
  try {
    console.log('👨‍⚕️ [obtenerDoctores] Obteniendo doctores completos...');
    
    const result = await executeStoredProcedure('sp_obtenerMedicosCompletos');
    
    console.log('✅ [obtenerDoctores] Doctores obtenidos:', result.recordset?.length || 0);
    res.json({ 
      success: true, 
      data: result.recordset || [],
      total: result.recordset?.length || 0 
    });
  } catch (error) {
    console.error('❌ [obtenerDoctores] Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener doctores', 
      error: error.message 
    });
  }
};


// Función para crear doctor completo con usuario
const crearDoctor = async (req, res) => {
  const {
    cedula,
    empleado_nombre,
    empleado_paterno,
    empleado_materno,
    empleado_tel,
    empleado_correo,
    empleado_curp,
    especialidad_id,
    consultorio_id,
    horario_inicio,
    horario_fin,
    horario_turno,
    sueldo,
    // Información de dirección
    calle,
    numero,
    colonia,
    codigo_postal,
    // Configuración de usuario
    crear_usuario = true,
    username,
    password_temp
  } = req.body;

  console.log('👨‍⚕️ [crearDoctor] Datos recibidos:', {
    cedula, empleado_nombre, empleado_paterno, empleado_correo, 
    especialidad_id, crear_usuario
  });

  // Validaciones obligatorias
  if (!cedula || !empleado_nombre || !empleado_paterno || !empleado_correo || !especialidad_id || !empleado_tel) {
    return res.status(400).json({ 
      success: false, 
      message: 'Campos obligatorios: cédula, nombre, apellido paterno, correo, teléfono y especialidad' 
    });
  }

  // Validar formato de correo
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(empleado_correo)) {
    return res.status(400).json({ 
      success: false, 
      message: 'El formato del correo electrónico no es válido' 
    });
  }

  // Validar teléfono (solo números)
  const telefonoLimpio = empleado_tel.replace(/\D/g, '');
  if (telefonoLimpio.length !== 10) {
    return res.status(400).json({ 
      success: false, 
      message: 'El teléfono debe tener exactamente 10 dígitos' 
    });
  }

  // Validar especialidad_id
  if (isNaN(parseInt(especialidad_id))) {
    return res.status(400).json({ 
      success: false, 
      message: 'La especialidad debe ser un ID válido' 
    });
  }

  try {
    // Convertir horario_turno a BIT
    let horario_turno_bit = 1; // Default: Matutino
    if (horario_turno) {
      horario_turno_bit = (horario_turno.toLowerCase() === 'vespertino') ? 0 : 1;
    }

    // Preparar parámetros para el SP
    const parametros = {
      cedula: cedula.toString().toUpperCase().trim(),
      empleado_nombre: empleado_nombre.toString().trim(),
      empleado_paterno: empleado_paterno.toString().trim(),
      empleado_materno: empleado_materno ? empleado_materno.toString().trim() : null,
      empleado_tel: telefonoLimpio,
      empleado_correo: empleado_correo.toString().toLowerCase().trim(),
      empleado_curp: empleado_curp ? empleado_curp.toString().toUpperCase().trim() : null,
      especialidad_id: parseInt(especialidad_id),
      consultorio_id: consultorio_id ? parseInt(consultorio_id) : null,
      horario_inicio: horario_inicio || '08:00',
      horario_fin: horario_fin || '17:00',
      horario_turno: horario_turno_bit,
      sueldo: parseFloat(sueldo) || 15000.00,
      // Dirección
      calle: calle || 'Sin especificar',
      numero: numero || '0',
      colonia: colonia || 'Sin especificar',
      codigo_postal: codigo_postal || '00000',
      // Usuario
      crear_usuario: crear_usuario ? 1 : 0,
      username: username || null,
      password_temp: password_temp || null
    };

    console.log('📤 [crearDoctor] Parámetros preparados:', {
      ...parametros,
      password_temp: parametros.password_temp ? '***' : null // Ocultar password en logs
    });

    // Ejecutar stored procedure
    const result = await executeStoredProcedure('sp_crearDoctorCompleto', parametros);

    // Normalizar resultado
    const datosCreacion = result.recordset && result.recordset.length > 0 ? result.recordset[0] : null;

    if (datosCreacion) {
      console.log('✅ [crearDoctor] Doctor creado exitosamente:', {
        cedula: datosCreacion.cedula,
        nombre: datosCreacion.nombre_completo,
        tiene_usuario: datosCreacion.tiene_usuario
      });

      // Preparar respuesta
      const respuesta = {
        success: true,
        message: 'Doctor creado exitosamente',
        data: {
          cedula: datosCreacion.cedula,
          nombre_completo: datosCreacion.nombre_completo,
          email: datosCreacion.email,
          especialidad: datosCreacion.especialidad,
          consultorio: datosCreacion.consultorio,
          tiene_usuario: datosCreacion.tiene_usuario === 'SÍ'
        }
      };

      // Agregar información de usuario solo si se creó
      if (datosCreacion.tiene_usuario === 'SÍ' && datosCreacion.username) {
        respuesta.data.credenciales = {
          username: datosCreacion.username,
          password_temporal: datosCreacion.password_temporal,
          nota: datosCreacion.nota_importante
        };
      }

      res.json(respuesta);
    } else {
      // Si no hay datos en recordset pero no hubo error
      res.json({ 
        success: true, 
        message: 'Doctor creado correctamente' 
      });
    }

  } catch (error) {
    console.error('❌ [crearDoctor] Error completo:', error);
    
    // Determinar el mensaje de error apropiado
    let mensajeError = 'Error interno del servidor';
    
    if (error.message.includes('Ya existe un médico')) {
      mensajeError = 'Ya existe un médico registrado con esa cédula';
    } else if (error.message.includes('Ya existe un usuario')) {
      mensajeError = 'Ya existe un usuario registrado con ese correo electrónico';
    } else if (error.message.includes('especialidad') && error.message.includes('no existe')) {
      mensajeError = 'La especialidad seleccionada no es válida';
    } else if (error.message.includes('consultorio') && error.message.includes('no existe')) {
      mensajeError = 'El consultorio seleccionado no es válido';
    } else {
      mensajeError = error.message;
    }
    
    res.status(500).json({ 
      success: false, 
      message: mensajeError,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ===============================
// GESTIÓN DE COBROS
// ===============================

const obtenerCobros = async (req, res) => {
  try {
    const result = await executeStoredProcedure('sp_obtenerCobrosRecepcion');
    const citasConTotal = result.recordset.map((cita) => ({
      ...cita,
      total:
        (parseFloat(cita.costo_especialidad) || 0) +
        (parseFloat(cita.total_servicios) || 0) +
        (parseFloat(cita.total_medicamentos) || 0)
    }));
    res.json({ success: true, data: citasConTotal });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener cobros', error: error.message });
  }
};

const generarTicket = async (req, res) => {
  const { folio_cita } = req.params;

  if (!folio_cita) {
    return res.status(400).json({ success: false, message: 'Folio de la cita es obligatorio' });
  }

  try {
    const result = await executeStoredProcedure('sp_generarTicketPago', { folio_cita });
    if (!result.recordset.length) {
      return res.status(404).json({ success: false, message: 'No se encontró información para generar el ticket' });
    }

    const ticket = result.recordset[0];
    ticket.total =
      (parseFloat(ticket.costo_especialidad) || 0) +
      (parseFloat(ticket.total_servicios) || 0) +
      (parseFloat(ticket.total_medicamentos) || 0);

    res.json({ success: true, data: ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al generar ticket', error: error.message });
  }
};

// ===============================
// CATÁLOGOS
// ===============================

// Función para obtener especialidades
const obtenerEspecialidades = async (req, res) => {
  try {
    console.log('🏥 [obtenerEspecialidades] Obteniendo especialidades...');
    
    const result = await executeQuery(`
      SELECT 
        id_especialidad,
        nombre_especialidad,
        descripcion,
        costo_especialidad,
        (SELECT COUNT(*) FROM MEDICO WHERE fk_id_especialidad = e.id_especialidad) AS total_medicos
      FROM ESPECIALIDAD e
      ORDER BY nombre_especialidad
    `);
    
    console.log('✅ [obtenerEspecialidades] Especialidades obtenidas:', result.recordset?.length || 0);
    res.json({ 
      success: true, 
      data: result.recordset || [] 
    });
  } catch (error) {
    console.error('❌ [obtenerEspecialidades] Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener especialidades', 
      error: error.message 
    });
  }
};


// Función para obtener consultorios
const obtenerConsultorios = async (req, res) => {
  try {
    console.log('🏢 [obtenerConsultorios] Obteniendo consultorios...');
    
    const result = await executeQuery(`
      SELECT 
        id_consultorio,
        consultorio_numero,
        (SELECT COUNT(*) FROM MEDICO WHERE fk_id_consultorio = c.id_consultorio) AS total_medicos_asignados,
        CASE 
          WHEN EXISTS (SELECT 1 FROM MEDICO WHERE fk_id_consultorio = c.id_consultorio) 
          THEN 'Ocupado' 
          ELSE 'Disponible' 
        END AS estatus
      FROM CONSULTORIO c
      ORDER BY consultorio_numero
    `);
    
    console.log('✅ [obtenerConsultorios] Consultorios obtenidos:', result.recordset?.length || 0);
    res.json({ 
      success: true, 
      data: result.recordset || [] 
    });
  } catch (error) {
    console.error('❌ [obtenerConsultorios] Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener consultorios', 
      error: error.message 
    });
  }
};
// ===============================
// ESTADÍSTICAS
// ===============================

// Reemplaza la función obtenerEstadisticas en recepcionistaController.js

const obtenerEstadisticas = async (req, res) => {
  // 🔧 FUNCIÓN HELPER PARA NORMALIZAR RESULTADOS
  const normalizarResultado = (result) => {
    // Si ya es un array, devolverlo tal como está
    if (Array.isArray(result)) {
      return result;
    }
    
    // Si es un objeto con recordset (como SQL Server con mssql)
    if (result && result.recordset && Array.isArray(result.recordset)) {
      return result.recordset;
    }
    
    // Si es un objeto con rows (como PostgreSQL)
    if (result && result.rows && Array.isArray(result.rows)) {
      return result.rows;
    }
    
    // Si es un objeto simple, convertirlo en array
    if (result && typeof result === 'object') {
      return [result];
    }
    
    // Si no se puede normalizar, devolver array vacío
    return [];
  };

  try {
    console.log('📊 [obtenerEstadisticas] Obteniendo estadísticas del dashboard...');

    // Ejecutar todas las consultas en paralelo
    const [pacientesRes, doctoresRes, citasRes, citasHoyRes] = await Promise.all([
      executeQuery('SELECT COUNT(*) as total FROM PACIENTE'),
      executeQuery('SELECT COUNT(*) as total FROM MEDICO'),
      executeQuery('SELECT COUNT(*) as total FROM CITA'),
      executeQuery('SELECT COUNT(*) as total FROM CITA WHERE CAST(cita_fechahora AS DATE) = CAST(GETDATE() AS DATE)')
    ]);

    // Normalizar resultados
    const pacientes = normalizarResultado(pacientesRes);
    const doctores = normalizarResultado(doctoresRes);
    const citas = normalizarResultado(citasRes);
    const citasHoy = normalizarResultado(citasHoyRes);

    console.log('🔍 [obtenerEstadisticas] Resultados normalizados:', {
      pacientes: pacientes.length > 0 ? pacientes[0] : null,
      doctores: doctores.length > 0 ? doctores[0] : null,
      citas: citas.length > 0 ? citas[0] : null,
      citasHoy: citasHoy.length > 0 ? citasHoy[0] : null
    });

    // Construir objeto de estadísticas con valores por defecto
    const estadisticas = {
      total_pacientes: pacientes.length > 0 ? (pacientes[0].total || 0) : 0,
      total_doctores: doctores.length > 0 ? (doctores[0].total || 0) : 0,
      total_citas: citas.length > 0 ? (citas[0].total || 0) : 0,
      citas_hoy: citasHoy.length > 0 ? (citasHoy[0].total || 0) : 0
    };

    console.log('✅ [obtenerEstadisticas] Estadísticas calculadas:', estadisticas);
    res.json({ success: true, data: estadisticas });

  } catch (error) {
    console.error('❌ [obtenerEstadisticas] Error:', error);
    
    // Devolver estadísticas por defecto en caso de error
    const estadisticasDefault = {
      total_pacientes: 0,
      total_doctores: 0,
      total_citas: 0,
      citas_hoy: 0
    };

    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener estadísticas',
      error: error.message,
      data: estadisticasDefault // Proporcionar datos por defecto
    });
  }
}; 

// ===============================
// DAR DE BAJA DOCTOR
// ===============================

const darBajaDoctor = async (req, res) => {
  const { cedula } = req.params;

  if (!cedula) {
    return res.status(400).json({
      success: false,
      message: 'La cédula del doctor es obligatoria'
    });
  }

  try {
    console.log(`⚠️ [darBajaDoctor] Intentando dar de baja al médico con cédula: ${cedula}`);

    await executeStoredProcedure('sp_darBajaDoctor', { cedula });

    res.json({
      success: true,
      message: `Doctor con cédula ${cedula} dado de baja correctamente`
    });
  } catch (error) {
    console.error('❌ [darBajaDoctor] Error al dar de baja:', error.message);

    res.status(500).json({
      success: false,
      message: 'Error al dar de baja al doctor',
      error: error.message
    });
  }
};

const obtenerCitas = async (req, res) => {
  try {
    const result = await executeStoredProcedure('sp_obtenerCitasRecepcion');
    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error('❌ [obtenerCitas] Error al obtener citas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener citas',
      error: error.message
    });
  }
};

const cancelarCita = async (req, res) => {
  const { folio } = req.params;

  if (!folio) {
    return res.status(400).json({
      success: false,
      message: 'El folio de la cita es obligatorio para cancelar'
    });
  }

  try {
    await executeStoredProcedure('sp_cancelarCita', { folio_cita: folio });
    res.json({
      success: true,
      message: `La cita con folio ${folio} fue cancelada correctamente`
    });
  } catch (error) {
    console.error('❌ [cancelarCita] Error al cancelar cita:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cancelar cita',
      error: error.message
    });
  }
};

const crearUsuarioDoctor = async (req, res) => {
  const { cedula, username, password_temp } = req.body;

  if (!cedula || !username || !password_temp) {
    return res.status(400).json({
      success: false,
      message: 'Cédula, nombre de usuario y contraseña temporal son obligatorios'
    });
  }

  try {
    const result = await executeStoredProcedure('sp_crearUsuarioDoctor', {
      cedula,
      username,
      password_temp
    });

    const usuario = result.recordset?.[0] || {};

    res.json({
      success: true,
      message: 'Usuario para doctor creado correctamente',
      data: usuario
    });
  } catch (error) {
    console.error('❌ [crearUsuarioDoctor] Error al crear usuario del doctor:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear usuario del doctor',
      error: error.message
    });
  }
};

// Obtener todos los estatus de cita disponibles
const obtenerEstatusCita = async (req, res) => {
  try {
    console.log('📋 [obtenerEstatusCita] Obteniendo estatus de citas...');
    
    const result = await executeQuery(`
      SELECT 
        id_citaEstatus,
        estatusCita,
        descripcion,
        CASE 
          WHEN id_citaEstatus = 1 THEN 'primary'
          WHEN id_citaEstatus = 2 THEN 'success'
          WHEN id_citaEstatus = 3 THEN 'warning'
          WHEN id_citaEstatus = 4 THEN 'danger'
          WHEN id_citaEstatus = 5 THEN 'secondary'
          WHEN id_citaEstatus = 6 THEN 'info'
          WHEN id_citaEstatus = 7 THEN 'dark'
          ELSE 'light'
        END as color_badge
      FROM CITA_ESTATUS
      ORDER BY id_citaEstatus
    `);
    
    console.log('✅ [obtenerEstatusCita] Estatus obtenidos:', result.recordset?.length || 0);
    res.json({ 
      success: true, 
      data: result.recordset || [] 
    });
  } catch (error) {
    console.error('❌ [obtenerEstatusCita] Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener estatus de citas', 
      error: error.message 
    });
  }
};

// Actualizar estatus de cita con validaciones
const actualizarEstatusCita = async (req, res) => {
  const { folio } = req.params;
  const { nuevo_estatus, motivo_cambio, usuario_responsable } = req.body;

  if (!folio || !nuevo_estatus) {
    return res.status(400).json({
      success: false,
      message: 'Folio y nuevo estatus son obligatorios'
    });
  }

  try {
    console.log(`🔄 [actualizarEstatusCita] Actualizando cita ${folio} a estatus ${nuevo_estatus}`);

    // Primero verificar si la cita existe y obtener su estatus actual
    const citaActual = await executeQuery(`
      SELECT 
        c.folio_cita,
        c.fk_id_citaEstatus as estatus_actual,
        cs.estatusCita as estatus_actual_nombre,
        c.cita_fechahora,
        CASE 
          WHEN c.cita_fechahora > GETDATE() THEN 'FUTURA'
          WHEN c.cita_fechahora < GETDATE() THEN 'PASADA'
          ELSE 'HOY'
        END as tiempo_cita,
        p.CURP,
        CONCAT(p.pac_nombre, ' ', p.pac_paterno, ' ', ISNULL(p.pac_materno, '')) as nombre_paciente
      FROM CITA c
      INNER JOIN CITA_ESTATUS cs ON c.fk_id_citaEstatus = cs.id_citaEstatus
      INNER JOIN PACIENTE p ON c.fk_cita_CURP = p.CURP
      WHERE c.folio_cita = @folio
    `, { folio });

    if (citaActual.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cita no encontrada'
      });
    }

    const cita = citaActual.recordset[0];
    const estatusActual = cita.estatus_actual;
    const nuevoEstatus = parseInt(nuevo_estatus);

    console.log('📋 [actualizarEstatusCita] Información de la cita:', {
      folio,
      estatus_actual: estatusActual,
      nuevo_estatus: nuevoEstatus,
      tiempo_cita: cita.tiempo_cita,
      paciente: cita.nombre_paciente
    });

    // Validaciones de lógica de negocio
    if (estatusActual === nuevoEstatus) {
      return res.status(400).json({
        success: false,
        message: 'La cita ya tiene ese estatus'
      });
    }

    // No se puede cambiar estatus de cita ya atendida (estatus 6)
    if (estatusActual === 6 && nuevoEstatus !== 6) {
      return res.status(400).json({
        success: false,
        message: 'No se puede cambiar el estatus de una cita ya atendida'
      });
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
        requerimientos: {
          tiempo: 'PASADA',
          mensaje: 'Solo se puede marcar como "No Acudió" citas que ya pasaron'
        },
        excluidos: [6], // No si ya fue atendida
        mensaje: 'No se puede marcar como "No Acudió" una cita ya atendida'
      }
    };

    const validacion = validaciones[nuevoEstatus];
    if (validacion) {
      // Verificar estatus permitidos
      if (validacion.permitidos && !validacion.permitidos.includes(estatusActual)) {
        return res.status(400).json({
          success: false,
          message: validacion.mensaje
        });
      }

      // Verificar estatus excluidos
      if (validacion.excluidos && validacion.excluidos.includes(estatusActual)) {
        return res.status(400).json({
          success: false,
          message: validacion.mensaje
        });
      }

      // Verificar requerimientos de tiempo
      if (validacion.requerimientos && validacion.requerimientos.tiempo) {
        if (cita.tiempo_cita !== validacion.requerimientos.tiempo) {
          return res.status(400).json({
            success: false,
            message: validacion.requerimientos.mensaje
          });
        }
      }
    }

    // Ejecutar actualización
    await executeStoredProcedure('sp_actualizarEstatusCita', {
      folio_cita: parseInt(folio),
      nuevo_estatus: nuevoEstatus,
      motivo_cambio: motivo_cambio || null,
      usuario_responsable: usuario_responsable || 'Recepcionista'
    });

    // Obtener nombre del nuevo estatus
    const nuevoEstatusInfo = await executeQuery(`
      SELECT estatusCita 
      FROM CITA_ESTATUS 
      WHERE id_citaEstatus = @nuevo_estatus
    `, { nuevo_estatus: nuevoEstatus });

    const nombreNuevoEstatus = nuevoEstatusInfo.recordset[0]?.estatusCita || 'Desconocido';

    console.log(`✅ [actualizarEstatusCita] Cita ${folio} actualizada de "${cita.estatus_actual_nombre}" a "${nombreNuevoEstatus}"`);

    res.json({
      success: true,
      message: `Cita actualizada correctamente a "${nombreNuevoEstatus}"`,
      data: {
        folio_cita: folio,
        estatus_anterior: {
          id: estatusActual,
          nombre: cita.estatus_actual_nombre
        },
        estatus_nuevo: {
          id: nuevoEstatus,
          nombre: nombreNuevoEstatus
        },
        paciente: cita.nombre_paciente,
        motivo_cambio: motivo_cambio,
        usuario_responsable: usuario_responsable || 'Recepcionista',
        fecha_cambio: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ [actualizarEstatusCita] Error:', error);
    
    // Manejar errores específicos del stored procedure
    if (error.message.includes('No se puede')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al actualizar estatus de cita',
      error: error.message
    });
  }
};

// Obtener historial de cambios de estatus de una cita
const obtenerHistorialCita = async (req, res) => {
  const { folio } = req.params;

  if (!folio) {
    return res.status(400).json({
      success: false,
      message: 'El folio de la cita es obligatorio'
    });
  }

  try {
    console.log(`📋 [obtenerHistorialCita] Obteniendo historial de cita ${folio}`);

    const result = await executeQuery(`
      SELECT 
        b.id_bitacora,
        b.fecha_movimiento,
        b.tipo_movimiento,
        b.descripcion,
        b.usuario_responsable,
        b.detalles_adicionales,
        -- Información de la cita
        c.cita_fechahora,
        CONCAT(p.pac_nombre, ' ', p.pac_paterno, ' ', ISNULL(p.pac_materno, '')) as nombre_paciente,
        CONCAT(e.empleado_nombre, ' ', e.empleado_paterno) as nombre_medico,
        esp.nombre_especialidad
      FROM BITACORA b
      INNER JOIN CITA c ON b.folio_cita = c.folio_cita
      INNER JOIN PACIENTE p ON c.fk_cita_CURP = p.CURP
      INNER JOIN MEDICO m ON c.fk_cedula = m.cedula
      INNER JOIN EMPLEADO e ON m.fk_med_id_empleado = e.id_empleado
      INNER JOIN ESPECIALIDAD esp ON m.fk_id_especialidad = esp.id_especialidad
      WHERE b.folio_cita = @folio
      ORDER BY b.fecha_movimiento DESC
    `, { folio });

    console.log(`✅ [obtenerHistorialCita] ${result.recordset.length} registros encontrados`);

    res.json({
      success: true,
      data: {
        folio_cita: folio,
        historial: result.recordset,
        total_cambios: result.recordset.length
      }
    });

  } catch (error) {
    console.error('❌ [obtenerHistorialCita] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener historial de la cita',
      error: error.message
    });
  }
};

// Función para procesamiento masivo de citas (marcar como "No Acudió" las citas pasadas)
const procesarCitasPasadas = async (req, res) => {
  try {
    console.log('🔄 [procesarCitasPasadas] Procesando citas pasadas...');

    // Obtener citas que ya pasaron y están en estatus "Agendada" o "Pagada"
    const citasPasadas = await executeQuery(`
      SELECT 
        c.folio_cita,
        c.cita_fechahora,
        c.fk_id_citaEstatus,
        cs.estatusCita,
        CONCAT(p.pac_nombre, ' ', p.pac_paterno) as nombre_paciente
      FROM CITA c
      INNER JOIN CITA_ESTATUS cs ON c.fk_id_citaEstatus = cs.id_citaEstatus
      INNER JOIN PACIENTE p ON c.fk_cita_CURP = p.CURP
      WHERE c.cita_fechahora < GETDATE() 
        AND c.fk_id_citaEstatus IN (1, 2) -- Agendada o Pagada
        AND DATEDIFF(hour, c.cita_fechahora, GETDATE()) >= 2 -- Al menos 2 horas después
      ORDER BY c.cita_fechahora
    `);

    const citasParaProcesar = citasPasadas.recordset;
    console.log(`📊 [procesarCitasPasadas] ${citasParaProcesar.length} citas para procesar`);

    if (citasParaProcesar.length === 0) {
      return res.json({
        success: true,
        message: 'No hay citas pasadas para procesar',
        data: {
          citas_procesadas: 0,
          citas: []
        }
      });
    }

    // Procesar cada cita
    const citasProcesadas = [];
    let errores = [];

    for (const cita of citasParaProcesar) {
      try {
        await executeStoredProcedure('sp_actualizarEstatusCita', {
          folio_cita: cita.folio_cita,
          nuevo_estatus: 7, // No Acudió
          motivo_cambio: 'Procesamiento automático - Cita pasada sin atender',
          usuario_responsable: 'Sistema Automático'
        });

        citasProcesadas.push({
          folio: cita.folio_cita,
          paciente: cita.nombre_paciente,
          fecha_hora: cita.cita_fechahora,
          estatus_anterior: cita.estatusCita
        });

        console.log(`✅ Cita ${cita.folio_cita} marcada como "No Acudió"`);
      } catch (error) {
        errores.push({
          folio: cita.folio_cita,
          error: error.message
        });
        console.error(`❌ Error procesando cita ${cita.folio_cita}:`, error.message);
      }
    }

    console.log(`✅ [procesarCitasPasadas] Procesamiento completado: ${citasProcesadas.length} exitosas, ${errores.length} errores`);

    res.json({
      success: true,
      message: `${citasProcesadas.length} citas procesadas correctamente`,
      data: {
        citas_procesadas: citasProcesadas.length,
        citas: citasProcesadas,
        errores: errores
      }
    });

  } catch (error) {
    console.error('❌ [procesarCitasPasadas] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al procesar citas pasadas',
      error: error.message
    });
  }
};

// Obtener estadísticas de citas por estatus
const obtenerEstadisticasCitas = async (req, res) => {
  try {
    console.log('📊 [obtenerEstadisticasCitas] Obteniendo estadísticas...');

    const result = await executeQuery(`
      SELECT 
        cs.id_citaEstatus,
        cs.estatusCita,
        COUNT(c.folio_cita) as total_citas,
        CASE 
          WHEN cs.id_citaEstatus = 1 THEN 'primary'
          WHEN cs.id_citaEstatus = 2 THEN 'success'
          WHEN cs.id_citaEstatus = 3 THEN 'warning'
          WHEN cs.id_citaEstatus = 4 THEN 'danger'
          WHEN cs.id_citaEstatus = 5 THEN 'secondary'
          WHEN cs.id_citaEstatus = 6 THEN 'info'
          WHEN cs.id_citaEstatus = 7 THEN 'dark'
          ELSE 'light'
        END as color_badge
      FROM CITA_ESTATUS cs
      LEFT JOIN CITA c ON cs.id_citaEstatus = c.fk_id_citaEstatus
      GROUP BY cs.id_citaEstatus, cs.estatusCita
      ORDER BY cs.id_citaEstatus
    `);

    // Estadísticas adicionales
    const estadisticasHoy = await executeQuery(`
      SELECT 
        COUNT(*) as citas_hoy,
        SUM(CASE WHEN fk_id_citaEstatus = 1 THEN 1 ELSE 0 END) as agendadas_hoy,
        SUM(CASE WHEN fk_id_citaEstatus = 2 THEN 1 ELSE 0 END) as pagadas_hoy,
        SUM(CASE WHEN fk_id_citaEstatus = 6 THEN 1 ELSE 0 END) as atendidas_hoy
      FROM CITA 
      WHERE CAST(cita_fechahora AS DATE) = CAST(GETDATE() AS DATE)
    `);

    console.log('✅ [obtenerEstadisticasCitas] Estadísticas obtenidas');

    res.json({
      success: true,
      data: {
        por_estatus: result.recordset,
        estadisticas_hoy: estadisticasHoy.recordset[0] || {
          citas_hoy: 0,
          agendadas_hoy: 0,
          pagadas_hoy: 0,
          atendidas_hoy: 0
        }
      }
    });

  } catch (error) {
    console.error('❌ [obtenerEstadisticasCitas] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas de citas',
      error: error.message
    });
  }
};




module.exports = {
  obtenerPacientes,
  actualizarPaciente,
  crearPaciente,
  obtenerDoctores,
  crearDoctor,
  darBajaDoctor,
  obtenerCitas,
  cancelarCita,
  obtenerCobros,
  generarTicket,
  obtenerEspecialidades,
  obtenerConsultorios,
  crearUsuarioDoctor,
  obtenerEstadisticas,

  obtenerEstatusCita,
  actualizarEstatusCita,
  obtenerHistorialCita,
  procesarCitasPasadas,
  obtenerEstadisticasCitas
};
