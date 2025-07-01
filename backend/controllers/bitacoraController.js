// ===============================
// CONTROLLER COMPLETO: bitacoraController.js
// ===============================

const { executeStoredProcedure, executeQuery } = require('../config/database');

// Obtener historial médico de un paciente (para vista del médico)
const obtenerHistorialPaciente = async (req, res) => {
  const { curp } = req.params;
  
  if (!curp) {
    return res.status(400).json({
      success: false,
      message: 'CURP del paciente es obligatorio'
    });
  }

  try {
    console.log('📋 [obtenerHistorialPaciente] Consultando historial para CURP:', curp);
    
    const result = await executeStoredProcedure('sp_obtenerHistorialPaciente', {
      paciente_curp: curp
    });

    console.log('✅ [obtenerHistorialPaciente] Registros encontrados:', result.recordset?.length || 0);
    
    res.json({
      success: true,
      data: result.recordset || [],
      total: result.recordset?.length || 0,
      paciente_curp: curp
    });
  } catch (error) {
    console.error('❌ [obtenerHistorialPaciente] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener historial médico del paciente',
      error: error.message
    });
  }
};

// Obtener movimientos de un médico específico
const obtenerMovimientosMedico = async (req, res) => {
  const { cedula, nombre } = req.query;
  
  if (!cedula && !nombre) {
    return res.status(400).json({
      success: false,
      message: 'Debe proporcionar cédula o nombre del médico'
    });
  }

  try {
    console.log('👨‍⚕️ [obtenerMovimientosMedico] Consultando movimientos:', { cedula, nombre });
    
    const result = await executeStoredProcedure('sp_obtenerMovimientosMedico', {
      medico_cedula: cedula || null,
      medico_nombre: nombre || null
    });

    console.log('✅ [obtenerMovimientosMedico] Movimientos encontrados:', result.recordset?.length || 0);
    
    res.json({
      success: true,
      data: result.recordset || [],
      total: result.recordset?.length || 0,
      filtros: { cedula, nombre }
    });
  } catch (error) {
    console.error('❌ [obtenerMovimientosMedico] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener movimientos del médico',
      error: error.message
    });
  }
};

