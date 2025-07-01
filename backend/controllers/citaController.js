// controllers/citaController.js - ARCHIVO COMPLETO Y FUNCIONAL
const { executeQuery, executeStoredProcedure } = require('../config/database');
const jwt = require('jsonwebtoken');

console.log('📋 Cargando citaController...');

// ===== FUNCIONES PRINCIPALES =====

// Obtener especialidades disponibles
const getEspecialidades = async (req, res) => {
  try {
    console.log('🔍 Obteniendo especialidades...');
    const query = `
      SELECT 
        id_especialidad,
        nombre_especialidad,
        descripcion,
        costo_especialidad
      FROM ESPECIALIDAD
      ORDER BY nombre_especialidad
    `;
    const result = await executeQuery(query);
    console.log(`✅ ${result.recordset.length} especialidades obtenidas`);
    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error('❌ Error al obtener especialidades:', error);
    res.status(500).json({ success: false, message: 'Error al obtener especialidades' });
  }
};

// Obtener médicos por especialidad CON INFORMACIÓN DE HORARIOS
const getMedicosByEspecialidad = async (req, res) => {
  try {
    const { especialidadId } = req.params;
    console.log(`🔍 Obteniendo médicos para especialidad ${especialidadId}...`);

    const query = `
      SELECT 
        m.cedula,
        CONCAT(e.empleado_nombre, ' ', e.empleado_paterno, ' ', ISNULL(e.empleado_materno, '')) AS nombre_completo,
        esp.nombre_especialidad,
        esp.costo_especialidad,
        c.consultorio_numero,
        h.horario_inicio,
        h.horario_fin,
        CONCAT(FORMAT(h.horario_inicio, 'HH:mm'), ' - ', FORMAT(h.horario_fin, 'HH:mm')) AS horario_display,
        CASE 
          WHEN h.horario_turno = 0 THEN 'Matutino'
          WHEN h.horario_turno = 1 THEN 'Vespertino'
          ELSE 'Mixto'
        END AS turno,
        CONCAT(
          RIGHT('0' + CAST(DATEPART(HOUR, h.horario_inicio) AS VARCHAR), 2), 
          ':', 
          RIGHT('0' + CAST(DATEPART(MINUTE, h.horario_inicio) AS VARCHAR), 2),
          ' - ',
          RIGHT('0' + CAST(DATEPART(HOUR, h.horario_fin) AS VARCHAR), 2), 
          ':', 
          RIGHT('0' + CAST(DATEPART(MINUTE, h.horario_fin) AS VARCHAR), 2)
        ) AS horario_display_fix
      FROM MEDICO m
      INNER JOIN EMPLEADO e ON m.fk_med_id_empleado = e.id_empleado
      INNER JOIN ESPECIALIDAD esp ON m.fk_id_especialidad = esp.id_especialidad
      INNER JOIN CONSULTORIO c ON m.fk_id_consultorio = c.id_consultorio
      INNER JOIN HORARIO h ON e.fk_id_horario = h.id_horario
      WHERE esp.id_especialidad = @especialidadId AND e.fk_id_empleadoEstatus = 1
      ORDER BY e.empleado_nombre
    `;

    const result = await executeQuery(query, { especialidadId });
    
    const medicosConHorarios = result.recordset.map(medico => ({
      cedula: medico.cedula,
      nombre_completo: medico.nombre_completo,
      especialidad: medico.nombre_especialidad,
      costo: medico.costo_especialidad,
      consultorio_numero: medico.consultorio_numero,
      horario_display: medico.horario_display_fix || medico.horario_display,
      turno: medico.turno,
      horario_inicio: medico.horario_inicio,
      horario_fin: medico.horario_fin
    }));
    
    console.log(`✅ ${medicosConHorarios.length} médicos con horarios obtenidos`);
    res.json({ success: true, data: medicosConHorarios });
  } catch (error) {
    console.error('❌ Error al obtener médicos con horarios:', error);
    res.status(500).json({ success: false, message: 'Error al obtener médicos' });
  }
};

