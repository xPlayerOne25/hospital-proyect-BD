const { executeQuery, executeStoredProcedure } = require('../config/database');
const jwt = require('jsonwebtoken');

// Obtener especialidades disponibles
const getEspecialidades = async (req, res) => {
  try {
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
    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error('Error al obtener especialidades:', error);
    res.status(500).json({ success: false, message: 'Error al obtener especialidades' });
  }
};

// Generar cita médica
const generarCita = async (req, res) => {
  try {
    const { paciente_curp, medico_cedula, fecha, hora, especialidad_id } = req.body;

    if (!paciente_curp || !medico_cedula || !fecha || !hora || !especialidad_id) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son requeridos'
      });
    }

    // Ejecutar el SP
    const result = await executeStoredProcedure('sp_agendarCitaCompleta', {
      curp: paciente_curp,
      cedula: medico_cedula,
      fecha,
      hora,
      especialidad_id
    });

    console.log('✅ Resultado SP:', result);

    const data = result.recordset?.[0];

    if (!data || Object.keys(data).length === 0) {
      return res.status(500).json({
        success: false,
        message: 'La cita fue registrada, pero no se obtuvo el comprobante. Verifica que el SP incluya el SELECT final correctamente.'
      });
    }

    // Éxito
    res.status(201).json({
      success: true,
      message: '✅ Cita generada exitosamente',
      data: {
        folio: data.folio_cita,
        nombre_paciente: data.nombre_paciente,
        especialidad: data.nombre_especialidad,
        fecha_hora: data.cita_fechahora,
        consultorio: data.consultorio_numero,
        medico: data.nombre_medico,
        costo: data.pago_cantidadTotal
      }
    });

  } catch (error) {
    const sqlMessage = error.originalError?.info?.message || error.message;
    console.error('❌ Error al generar cita:', sqlMessage);
    res.status(400).json({
      success: false,
      message: `❌ Error al generar la cita: ${sqlMessage}`
    });
  }
};

// Actualizar estatus de cita
const actualizarEstatusCita = async (req, res) => {
  try {
    const { folio_cita } = req.params;
    const { nuevo_estatus } = req.body;

    const result = await executeStoredProcedure('SP_ActualizarEstatusCita', {
      folio_cita: parseInt(folio_cita),
      nuevo_estatus: parseInt(nuevo_estatus)
    });

    res.json({
      success: true,
      message: 'Estatus de cita actualizado correctamente',
      data: { folio_cita, nuevo_estatus }
    });
  } catch (error) {
    console.error('Error al actualizar estatus:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar estatus de cita',
      error: error.message
    });
  }
};

// Obtener médicos por especialidad
const getMedicosByEspecialidad = async (req, res) => {
  try {
    const { especialidadId } = req.params;

    const query = `
      SELECT 
        m.cedula,
        e.empleado_nombre + ' ' + e.empleado_paterno AS nombre_completo,
        esp.nombre_especialidad,
        c.consultorio_numero
      FROM MEDICO m
      INNER JOIN EMPLEADO e ON m.fk_med_id_empleado = e.id_empleado
      INNER JOIN ESPECIALIDAD esp ON m.fk_id_especialidad = esp.id_especialidad
      INNER JOIN CONSULTORIO c ON m.fk_id_consultorio = c.id_consultorio
      WHERE esp.id_especialidad = @especialidadId
      ORDER BY e.empleado_nombre
    `;

    const result = await executeQuery(query, { especialidadId });

    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error('Error al obtener médicos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener médicos'
    });
  }
};

// Obtener citas del paciente autenticado
const getCitasPaciente = async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      return res.status(401).json({ success: false, message: 'Token no proporcionado' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const paciente_curp = decoded.userInfo?.CURP;

    if (!paciente_curp) {
      return res.status(403).json({ success: false, message: 'CURP no encontrado en el token' });
    }

    const query = `
      SELECT 
        c.folio_cita,
        c.cita_fechahora,
        e.empleado_nombre + ' ' + e.empleado_paterno + ' ' + ISNULL(e.empleado_materno, '') AS nombre_medico,
        esp.nombre_especialidad,
        cons.consultorio_numero,
        c.fk_id_citaEstatus as id_citaEstatus,
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
          WHEN c.cita_fechahora < GETDATE() AND c.fk_id_citaEstatus = 3 THEN 'Completada'
          WHEN c.cita_fechahora < GETDATE() AND c.fk_id_citaEstatus != 3 THEN 'Perdida'
          ELSE 'Programada'
        END as estado_cita
      FROM CITA c
      INNER JOIN MEDICO m ON c.fk_cedula = m.cedula
      INNER JOIN EMPLEADO e ON m.fk_med_id_empleado = e.id_empleado
      INNER JOIN ESPECIALIDAD esp ON m.fk_id_especialidad = esp.id_especialidad
      INNER JOIN CONSULTORIO cons ON m.fk_id_consultorio = cons.id_consultorio
      INNER JOIN PAGO_CITA pc ON c.id_pago = pc.id_pago
      WHERE c.fk_cita_CURP = @paciente_curp
      ORDER BY c.cita_fechahora DESC
    `;

    const result = await executeQuery(query, { paciente_curp });

    const citasFormateadas = result.recordset.map(cita => {
      let citaestatus_descripcion = 'Desconocido';
      switch (cita.id_citaEstatus) {
        case 1: citaestatus_descripcion = 'Agendada'; break;
        case 2: citaestatus_descripcion = 'En Proceso'; break;
        case 3: citaestatus_descripcion = 'Completada'; break;
        case 4: citaestatus_descripcion = 'Cancelada'; break;
      }

      return {
        ...cita,
        citaestatus_descripcion,
        fecha_formateada: new Date(cita.cita_fechahora).toLocaleDateString('es-MX'),
        hora_formateada: new Date(cita.cita_fechahora).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
        puede_cancelar: new Date(cita.cita_fechahora) > new Date() && cita.id_citaEstatus === 1
      };
    });

    res.json({ success: true, data: citasFormateadas, total: citasFormateadas.length });

  } catch (error) {
    console.error('💥 Error en getCitasPaciente:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener las citas del paciente',
      error: error.message
    });
  }
};

module.exports = {
  getEspecialidades,
  getMedicosByEspecialidad,
  generarCita,
  actualizarEstatusCita,
  getCitasPaciente
};