// Obtener bitácora completa con filtros
const obtenerBitacoraCompleta = async (req, res) => {
  const { 
    tipo_movimiento, 
    tabla_afectada, 
    fecha_inicio, 
    fecha_fin, 
    paciente_curp,
    medico_cedula,
    folio_cita,
    busqueda,
    limit = 100,
    offset = 0
  } = req.query;

  try {
    console.log('📊 [obtenerBitacoraCompleta] Consultando bitácora con filtros:', req.query);
    
    let sql = `
      SELECT 
        b.id_bitacora,
        b.fecha_movimiento,
        b.tipo_movimiento,
        b.tabla_afectada,
        b.descripcion,
        b.usuario_responsable,
        b.paciente_id,
        b.paciente_nombre,
        b.medico_cedula,
        b.medico_nombre,
        b.especialidad,
        b.consultorio,
        b.folio_cita,
        b.id_receta,
        b.diagnostico,
        b.detalles_adicionales
      FROM BITACORA b
      WHERE 1=1
    `;
    
    // Aplicar filtros
    if (tipo_movimiento) {
      sql += ` AND b.tipo_movimiento = '${tipo_movimiento}'`;
    }
    
    if (tabla_afectada) {
      sql += ` AND b.tabla_afectada = '${tabla_afectada}'`;
    }
    
    if (fecha_inicio) {
      sql += ` AND b.fecha_movimiento >= '${fecha_inicio}'`;
    }
    
    if (fecha_fin) {
      sql += ` AND b.fecha_movimiento <= '${fecha_fin}'`;
    }
    
    if (paciente_curp) {
      sql += ` AND b.paciente_id = '${paciente_curp}'`;
    }
    
    if (medico_cedula) {
      sql += ` AND b.medico_cedula = '${medico_cedula}'`;
    }
    
    if (folio_cita) {
      sql += ` AND b.folio_cita = ${folio_cita}`;
    }
    
    if (busqueda) {
      sql += ` AND (
        b.descripcion LIKE '%${busqueda}%' OR 
        b.paciente_nombre LIKE '%${busqueda}%' OR 
        b.medico_nombre LIKE '%${busqueda}%' OR
        b.diagnostico LIKE '%${busqueda}%'
      )`;
    }
    
    sql += ` ORDER BY b.fecha_movimiento DESC`;
    
    if (limit) {
      sql += ` OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY`;
    }

    const result = await executeQuery(sql);

    console.log('✅ [obtenerBitacoraCompleta] Registros encontrados:', result.recordset?.length || 0);
    
    res.json({
      success: true,
      data: result.recordset || [],
      total: result.recordset?.length || 0,
      filtros: req.query,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('❌ [obtenerBitacoraCompleta] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener bitácora completa',
      error: error.message
    });
  }
};

// Obtener estadísticas de la bitácora
const obtenerEstadisticasBitacora = async (req, res) => {
  try {
    console.log('📈 [obtenerEstadisticasBitacora] Consultando estadísticas...');
    
    const sqlEstadisticas = `
      SELECT 
        -- Totales por tipo de movimiento
        SUM(CASE WHEN tipo_movimiento = 'INSERT' THEN 1 ELSE 0 END) as total_inserts,
        SUM(CASE WHEN tipo_movimiento = 'UPDATE' THEN 1 ELSE 0 END) as total_updates,
        SUM(CASE WHEN tipo_movimiento = 'DELETE' THEN 1 ELSE 0 END) as total_deletes,
        
        -- Totales por tabla
        SUM(CASE WHEN tabla_afectada = 'CITA' THEN 1 ELSE 0 END) as movimientos_citas,
        SUM(CASE WHEN tabla_afectada = 'RECETA' THEN 1 ELSE 0 END) as movimientos_recetas,
        SUM(CASE WHEN tabla_afectada = 'MEDICO' THEN 1 ELSE 0 END) as movimientos_medicos,
        SUM(CASE WHEN tabla_afectada = 'PACIENTE' THEN 1 ELSE 0 END) as movimientos_pacientes,
        
        -- Estadísticas generales
        COUNT(*) as total_movimientos,
        COUNT(DISTINCT paciente_id) as pacientes_afectados,
        COUNT(DISTINCT medico_cedula) as medicos_involucrados,
        
        -- Movimientos del día
        SUM(CASE WHEN CAST(fecha_movimiento AS DATE) = CAST(GETDATE() AS DATE) THEN 1 ELSE 0 END) as movimientos_hoy
        
      FROM BITACORA
    `;

    const resultEstadisticas = await executeQuery(sqlEstadisticas);
    
    // Obtener últimos movimientos
    const sqlUltimos = `
      SELECT TOP 5
        fecha_movimiento,
        tipo_movimiento,
        tabla_afectada,
        descripcion,
        paciente_nombre,
        medico_nombre
      FROM BITACORA 
      ORDER BY fecha_movimiento DESC
    `;

    const ultimosMovimientos = await executeQuery(sqlUltimos);

    console.log('✅ [obtenerEstadisticasBitacora] Estadísticas calculadas');
    
    res.json({
      success: true,
      estadisticas: resultEstadisticas.recordset[0] || {},
      ultimos_movimientos: ultimosMovimientos.recordset || []
    });
  } catch (error) {
    console.error('❌ [obtenerEstadisticasBitacora] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas de bitácora',
      error: error.message
    });
  }
};