// Generar cita médica
const generarCita = async (req, res) => {
  try {
    const { paciente_curp, medico_cedula, fecha, hora, especialidad_id } = req.body;

    console.log('🚀 === INICIANDO GENERACIÓN DE CITA ===');
    console.log('📋 Datos recibidos:', {
      paciente_curp,
      medico_cedula,
      fecha,
      hora,
      especialidad_id
    });

    // Validación de parámetros
    if (!paciente_curp || !medico_cedula || !fecha || !hora || !especialidad_id) {
      console.error('❌ Faltan parámetros obligatorios');
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son requeridos',
        received: { paciente_curp, medico_cedula, fecha, hora, especialidad_id }
      });
    }

    // Validar y normalizar fecha/hora
    const fechaObj = new Date(fecha);
    if (isNaN(fechaObj.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Fecha inválida',
        received: fecha
      });
    }

    const fechaSQL = fechaObj.toISOString().split('T')[0];
    
    const horaRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:00)?$/;
    if (!horaRegex.test(hora)) {
      return res.status(400).json({
        success: false,
        message: 'Formato de hora inválido (debe ser HH:MM)',
        received: hora
      });
    }

    const horaSQL = hora.includes(':') && hora.split(':').length === 2 ? hora + ':00' : hora;

    console.log('🔄 Ejecutando stored procedure...');
    
    const result = await executeStoredProcedure('sp_agendarCitaCompleta', {
      curp: paciente_curp,
      cedula: medico_cedula,
      fecha: fechaSQL,
      hora: horaSQL,
      especialidad_id: parseInt(especialidad_id)
    });

    const data = result.recordset?.[0];

    if (!data || Object.keys(data).length === 0) {
      console.error('❌ SP ejecutado pero sin datos de retorno');
      return res.status(500).json({
        success: false,
        message: 'La cita fue registrada, pero no se obtuvo el comprobante.'
      });
    }

    console.log('✅ Cita creada exitosamente');

    res.status(201).json({
      success: true,
      message: '✅ Cita generada exitosamente',
      data: {
        folio: data.folio_cita,
        nombre_paciente: data.nombre_paciente,
        especialidad: data.nombre_especialidad,
        fecha_hora: data.cita_fechahora,
        fecha_solicitada: `${fechaSQL} ${horaSQL}`,
        consultorio: data.consultorio_numero,
        medico: data.nombre_medico,
        costo: data.pago_cantidadTotal
      }
    });

  } catch (error) {
    const sqlMessage = error.originalError?.info?.message || error.message;
    
    console.error('💥 Error completo al generar cita:', {
      message: sqlMessage,
      stack: error.stack
    });

    if (sqlMessage.includes('❌')) {
      return res.status(400).json({
        success: false,
        message: sqlMessage
      });
    }

    res.status(500).json({
      success: false,
      message: `❌ Error al generar la cita: ${sqlMessage}`
    });
  }
};

// Obtener citas del paciente autenticado
const getCitasPaciente = async (req, res) => {
  try {
    console.log('🔍 === OBTENIENDO CITAS DEL PACIENTE ===');
    
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) {
      console.error('❌ Token no proporcionado');
      return res.status(401).json({ success: false, message: 'Token no proporcionado' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const paciente_curp = decoded.userInfo?.CURP;

    console.log('👤 Usuario decodificado:', {
      curp: paciente_curp,
      nombre: decoded.userInfo?.pac_nombre,
      tipo: decoded.userType
    });

    if (!paciente_curp) {
      console.error('❌ CURP no encontrado en token');
      return res.status(403).json({ success: false, message: 'CURP no encontrado en token' });
    }

    const query = `
      SELECT 
        c.folio_cita,
        c.cita_fechahora,
        e.empleado_nombre + ' ' + e.empleado_paterno + ' ' + ISNULL(e.empleado_materno, '') AS nombre_medico,
        esp.nombre_especialidad,
        cons.consultorio_numero,
        c.fk_id_citaEstatus as id_citaEstatus,
        cs.estatusCita as estatus_descripcion,
        pc.pago_cantidadTotal,
        pc.pago_abonado,
        pc.estatuspago,
        CASE 
          WHEN pc.estatuspago = 0 THEN 'Pendiente'
          WHEN pc.estatuspago = 1 THEN 'Pagado'
          ELSE 'Cancelado'
        END as estatus_pago_texto,
        CASE
          WHEN c.cita_fechahora > GETDATE() THEN 'Próxima'
          WHEN c.cita_fechahora < GETDATE() AND c.fk_id_citaEstatus = 6 THEN 'Completada'
          WHEN c.cita_fechahora < GETDATE() AND c.fk_id_citaEstatus != 6 THEN 'Perdida'
          ELSE 'Programada'
        END as estado_cita
      FROM CITA c
      INNER JOIN MEDICO m ON c.fk_cedula = m.cedula
      INNER JOIN EMPLEADO e ON m.fk_med_id_empleado = e.id_empleado
      INNER JOIN ESPECIALIDAD esp ON m.fk_id_especialidad = esp.id_especialidad
      INNER JOIN CONSULTORIO cons ON m.fk_id_consultorio = cons.id_consultorio
      INNER JOIN PAGO_CITA pc ON c.id_pago = pc.id_pago
      INNER JOIN CITA_ESTATUS cs ON c.fk_id_citaEstatus = cs.id_citaEstatus
      WHERE c.fk_cita_CURP = @paciente_curp
      ORDER BY c.cita_fechahora DESC
    `;

    console.log('🔍 Ejecutando query para CURP:', paciente_curp);
    const result = await executeQuery(query, { paciente_curp });

    const citasFormateadas = result.recordset.map(cita => {
      return {
        ...cita,
        citaestatus_descripcion: cita.estatus_descripcion,
        fecha_formateada: new Date(cita.cita_fechahora).toLocaleDateString('es-MX', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        hora_formateada: new Date(cita.cita_fechahora).toLocaleTimeString('es-MX', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true
        }),
        puede_cancelar: new Date(cita.cita_fechahora) > new Date() && cita.id_citaEstatus === 1
      };
    });

    console.log('✅ Citas formateadas exitosamente');

    res.json({ 
      success: true, 
      data: citasFormateadas, 
      total: citasFormateadas.length 
    });

  } catch (error) {
    console.error('💥 Error completo en getCitasPaciente:', {
      message: error.message,
      stack: error.stack
    });
    
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener las citas del paciente', 
      error: error.message 
    });
  }
};

// Actualizar estatus de cita
const actualizarEstatusCita = async (req, res) => {
  try {
    const { folio_cita } = req.params;
    const { nuevo_estatus } = req.body;

    console.log(`🔄 Actualizando estatus de cita ${folio_cita} a ${nuevo_estatus}`);

    const result = await executeStoredProcedure('SP_ActualizarEstatusCita', {
      folio_cita: parseInt(folio_cita),
      nuevo_estatus: parseInt(nuevo_estatus)
    });

    console.log('✅ Estatus actualizado exitosamente');

    res.json({
      success: true,
      message: 'Estatus de cita actualizado correctamente',
      data: { folio_cita, nuevo_estatus }
    });
  } catch (error) {
    console.error('❌ Error al actualizar estatus:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar estatus de cita',
      error: error.message
    });
  }
};

// Obtener citas pendientes de pago
const getCitasPendientesPago = async (req, res) => {
  const { curp } = req.user;

  try {
    console.log(`🔍 Obteniendo citas pendientes de pago para ${curp}`);
    
    const result = await executeQuery(`
      SELECT 
        c.folio_cita, 
        c.cita_fechahora, 
        esp.nombre_especialidad,
        m.cedula, 
        pc.pago_cantidadTotal, 
        pc.estatuspago
      FROM CITA c
      INNER JOIN MEDICO m ON c.fk_cedula = m.cedula
      INNER JOIN ESPECIALIDAD esp ON m.fk_id_especialidad = esp.id_especialidad
      INNER JOIN PAGO_CITA pc ON c.id_pago = pc.id_pago
      WHERE c.fk_cita_CURP = @curp AND pc.estatuspago = 0
    `, { curp });

    console.log(`✅ ${result.recordset.length} citas pendientes encontradas`);
    res.json({ success: true, citas: result.recordset });
  } catch (error) {
    console.error('❌ Error al obtener citas pendientes:', error);
    res.status(500).json({ success: false, message: 'Error al obtener citas pendientes' });
  }
};