// Registrar movimiento manual en bitácora
const registrarMovimientoManual = async (req, res) => {
  const {
    tipo_movimiento,
    tabla_afectada,
    descripcion,
    usuario_responsable,
    paciente_curp,
    paciente_nombre,
    medico_cedula,
    medico_nombre,
    especialidad,
    consultorio,
    folio_cita,
    id_receta,
    diagnostico,
    detalles_adicionales
  } = req.body;

  if (!tipo_movimiento || !tabla_afectada || !descripcion) {
    return res.status(400).json({
      success: false,
      message: 'Tipo de movimiento, tabla afectada y descripción son obligatorios'
    });
  }

  try {
    console.log('📝 [registrarMovimientoManual] Registrando movimiento manual:', req.body);
    
    const sql = `
      INSERT INTO BITACORA (
        tipo_movimiento,
        tabla_afectada,
        descripcion,
        usuario_responsable,
        paciente_id,
        paciente_nombre,
        medico_cedula,
        medico_nombre,
        especialidad,
        consultorio,
        folio_cita,
        id_receta,
        diagnostico,
        detalles_adicionales
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await executeQuery(sql, [
      tipo_movimiento,
      tabla_afectada,
      descripcion,
      usuario_responsable || 'Sistema',
      paciente_curp || null,
      paciente_nombre || null,
      medico_cedula || null,
      medico_nombre || null,
      especialidad || null,
      consultorio || null,
      folio_cita || null,
      id_receta || null,
      diagnostico || null,
      detalles_adicionales || null
    ]);

    console.log('✅ [registrarMovimientoManual] Movimiento registrado exitosamente');
    
    res.json({
      success: true,
      message: 'Movimiento registrado exitosamente en la bitácora'
    });
  } catch (error) {
    console.error('❌ [registrarMovimientoManual] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar movimiento en bitácora',
      error: error.message
    });
  }
};

// Obtener resumen de actividad por paciente
const obtenerResumenPaciente = async (req, res) => {
  const { curp } = req.params;
  
  if (!curp) {
    return res.status(400).json({
      success: false,
      message: 'CURP del paciente es obligatorio'
    });
  }

  try {
    console.log('👤 [obtenerResumenPaciente] Obteniendo resumen para:', curp);
    
    const sql = `
      SELECT 
        paciente_nombre,
        COUNT(*) as total_movimientos,
        COUNT(DISTINCT medico_cedula) as medicos_diferentes,
        COUNT(DISTINCT folio_cita) as citas_registradas,
        COUNT(CASE WHEN id_receta IS NOT NULL THEN 1 END) as recetas_generadas,
        MAX(fecha_movimiento) as ultimo_movimiento,
        MIN(fecha_movimiento) as primer_movimiento
      FROM BITACORA
      WHERE paciente_id = ?
      GROUP BY paciente_nombre
    `;

    const result = await executeQuery(sql, [curp]);
    
    res.json({
      success: true,
      data: result.recordset[0] || null,
      paciente_curp: curp
    });
  } catch (error) {
    console.error('❌ [obtenerResumenPaciente] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener resumen del paciente',
      error: error.message
    });
  }
};

// Obtener movimientos por rango de fechas
const obtenerMovimientosPorFecha = async (req, res) => {
  const { fecha_inicio, fecha_fin } = req.query;
  
  if (!fecha_inicio || !fecha_fin) {
    return res.status(400).json({
      success: false,
      message: 'Fecha de inicio y fecha de fin son obligatorias'
    });
  }

  try {
    console.log('📅 [obtenerMovimientosPorFecha] Rango:', { fecha_inicio, fecha_fin });
    
    const sql = `
      SELECT 
        CAST(fecha_movimiento AS DATE) as fecha,
        tipo_movimiento,
        tabla_afectada,
        COUNT(*) as cantidad
      FROM BITACORA
      WHERE fecha_movimiento >= ? AND fecha_movimiento <= ?
      GROUP BY CAST(fecha_movimiento AS DATE), tipo_movimiento, tabla_afectada
      ORDER BY fecha DESC, tipo_movimiento, tabla_afectada
    `;

    const result = await executeQuery(sql, [fecha_inicio, fecha_fin]);
    
    res.json({
      success: true,
      data: result.recordset || [],
      periodo: { fecha_inicio, fecha_fin }
    });
  } catch (error) {
    console.error('❌ [obtenerMovimientosPorFecha] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener movimientos por fecha',
      error: error.message
    });
  }
};

// Limpiar bitácora antigua (opcional - para mantenimiento)
const limpiarBitacoraAntigua = async (req, res) => {
  const { dias_antiguedad = 365 } = req.body;

  try {
    console.log('🧹 [limpiarBitacoraAntigua] Limpiando registros anteriores a:', dias_antiguedad, 'días');
    
    const sql = `
      DELETE FROM BITACORA 
      WHERE fecha_movimiento < DATEADD(day, -?, GETDATE())
    `;

    const result = await executeQuery(sql, [dias_antiguedad]);
    
    console.log('✅ [limpiarBitacoraAntigua] Registros eliminados:', result.rowsAffected);
    
    res.json({
      success: true,
      message: `Bitácora limpiada exitosamente`,
      registros_eliminados: result.rowsAffected || 0,
      dias_antiguedad
    });
  } catch (error) {
    console.error('❌ [limpiarBitacoraAntigua] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al limpiar bitácora antigua',
      error: error.message
    });
  }
};

module.exports = {
  obtenerHistorialPaciente,
  obtenerMovimientosMedico,
  obtenerBitacoraCompleta,
  obtenerEstadisticasBitacora,
  registrarMovimientoManual,
  obtenerResumenPaciente,
  obtenerMovimientosPorFecha,
  limpiarBitacoraAntigua
};