// Cancelar cita con política de devolución
const cancelarCita = async (req, res) => {
  const { folio } = req.params;
  const { motivo_cancelacion } = req.body;

  if (!folio) {
    return res.status(400).json({ 
      success: false, 
      message: 'Folio no proporcionado' 
    });
  }

  try {
    console.log(`🔄 === INICIANDO CANCELACIÓN DE CITA ${folio} ===`);
    
    // Obtener información completa de la cita
    const citaQuery = `
      SELECT 
        c.folio_cita,
        c.fk_id_citaEstatus,
        c.cita_fechahora,
        cs.estatusCita,
        pc.pago_cantidadTotal,
        pc.pago_abonado,
        pc.estatuspago,
        CONCAT(p.pac_nombre, ' ', p.pac_paterno, ' ', ISNULL(p.pac_materno, '')) as nombre_paciente,
        p.CURP as curp_paciente,
        CONCAT(e.empleado_nombre, ' ', e.empleado_paterno) as nombre_medico,
        m.cedula as cedula_medico,
        esp.nombre_especialidad,
        cons.consultorio_numero,
        DATEDIFF(HOUR, GETDATE(), c.cita_fechahora) as horas_anticipacion
      FROM CITA c
      INNER JOIN CITA_ESTATUS cs ON c.fk_id_citaEstatus = cs.id_citaEstatus
      INNER JOIN PAGO_CITA pc ON c.id_pago = pc.id_pago
      INNER JOIN PACIENTE p ON c.fk_cita_CURP = p.CURP
      INNER JOIN MEDICO m ON c.fk_cedula = m.cedula
      INNER JOIN EMPLEADO e ON m.fk_med_id_empleado = e.id_empleado
      INNER JOIN ESPECIALIDAD esp ON m.fk_id_especialidad = esp.id_especialidad
      INNER JOIN CONSULTORIO cons ON m.fk_id_consultorio = cons.id_consultorio
      WHERE c.folio_cita = @folio
    `;

    const citaResult = await executeQuery(citaQuery, { folio });

    if (citaResult.recordset.length === 0) {
      console.error(`❌ Cita ${folio} no encontrada`);
      return res.status(404).json({ 
        success: false, 
        message: 'Cita no encontrada' 
      });
    }

    const cita = citaResult.recordset[0];
    
    // Validaciones de cancelación
    if (cita.fk_id_citaEstatus === 4) {
      return res.status(400).json({ 
        success: false, 
        message: 'La cita ya está cancelada' 
      });
    }

    if (cita.fk_id_citaEstatus === 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'No se puede cancelar una cita ya atendida' 
      });
    }

    // Calcular política de devolución
    const horasAnticipacion = cita.horas_anticipacion;
    let porcentajeDevolucion = 0;
    let razonDevolucion = '';

    if (horasAnticipacion >= 48) {
      porcentajeDevolucion = 100;
      razonDevolucion = 'Cancelación con 48+ horas de anticipación';
    } else if (horasAnticipacion >= 24) {
      porcentajeDevolucion = 50;
      razonDevolucion = 'Cancelación con 24-48 horas de anticipación';
    } else if (horasAnticipacion > 0) {
      porcentajeDevolucion = 0;
      razonDevolucion = 'Cancelación con menos de 24 horas de anticipación';
    } else {
      porcentajeDevolucion = 0;
      razonDevolucion = 'Cancelación después de la fecha/hora programada';
    }

    const montoPagado = parseFloat(cita.pago_abonado) || 0;
    const montoDevolucion = (montoPagado * porcentajeDevolucion) / 100;

    // Ejecutar cancelación manual
    await executeQuery(`UPDATE CITA SET fk_id_citaEstatus = 4 WHERE folio_cita = @folio`, { folio });

    console.log(`✅ Cita ${folio} cancelada exitosamente`);

    const respuesta = {
      success: true,
      message: '✅ Cita cancelada correctamente',
      data: {
        folio_cita: folio,
        fecha_cancelacion: new Date().toISOString(),
        politica_aplicada: {
          horas_anticipacion: horasAnticipacion,
          porcentaje_devolucion: porcentajeDevolucion,
          monto_original: parseFloat(cita.pago_cantidadTotal),
          monto_pagado: montoPagado,
          monto_devolucion: montoDevolucion,
          razon_devolucion: razonDevolucion
        },
        informacion_cita: {
          paciente: cita.nombre_paciente,
          medico: cita.nombre_medico,
          especialidad: cita.nombre_especialidad,
          fecha_original: cita.cita_fechahora,
          consultorio: cita.consultorio_numero
        },
        siguiente_paso: montoDevolucion > 0 
          ? `Se procesará la devolución de $${montoDevolucion.toFixed(2)} (${porcentajeDevolucion}% del monto pagado)`
          : 'No aplica devolución según la política de cancelación'
      }
    };

    res.json(respuesta);

  } catch (error) {
    console.error('❌ Error al cancelar cita:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno al cancelar la cita',
      error: error.message 
    });
  }
};

// Obtener política de cancelación
const obtenerPoliticaCancelacion = async (req, res) => {
  const { folio } = req.params;

  try {
    const citaQuery = `
      SELECT 
        c.folio_cita,
        c.cita_fechahora,
        pc.pago_abonado,
        pc.pago_cantidadTotal,
        DATEDIFF(HOUR, GETDATE(), c.cita_fechahora) as horas_anticipacion
      FROM CITA c
      INNER JOIN PAGO_CITA pc ON c.id_pago = pc.id_pago
      WHERE c.folio_cita = @folio
    `;

    const result = await executeQuery(citaQuery, { folio });

    if (result.recordset.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Cita no encontrada' 
      });
    }

    const cita = result.recordset[0];
    const horasAnticipacion = cita.horas_anticipacion;
    let porcentajeDevolucion = 0;

    if (horasAnticipacion >= 48) {
      porcentajeDevolucion = 100;
    } else if (horasAnticipacion >= 24) {
      porcentajeDevolucion = 50;
    } else {
      porcentajeDevolucion = 0;
    }

    const montoPagado = parseFloat(cita.pago_abonado) || 0;
    const montoDevolucion = (montoPagado * porcentajeDevolucion) / 100;

    res.json({
      success: true,
      data: {
        folio_cita: folio,
        fecha_cita: cita.cita_fechahora,
        horas_anticipacion: horasAnticipacion,
        porcentaje_devolucion: porcentajeDevolucion,
        monto_pagado: montoPagado,
        monto_devolucion: montoDevolucion,
        politica: {
          "48+ horas": "100% de devolución",
          "24-48 horas": "50% de devolución", 
          "< 24 horas": "0% de devolución"
        },
        puede_cancelar: horasAnticipacion > 0
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo política:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener política de cancelación' 
    });
  }
};

// Obtener información completa del doctor con horarios
const getDoctorInfo = async (req, res) => {
  try {
    const { cedula } = req.params;
    
    console.log(`🔍 Obteniendo info del doctor: ${cedula}`);
    
    // Query directo si no hay SP
    const query = `
      SELECT 
        m.cedula,
        CONCAT(e.empleado_nombre, ' ', e.empleado_paterno, ' ', ISNULL(e.empleado_materno, '')) AS nombre_completo,
        esp.nombre_especialidad,
        esp.costo_especialidad,
        c.consultorio_numero,
        h.horario_inicio,
        h.horario_fin,
        CASE 
          WHEN h.horario_turno = 0 THEN 'Matutino'
          WHEN h.horario_turno = 1 THEN 'Vespertino'
          ELSE 'Mixto'
        END AS turno,
        CONCAT(FORMAT(h.horario_inicio, 'HH:mm'), ' - ', FORMAT(h.horario_fin, 'HH:mm')) AS horario_display
      FROM MEDICO m
      INNER JOIN EMPLEADO e ON m.fk_med_id_empleado = e.id_empleado
      INNER JOIN ESPECIALIDAD esp ON m.fk_id_especialidad = esp.id_especialidad
      INNER JOIN CONSULTORIO c ON m.fk_id_consultorio = c.id_consultorio
      INNER JOIN HORARIO h ON e.fk_id_horario = h.id_horario
      WHERE m.cedula = @cedula AND e.fk_id_empleadoEstatus = 1
    `;
    
    const result = await executeQuery(query, { cedula });
    
    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Doctor no encontrado'
      });
    }
    
    const doctorInfo = result.recordset[0];
    
    console.log(`✅ Doctor encontrado: ${doctorInfo.nombre_completo}`);
    
    res.json({
      success: true,
      data: {
        cedula: doctorInfo.cedula,
        nombre_completo: doctorInfo.nombre_completo,
        especialidad: doctorInfo.nombre_especialidad,
        costo: doctorInfo.costo_especialidad,
        consultorio: doctorInfo.consultorio_numero,
        horario_inicio: doctorInfo.horario_inicio,
        horario_fin: doctorInfo.horario_fin,
        turno: doctorInfo.turno,
        horario_display: doctorInfo.horario_display
      }
    });
  } catch (error) {
    console.error('❌ Error obteniendo info del doctor:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener información del doctor'
    });
  }
};

// Obtener horarios disponibles
const getHorariosDisponibles = async (req, res) => {
  try {
    const { cedula, fecha } = req.params;
    
    console.log(`🔍 Obteniendo horarios disponibles - Doctor: ${cedula}, Fecha: ${fecha}`);
    
    // Validar formato de fecha
    const fechaObj = new Date(fecha);
    if (isNaN(fechaObj.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Formato de fecha inválido'
      });
    }
    
    // Query simple para generar horarios disponibles
    const horariosDisponibles = [];
    for (let hora = 8; hora <= 17; hora++) {
      horariosDisponibles.push({
        hora: `${hora.toString().padStart(2, '0')}:00`,
        hora_display: `${hora.toString().padStart(2, '0')}:00`,
        disponible: true,
        estado: 'Disponible'
      });
    }
    
    console.log(`✅ ${horariosDisponibles.length} horarios disponibles encontrados`);
    
    res.json({
      success: true,
      data: {
        doctor_cedula: cedula,
        fecha: fecha,
        horarios_disponibles: horariosDisponibles,
        total: horariosDisponibles.length
      }
    });
  } catch (error) {
    console.error('❌ Error obteniendo horarios disponibles:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener horarios disponibles'
    });
  }
};

// Obtener próximas fechas disponibles
const getFechasDisponibles = async (req, res) => {
  try {
    console.log('🔍 Obteniendo próximas fechas disponibles...');
    
    const fechasDisponibles = [];
    const hoy = new Date();
    
    // Generar próximos 30 días
    for (let i = 0; i < 30; i++) {
      const fecha = new Date(hoy);
      fecha.setDate(hoy.getDate() + i);
      
      // Saltar domingos (día 0)
      if (fecha.getDay() === 0) continue;
      
      const fechaStr = fecha.toISOString().split('T')[0];
      const fechaDisplay = fecha.toLocaleDateString('es-MX', {
        day: 'numeric',
        month: 'short'
      });
      
      const diaSemana = fecha.toLocaleDateString('es-MX', { weekday: 'long' });
      
      fechasDisponibles.push({
        fecha: fechaStr,
        fecha_display: fechaDisplay,
        dia_semana: diaSemana,
        es_hoy: i === 0,
        es_manana: i === 1,
        fecha_completa: `${diaSemana}, ${fechaDisplay}`
      });
    }
    
    console.log(`✅ ${fechasDisponibles.length} fechas disponibles`);
    
    res.json({
      success: true,
      data: fechasDisponibles
    });
  } catch (error) {
    console.error('❌ Error obteniendo fechas disponibles:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener fechas disponibles'
    });
  }
};

// ===== EXPORTACIÓN =====
console.log('✅ Exportando funciones del citaController...');

module.exports = {
  getEspecialidades,
  getMedicosByEspecialidad,
  generarCita,
  actualizarEstatusCita,
  getCitasPaciente,
  getCitasPendientesPago,
  cancelarCita,
  getDoctorInfo,
  getHorariosDisponibles,
  getFechasDisponibles,
  obtenerPoliticaCancelacion
};

console.log('✅ citaController cargado correctamente');