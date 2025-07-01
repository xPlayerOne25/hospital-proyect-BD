//backend/controllers/medicoController.js
const { executeStoredProcedure, executeQuery, sql, getConnection } = require('../config/database');

// ===============================
// GESTIÓN DE PERFIL MÉDICO
// ===============================

// Obtener datos del médico
const obtenerPerfilMedico = async (req, res) => {
  const { cedula } = req.params;

  console.log(`🔍 [obtenerPerfilMedico] Iniciando con cédula: ${cedula}`);

  if (!cedula) {
    console.log('❌ [obtenerPerfilMedico] Cédula faltante');
    return res.status(400).json({ 
      success: false, 
      message: 'Cédula del médico es obligatoria' 
    });
  }

  try {
    console.log(`🔄 [obtenerPerfilMedico] Ejecutando SP para médico: ${cedula}`);
    
    // Intentar con SP primero
    try {
      const result = await executeStoredProcedure('sp_obtenerPerfilMedico', { cedula });
      console.log(`✅ [obtenerPerfilMedico] SP ejecutado exitosamente:`, result.recordset);
      
      if (!result.recordset.length) {
        console.log(`❌ [obtenerPerfilMedico] Sin datos en recordset para cédula: ${cedula}`);
        return res.status(404).json({ 
          success: false, 
          message: 'Médico no encontrado' 
        });
      }

      console.log(`✅ [obtenerPerfilMedico] Perfil del médico ${cedula} obtenido correctamente`);
      res.json({ success: true, data: result.recordset[0] });
    } catch (spError) {
      console.log(`⚠️ [obtenerPerfilMedico] SP falló, usando query directa:`, spError.message);
      
      // Query directa SIN parámetros ? para SQL Server
      const cedulaEscapada = cedula.replace(/'/g, "''");
      const verificacionQuery = `
        SELECT TOP 1 
          emp.empleado_nombre,
          emp.empleado_paterno,
          emp.empleado_materno,
          emp.empleado_CURP,
          emp.empleado_tel,
          emp.empleado_correo,
          m.cedula,
          e.nombre_especialidad,
          con.consultorio_numero,
          'Activo' as estatus
        FROM EMPLEADO emp
        INNER JOIN MEDICO m ON emp.id_empleado = m.fk_med_id_empleado
        LEFT JOIN ESPECIALIDAD e ON m.fk_id_especialidad = e.id_especialidad
        LEFT JOIN CONSULTORIO con ON m.fk_id_consultorio = con.id_consultorio
        WHERE m.cedula = '${cedulaEscapada}'
      `;
      
      console.log(`🔍 [obtenerPerfilMedico] Ejecutando query de verificación para cédula: ${cedula}`);
      const verificacion = await executeQuery(verificacionQuery);
      console.log(`🔍 [obtenerPerfilMedico] Resultado de verificación:`, verificacion);

      // Normalizar resultado
      let resultadoNormalizado;
      if (Array.isArray(verificacion)) {
        resultadoNormalizado = verificacion;
      } else if (verificacion && verificacion.recordset) {
        resultadoNormalizado = verificacion.recordset;
      } else {
        resultadoNormalizado = [];
      }

      if (!resultadoNormalizado || resultadoNormalizado.length === 0) {
        console.log(`❌ [obtenerPerfilMedico] Médico no encontrado con cédula: ${cedula}`);
        return res.status(404).json({ 
          success: false, 
          message: `Médico no encontrado con cédula: ${cedula}` 
        });
      }

      res.json({ success: true, data: resultadoNormalizado[0] });
    }
  } catch (error) {
    console.error('❌ [obtenerPerfilMedico] Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener perfil del médico',
      error: error.message,
      debug: `Cédula solicitada: ${cedula}`
    });
  }
};

// Actualizar perfil médico
const actualizarPerfilMedico = async (req, res) => {
  const { cedula } = req.params;
  const { telefono, correo } = req.body;

  console.log(`✏️ [actualizarPerfilMedico] Iniciando para cédula: ${cedula}`, { telefono, correo });

  if (!cedula) {
    return res.status(400).json({ 
      success: false, 
      message: 'Cédula del médico es obligatoria' 
    });
  }

  try {
    console.log(`🔄 [actualizarPerfilMedico] Ejecutando SP para médico: ${cedula}`);
    
    await executeStoredProcedure('sp_actualizarPerfilMedico', {
      cedula,
      telefono,
      correo
    });

    console.log(`✅ [actualizarPerfilMedico] Perfil del médico ${cedula} actualizado correctamente`);
    res.json({ success: true, message: 'Perfil actualizado correctamente' });
  } catch (error) {
    console.error('❌ [actualizarPerfilMedico] Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al actualizar perfil',
      error: error.message 
    });
  }
};

// ===============================
// GESTIÓN DE CITAS MÉDICAS
// ===============================

// Obtener citas del médico
const obtenerCitasMedico = async (req, res) => {
  const { cedula } = req.params;
  const { fecha_inicio, fecha_fin, estatus } = req.query;

  console.log(`📅 [obtenerCitasMedico] Iniciando para cédula: ${cedula}`, { fecha_inicio, fecha_fin, estatus });

  if (!cedula) {
    return res.status(400).json({ 
      success: false, 
      message: 'Cédula del médico es obligatoria' 
    });
  }

  try {
    console.log(`🔄 [obtenerCitasMedico] Buscando citas para médico: ${cedula}`);
    
    // Intentar con SP primero
    try {
      const result = await executeStoredProcedure('sp_obtenerCitasMedico', {
        cedula,
        fecha_inicio: fecha_inicio || null,
        fecha_fin: fecha_fin || null,
        estatus: estatus || null
      });
      
      console.log(`✅ [obtenerCitasMedico] SP ejecutado - Citas encontradas: ${result.recordset.length}`);
      console.log(`🔍 [obtenerCitasMedico] Primeras 2 citas del SP:`, result.recordset.slice(0, 2));
      
      res.json({ success: true, data: result.recordset });
    } catch (spError) {
      console.log(`⚠️ [obtenerCitasMedico] SP falló, usando query directa:`, spError.message);
      
      // Query directa SIN parámetros ? para SQL Server
      const cedulaEscapada = cedula.replace(/'/g, "''");
      
      let baseQuery = `
        SELECT 
          c.folio_cita,
          c.cita_fechahora,
          p.pac_nombre + ' ' + p.pac_paterno + ' ' + ISNULL(p.pac_materno, '') AS nombre_paciente,
          p.CURP AS curp_paciente,
          p.pac_edad,
          p.pac_tel AS telefono_paciente,
          cs.estatusCita AS estatus,
          con.consultorio_numero,
          pc.pago_cantidadTotal,
          pc.estatuspago,
          e.nombre_especialidad
        FROM CITA c
        INNER JOIN PACIENTE p ON c.fk_cita_CURP = p.CURP
        INNER JOIN MEDICO m ON c.fk_cedula = m.cedula
        INNER JOIN ESPECIALIDAD e ON m.fk_id_especialidad = e.id_especialidad
        INNER JOIN CITA_ESTATUS cs ON c.fk_id_citaEstatus = cs.id_citaEstatus
        LEFT JOIN CONSULTORIO con ON m.fk_id_consultorio = con.id_consultorio
        LEFT JOIN PAGO_CITA pc ON c.id_pago = pc.id_pago
        WHERE m.cedula = '${cedulaEscapada}'
      `;

      // Agregar filtros si existen
      if (fecha_inicio) {
        const fechaInicioEscapada = fecha_inicio.replace(/'/g, "''");
        baseQuery += ` AND CAST(c.cita_fechahora AS DATE) >= '${fechaInicioEscapada}'`;
      }

      if (fecha_fin) {
        const fechaFinEscapada = fecha_fin.replace(/'/g, "''");
        baseQuery += ` AND CAST(c.cita_fechahora AS DATE) <= '${fechaFinEscapada}'`;
      }

      if (estatus) {
        const estatusEscapado = estatus.replace(/'/g, "''");
        baseQuery += ` AND cs.estatusCita = '${estatusEscapado}'`;
      }

      baseQuery += ` ORDER BY c.cita_fechahora DESC`;

      console.log(`🔍 [obtenerCitasMedico] Query:`, baseQuery);

      const directResult = await executeQuery(baseQuery);
      
      // Normalizar resultado
      let resultadoNormalizado;
      if (Array.isArray(directResult)) {
        resultadoNormalizado = directResult;
      } else if (directResult && directResult.recordset) {
        resultadoNormalizado = directResult.recordset;
      } else {
        resultadoNormalizado = [];
      }
      
      console.log(`✅ [obtenerCitasMedico] Query directa - Citas encontradas: ${resultadoNormalizado.length}`);
      console.log(`🔍 [obtenerCitasMedico] Primeras 2 citas de query directa:`, resultadoNormalizado.slice(0, 2));
      
      res.json({ success: true, data: resultadoNormalizado });
    }
  } catch (error) {
    console.error('❌ [obtenerCitasMedico] Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener citas',
      error: error.message,
      debug: `Cédula: ${cedula}, Filtros: ${JSON.stringify({ fecha_inicio, fecha_fin, estatus })}`
    });
  }
};

// Solicitar cancelación de cita
const solicitarCancelacionCita = async (req, res) => {
  const { folio_cita } = req.params;
  const { motivo, cedula_medico } = req.body;

  if (!folio_cita || !cedula_medico) {
    return res.status(400).json({ 
      success: false, 
      message: 'Folio de cita y cédula del médico son obligatorios' 
    });
  }

  try {
    console.log(`📝 Solicitud de cancelación de cita ${folio_cita} por médico ${cedula_medico}`);
    
    await executeStoredProcedure('sp_solicitarCancelacionMedico', {
      folio_cita,
      cedula_medico,
      motivo: motivo || 'Cancelación solicitada por el médico'
    });

    console.log(`✅ Solicitud de cancelación enviada para cita ${folio_cita}`);
    res.json({ 
      success: true, 
      message: 'Cita cancelada correctamente.' 
    });
  } catch (error) {
    console.error('❌ Error al solicitar cancelación:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al solicitar cancelación',
      error: error.message 
    });
  }
};

// Marcar cita como atendida
const marcarCitaAtendida = async (req, res) => {
  const { folio_cita } = req.params;
  const { observaciones, cedula_medico } = req.body;

  if (!folio_cita || !cedula_medico) {
    return res.status(400).json({ 
      success: false, 
      message: 'Folio de cita y cédula del médico son obligatorios' 
    });
  }

  try {
    console.log(`✅ Marcando cita como atendida: ${folio_cita}`);
    
    // Query directa para marcar como atendida
    const updateQuery = `
      UPDATE CITA 
      SET fk_id_citaEstatus = (
        SELECT id_citaEstatus 
        FROM CITA_ESTATUS 
        WHERE estatusCita = 'Atendida'
      )
      WHERE folio_cita = ? 
      AND fk_cedula = ?
    `;
    
    await executeQuery(updateQuery, [folio_cita, cedula_medico]);

    console.log(`✅ Cita ${folio_cita} marcada como atendida`);
    res.json({ success: true, message: 'Cita marcada como atendida correctamente' });
  } catch (error) {
    console.error('❌ Error al marcar cita como atendida:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al marcar cita como atendida',
      error: error.message 
    });
  }
};

// Atender cita completa
const atenderCitaCompleta = async (req, res) => {
  const { folio_cita } = req.params;
  const {
    cedula_medico,
    motivo_consulta,
    examen_fisico,
    diagnostico,
    tipo_sangre,
    alergias,
    padecimientos_previos,
    peso,
    estatura
  } = req.body;

  if (!folio_cita || !cedula_medico || !motivo_consulta || !diagnostico) {
    return res.status(400).json({ 
      success: false, 
      message: 'Folio de cita, cédula del médico, motivo de consulta y diagnóstico son obligatorios' 
    });
  }

  try {
    console.log(`🏥 Atendiendo cita completa: ${folio_cita}`);
    
    await executeStoredProcedure('sp_atenderCitaCompleta', {
      folio_cita,
      cedula_medico,
      motivo_consulta,
      examen_fisico,
      diagnostico,
      tipo_sangre,
      alergias,
      padecimientos_previos,
      peso,
      estatura
    });

    console.log(`✅ Cita ${folio_cita} atendida completamente`);
    res.json({ success: true, message: 'Cita atendida y registrada en historial médico correctamente' });
  } catch (error) {
    console.error('❌ Error al atender cita completa:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al atender cita completa',
      error: error.message 
    });
  }
};

// ===============================
// GESTIÓN DE PACIENTES
// ===============================

// Obtener datos del paciente
const obtenerDatosPaciente = async (req, res) => {
  const { curp } = req.params;

  if (!curp) {
    return res.status(400).json({ 
      success: false, 
      message: 'CURP del paciente es obligatorio' 
    });
  }

  try {
    console.log(`👤 Obteniendo datos del paciente: ${curp}`);
    
    const result = await executeStoredProcedure('sp_obtenerDatosPacienteMedico', { curp });
    
    if (!result.recordset.length) {
      return res.status(404).json({ 
        success: false, 
        message: 'Paciente no encontrado' 
      });
    }

    console.log(`✅ Datos del paciente ${curp} obtenidos correctamente`);
    res.json({ success: true, data: result.recordset[0] });
  } catch (error) {
    console.error('❌ Error al obtener datos del paciente:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener datos del paciente',
      error: error.message 
    });
  }
};

// ===============================
// GESTIÓN DE HISTORIAL MÉDICO
// ===============================

// Obtener historial médico del paciente
const obtenerHistorialMedico = async (req, res) => {
  const { curp } = req.params;

  if (!curp) {
    return res.status(400).json({ 
      success: false, 
      message: 'CURP del paciente es obligatorio' 
    });
  }

  try {
    console.log(`📋 Obteniendo historial médico del paciente: ${curp}`);
    
    const result = await executeStoredProcedure('sp_obtenerHistorialMedico', { curp });

    console.log(`✅ Historial médico del paciente ${curp} obtenido: ${result.recordset.length} registros`);
    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error('❌ Error al obtener historial médico:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener historial médico',
      error: error.message 
    });
  }
};

// Agregar entrada al historial médico
const agregarHistorialMedico = async (req, res) => {
  const { curp } = req.params;
  const {
    motivo_consulta,
    examen_fisico,
    diagnostico,
    cedula_medico,
    tipo_sangre,
    alergias,
    padecimientos_previos,
    peso,
    estatura
  } = req.body;

  if (!curp || !motivo_consulta || !diagnostico || !cedula_medico) {
    return res.status(400).json({ 
      success: false, 
      message: 'CURP, motivo de consulta, diagnóstico y cédula del médico son obligatorios' 
    });
  }

  try {
    console.log(`➕ Agregando entrada al historial médico del paciente: ${curp}`);
    
    await executeStoredProcedure('sp_agregarHistorialMedico', {
      curp,
      motivo_consulta,
      examen_fisico,
      diagnostico,
      cedula_medico,
      tipo_sangre,
      alergias,
      padecimientos_previos,
      peso,
      estatura
    });

    console.log(`✅ Entrada agregada al historial médico del paciente ${curp}`);
    res.json({ success: true, message: 'Entrada agregada al historial médico correctamente' });
  } catch (error) {
    console.error('❌ Error al agregar entrada al historial médico:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al agregar entrada al historial médico',
      error: error.message 
    });
  }
};

// Obtener historial por médico
const obtenerHistorialPorMedico = async (req, res) => {
  const { cedula } = req.params;
  const { fecha_inicio, fecha_fin } = req.query;

  if (!cedula) {
    return res.status(400).json({ 
      success: false, 
      message: 'Cédula del médico es obligatoria' 
    });
  }

  try {
    console.log(`📋 Obteniendo historial del médico: ${cedula}`);
    
    const result = await executeStoredProcedure('sp_obtenerHistorialPorMedico', {
      cedula_medico: cedula,
      fecha_inicio: fecha_inicio || null,
      fecha_fin: fecha_fin || null
    });

    console.log(`✅ Historial del médico ${cedula} obtenido: ${result.recordset.length} registros`);
    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error('❌ Error al obtener historial del médico:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener historial del médico',
      error: error.message 
    });
  }
};

// ===============================
// GESTIÓN DE RECETAS
// ===============================

// Obtener recetas del médico - FUNCIÓN CORREGIDA
const obtenerRecetasMedico = async (req, res) => {
  const { cedula } = req.params;
  const { fecha_inicio, fecha_fin, paciente_curp } = req.query;

  if (!cedula) {
    return res.status(400).json({ 
      success: false, 
      message: 'Cédula del médico es obligatoria' 
    });
  }

  try {
    console.log(`💊 [obtenerRecetasMedico] Obteniendo recetas del médico: ${cedula}`);
    
    // ✅ USAR QUERY DIRECTA SIEMPRE (más confiable)
    const cedulaEscapada = cedula.replace(/'/g, "''");
    
    let queryDirecta = `
      SELECT 
        r.id_receta,
        'REC-' + CAST(r.id_receta AS VARCHAR) as folio_receta,
        r.fk_folio_cita as folio_cita,
        c.cita_fechahora as fecha_emision,
        r.diagnostico,
        r.tratamiento,
        r.medicamento as medicamentos,
        'Sin observaciones' as observaciones_generales,
        'Activa' as estatus_receta,
        p.CURP as curp_paciente,
        p.pac_nombre + ' ' + p.pac_paterno + ' ' + ISNULL(p.pac_materno, '') AS nombre_paciente,
        p.pac_edad,
        p.pac_tel as telefono_paciente,
        emp.empleado_nombre + ' ' + emp.empleado_paterno AS nombre_medico,
        e.nombre_especialidad,
        c.cita_fechahora as fecha_cita,
        cs.estatusCita as estatus_cita
      FROM RECETA r
      INNER JOIN CITA c ON r.fk_folio_cita = c.folio_cita
      INNER JOIN MEDICO m ON c.fk_cedula = m.cedula
      INNER JOIN EMPLEADO emp ON m.fk_med_id_empleado = emp.id_empleado
      INNER JOIN ESPECIALIDAD e ON m.fk_id_especialidad = e.id_especialidad
      INNER JOIN PACIENTE p ON c.fk_cita_CURP = p.CURP
      LEFT JOIN CITA_ESTATUS cs ON c.fk_id_citaEstatus = cs.id_citaEstatus
      WHERE m.cedula = '${cedulaEscapada}'
    `;

    // Agregar filtros si existen
    if (fecha_inicio) {
      const fechaInicioEscapada = fecha_inicio.replace(/'/g, "''");
      queryDirecta += ` AND CAST(c.cita_fechahora AS DATE) >= '${fechaInicioEscapada}'`;
    }
    if (fecha_fin) {
      const fechaFinEscapada = fecha_fin.replace(/'/g, "''");
      queryDirecta += ` AND CAST(c.cita_fechahora AS DATE) <= '${fechaFinEscapada}'`;
    }
    if (paciente_curp) {
      const curpEscapado = paciente_curp.replace(/'/g, "''");
      queryDirecta += ` AND p.CURP = '${curpEscapado}'`;
    }
    queryDirecta += ` ORDER BY c.cita_fechahora DESC`;

    console.log(`🔍 [obtenerRecetasMedico] Query:`, queryDirecta);

    const directResult = await executeQuery(queryDirecta);
    console.log(`🔍 [obtenerRecetasMedico] Resultado crudo:`, directResult);
    
    // ✅ NORMALIZAR RESULTADO CORRECTAMENTE
    let recetasArray = [];
    
    if (Array.isArray(directResult)) {
      recetasArray = directResult;
    } else if (directResult && directResult.recordset && Array.isArray(directResult.recordset)) {
      recetasArray = directResult.recordset;
    } else if (directResult && directResult.rows && Array.isArray(directResult.rows)) {
      recetasArray = directResult.rows;
    } else if (directResult && typeof directResult === 'object') {
      // Si es un objeto simple, convertirlo en array
      recetasArray = [directResult];
    }
    
    console.log(`✅ [obtenerRecetasMedico] Recetas normalizadas - Total: ${recetasArray.length}`);
    
    // ✅ PROCESAR MEDICAMENTOS PARA EL FRONTEND
    const recetasProcesadas = recetasArray.map(receta => ({
      ...receta,
      medicamentos: receta.medicamentos ? 
        [{ 
          nombre: receta.medicamentos,
          dosis: '',
          indicaciones: ''
        }] : []
    }));
    
    console.log(`✅ [obtenerRecetasMedico] Recetas procesadas: ${recetasProcesadas.length}`);
    res.json({ success: true, data: recetasProcesadas });

  } catch (error) {
    console.error('❌ [obtenerRecetasMedico] Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener recetas del médico',
      error: error.message,
      data: [] // ✅ Devolver array vacío en caso de error
    });
  }
};

// Generar receta médica - FUNCIÓN CORREGIDA
const generarReceta = async (req, res) => {
  const {
    folio_cita,
    tratamiento,
    diagnostico,
    medicamento,
    observaciones,
    cedula_medico
  } = req.body;

  console.log('📝 [generarReceta] Datos recibidos:', {
    folio_cita,
    cedula_medico,
    tratamiento: tratamiento ? tratamiento.substring(0, 30) + '...' : 'VACÍO',
    diagnostico: diagnostico ? diagnostico.substring(0, 30) + '...' : 'VACÍO',
    medicamento: medicamento ? medicamento.substring(0, 30) + '...' : 'VACÍO'
  });

  // ✅ VALIDACIÓN MEJORADA
  if (!folio_cita || !tratamiento || !diagnostico || !medicamento || !cedula_medico) {
    console.log('❌ [generarReceta] Faltan campos obligatorios');
    return res.status(400).json({ 
      success: false, 
      message: 'Folio de cita, tratamiento, diagnóstico, medicamento y cédula del médico son obligatorios'
    });
  }

  try {
    console.log(`🔍 [generarReceta] Verificando cita ${folio_cita} para médico ${cedula_medico}`);
    
    // ✅ ESCAPAR PARÁMETROS CORRECTAMENTE
    const folioCitaNum = parseInt(folio_cita);
    const cedulaEscapada = cedula_medico.replace(/'/g, "''");
    
    // Query para verificar cita específica
    const verificarQuery = `
      SELECT 
        c.folio_cita,
        c.fk_cita_CURP,
        c.fk_cedula,
        p.pac_nombre + ' ' + p.pac_paterno + ' ' + ISNULL(p.pac_materno, '') AS nombre_paciente,
        p.CURP,
        cs.estatusCita
      FROM CITA c
      INNER JOIN PACIENTE p ON c.fk_cita_CURP = p.CURP
      LEFT JOIN CITA_ESTATUS cs ON c.fk_id_citaEstatus = cs.id_citaEstatus
      WHERE c.folio_cita = ${folioCitaNum} AND c.fk_cedula = '${cedulaEscapada}'
    `;
    
    console.log(`🔍 [generarReceta] Query verificación:`, verificarQuery);
    
    const citaResult = await executeQuery(verificarQuery);
    
    // ✅ NORMALIZAR RESULTADO
    let citaData = [];
    if (Array.isArray(citaResult)) {
      citaData = citaResult;
    } else if (citaResult && citaResult.recordset) {
      citaData = citaResult.recordset;
    } else if (citaResult && citaResult.rows) {
      citaData = citaResult.rows;
    }
    
    console.log(`🔍 [generarReceta] Cita encontrada:`, citaData);
    
    // Verificar si se encontró la cita
    if (!citaData || citaData.length === 0) {
      console.log(`❌ [generarReceta] Cita ${folio_cita} no encontrada para médico ${cedula_medico}`);
      return res.status(404).json({
        success: false,
        message: `Cita con folio ${folio_cita} no encontrada para este médico`
      });
    }

    const cita = citaData[0];
    console.log(`✅ [generarReceta] Cita válida encontrada:`, cita);

    // ✅ VERIFICAR SI YA EXISTE UNA RECETA
    const verificarRecetaQuery = `
      SELECT id_receta, diagnostico, tratamiento, medicamento 
      FROM RECETA 
      WHERE fk_folio_cita = ${folioCitaNum}
    `;
    
    console.log(`🔍 [generarReceta] Verificando recetas existentes...`);
    const recetaExistenteResult = await executeQuery(verificarRecetaQuery);
    
    let recetasExistentes = [];
    if (Array.isArray(recetaExistenteResult)) {
      recetasExistentes = recetaExistenteResult;
    } else if (recetaExistenteResult && recetaExistenteResult.recordset) {
      recetasExistentes = recetaExistenteResult.recordset;
    }
    
    if (recetasExistentes && recetasExistentes.length > 0) {
      const recetaExistente = recetasExistentes[0];
      console.log(`ℹ️ [generarReceta] Ya existe receta ID ${recetaExistente.id_receta}`);
      
      return res.json({
        success: true,
        message: 'Ya existe una receta para esta cita',
        data: {
          id_receta: recetaExistente.id_receta,
          folio_receta: `REC-${recetaExistente.id_receta}`,
          folio_cita: folioCitaNum,
          paciente: cita.nombre_paciente,
          curp_paciente: cita.CURP,
          diagnostico: recetaExistente.diagnostico,
          tratamiento: recetaExistente.tratamiento,
          medicamentos: recetaExistente.medicamento,
          fecha_emision: new Date(),
          estado: 'Existente'
        }
      });
    }

    // ✅ CREAR NUEVA RECETA CON LÍMITES DE CARACTERES
    console.log(`🔄 [generarReceta] Creando nueva receta...`);
    
    // Truncar y escapar campos
    const tratamientoFinal = tratamiento.substring(0, 255);
    const diagnosticoFinal = diagnostico.substring(0, 255);
    const medicamentoFinal = medicamento.substring(0, 500);
    
    const tratamientoEscapado = tratamientoFinal.replace(/'/g, "''");
    const diagnosticoEscapado = diagnosticoFinal.replace(/'/g, "''");
    const medicamentoEscapado = medicamentoFinal.replace(/'/g, "''");
    
    // ✅ USAR TRANSACCIÓN PARA INSERTAR Y OBTENER ID
    const insertQuery = `
      INSERT INTO RECETA (fk_folio_cita, tratamiento, diagnostico, medicamento)
      VALUES (${folioCitaNum}, '${tratamientoEscapado}', '${diagnosticoEscapado}', '${medicamentoEscapado}');
      
      SELECT SCOPE_IDENTITY() as id_receta;
    `;
    
    console.log(`🔍 [generarReceta] Query de inserción preparada`);
    
    const insertResult = await executeQuery(insertQuery);
    console.log(`🔍 [generarReceta] Resultado inserción:`, insertResult);
    
    // ✅ OBTENER ID DE LA RECETA CREADA
    let idReceta = null;
    
    if (Array.isArray(insertResult) && insertResult.length > 0) {
      // Si es array, tomar el último elemento que debería tener el ID
      const ultimoElemento = insertResult[insertResult.length - 1];
      idReceta = ultimoElemento.id_receta || ultimoElemento[''];
    } else if (insertResult && insertResult.recordset && insertResult.recordset.length > 0) {
      idReceta = insertResult.recordset[0].id_receta;
    } else if (insertResult && insertResult.id_receta) {
      idReceta = insertResult.id_receta;
    }
    
    console.log(`🔍 [generarReceta] ID de receta obtenido:`, idReceta);
    
    if (idReceta) {
      console.log(`✅ [generarReceta] Receta creada exitosamente con ID: ${idReceta}`);
      
      res.json({ 
        success: true, 
        message: 'Receta generada correctamente',
        data: { 
          id_receta: idReceta,
          folio_receta: `REC-${idReceta}`,
          folio_cita: folioCitaNum,
          paciente: cita.nombre_paciente,
          curp_paciente: cita.CURP,
          fecha_emision: new Date(),
          diagnostico: diagnosticoFinal,
          tratamiento: tratamientoFinal,
          medicamentos: medicamentoFinal,
          estado: 'Creada'
        }
      });
    } else {
      // ✅ FALLBACK: Verificar si se insertó correctamente
      console.log(`⚠️ [generarReceta] No se obtuvo ID, verificando inserción...`);
      
      const verificarInsercionQuery = `
        SELECT TOP 1 id_receta, diagnostico, tratamiento, medicamento
        FROM RECETA 
        WHERE fk_folio_cita = ${folioCitaNum}
        ORDER BY id_receta DESC
      `;
      
      const verificarResult = await executeQuery(verificarInsercionQuery);
      let recetaVerificada = null;
      
      if (Array.isArray(verificarResult) && verificarResult.length > 0) {
        recetaVerificada = verificarResult[0];
      } else if (verificarResult && verificarResult.recordset && verificarResult.recordset.length > 0) {
        recetaVerificada = verificarResult.recordset[0];
      }
      
      if (recetaVerificada) {
        console.log(`✅ [generarReceta] Receta encontrada tras inserción:`, recetaVerificada);
        
        res.json({ 
          success: true, 
          message: 'Receta generada correctamente',
          data: { 
            id_receta: recetaVerificada.id_receta,
            folio_receta: `REC-${recetaVerificada.id_receta}`,
            folio_cita: folioCitaNum,
            paciente: cita.nombre_paciente,
            curp_paciente: cita.CURP,
            fecha_emision: new Date(),
            diagnostico: recetaVerificada.diagnostico,
            tratamiento: recetaVerificada.tratamiento,
            medicamentos: recetaVerificada.medicamento,
            estado: 'Creada'
          }
        });
      } else {
        throw new Error('La receta no se pudo crear correctamente');
      }
    }

  } catch (error) {
    console.error('❌ [generarReceta] Error general:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor al crear receta',
      error: error.message
    });
  }
};

// Obtener receta específica
const obtenerReceta = async (req, res) => {
  const { id_receta } = req.params;

  if (!id_receta) {
    return res.status(400).json({ 
      success: false, 
      message: 'ID de receta es obligatorio' 
    });
  }

  try {
    console.log(`🔍 Obteniendo receta: ${id_receta}`);
    
    // Por ahora devolver receta simulada
    res.json({ 
      success: true, 
      data: {
        id_receta,
        medicamentos: [],
        diagnostico: 'Diagnóstico simulado'
      }
    });
  } catch (error) {
    console.error('❌ Error al obtener receta:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener receta',
      error: error.message 
    });
  }
};

// ===============================
// ESTADÍSTICAS MÉDICAS
// ===============================

// Obtener estadísticas del médico
const obtenerEstadisticasMedico = async (req, res) => {
  const { cedula } = req.params;

  console.log(`📊 [obtenerEstadisticasMedico] Iniciando para cédula: ${cedula}`);

  if (!cedula) {
    return res.status(400).json({ 
      success: false, 
      message: 'Cédula del médico es obligatoria' 
    });
  }

  // Función helper para normalizar resultados
  const normalizarResultado = (result) => {
    console.log('🔧 [normalizarEstadisticas] Resultado crudo:', result);
    
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
    console.log(`🔄 [obtenerEstadisticasMedico] Calculando estadísticas para médico: ${cedula}`);
    
    // Intentar con SP primero
    try {
      console.log(`🔄 [obtenerEstadisticasMedico] Intentando con SP...`);
      const result = await executeStoredProcedure('sp_obtenerEstadisticasMedico', { cedula });
      
      if (result && result.recordset && result.recordset.length > 0) {
        console.log(`✅ [obtenerEstadisticasMedico] SP ejecutado exitosamente:`, result.recordset[0]);
        res.json({ success: true, data: result.recordset[0] });
        return;
      } else {
        console.log(`⚠️ [obtenerEstadisticasMedico] SP no devolvió datos, usando query directa`);
      }
    } catch (spError) {
      console.log(`⚠️ [obtenerEstadisticasMedico] SP falló:`, spError.message);
    }

    // Query directa como fallback
    console.log(`🔄 [obtenerEstadisticasMedico] Usando queries directas...`);
    
    // Query para obtener todas las estadísticas de una vez
    const cedulaEscapada = cedula.replace(/'/g, "''");
    const statsQuery = `
      SELECT 
        COUNT(*) as total_citas,
        SUM(CASE WHEN cs.estatusCita = 'Atendida' THEN 1 ELSE 0 END) as citas_atendidas,
        SUM(CASE 
          WHEN cs.estatusCita IN ('Programada', 'Confirmada', 'En espera') 
            OR cs.estatusCita LIKE '%pendiente%' 
            OR cs.estatusCita IS NULL
          THEN 1 ELSE 0 END) as citas_pendientes,
        SUM(CASE 
          WHEN cs.estatusCita LIKE '%cancelada%' 
            OR cs.estatusCita LIKE '%Cancelada%' 
          THEN 1 ELSE 0 END) as citas_canceladas,
        SUM(CASE 
          WHEN CAST(c.cita_fechahora AS DATE) = CAST(GETDATE() AS DATE) 
          THEN 1 ELSE 0 END) as citas_hoy
      FROM CITA c
      INNER JOIN MEDICO m ON c.fk_cedula = m.cedula
      LEFT JOIN CITA_ESTATUS cs ON c.fk_id_citaEstatus = cs.id_citaEstatus
      WHERE m.cedula = '${cedulaEscapada}'
    `;

    console.log(`🔍 [obtenerEstadisticasMedico] Query estadísticas:`, statsQuery);

    let estadisticasCitas;
    try {
      const rawStats = await executeQuery(statsQuery);
      estadisticasCitas = normalizarResultado(rawStats);
      console.log(`🔍 [obtenerEstadisticasMedico] Estadísticas citas normalizadas:`, estadisticasCitas);
    } catch (statsError) {
      console.error('❌ [obtenerEstadisticasMedico] Error en query de estadísticas:', statsError);
      // Devolver estadísticas por defecto en caso de error
      estadisticasCitas = [{
        total_citas: 0,
        citas_atendidas: 0,
        citas_pendientes: 0,
        citas_canceladas: 0,
        citas_hoy: 0
      }];
    }

    // Query para obtener total de recetas
    let totalRecetas = 0;
    try {
      const recetasQuery = `
        SELECT COUNT(*) as total_recetas
        FROM RECETA r
        INNER JOIN CITA c ON r.fk_folio_cita = c.folio_cita
        INNER JOIN MEDICO m ON c.fk_cedula = m.cedula
        WHERE m.cedula = '${cedulaEscapada}'
      `;

      console.log(`🔍 [obtenerEstadisticasMedico] Query recetas:`, recetasQuery);

      const rawRecetas = await executeQuery(recetasQuery);
      const recetasResult = normalizarResultado(rawRecetas);
      
      if (recetasResult && recetasResult[0]) {
        totalRecetas = recetasResult[0].total_recetas || 0;
        console.log(`✅ [obtenerEstadisticasMedico] Total recetas: ${totalRecetas}`);
      }
    } catch (recetasError) {
      console.log('⚠️ [obtenerEstadisticasMedico] Error al obtener recetas, usando 0:', recetasError.message);
      totalRecetas = 0;
    }

    // Combinar resultados
    const estadisticas = estadisticasCitas[0] || {};
    const estadisticasFinales = {
      total_citas: Number(estadisticas.total_citas || 0),
      citas_atendidas: Number(estadisticas.citas_atendidas || 0),
      citas_pendientes: Number(estadisticas.citas_pendientes || 0),
      citas_canceladas: Number(estadisticas.citas_canceladas || 0),
      citas_hoy: Number(estadisticas.citas_hoy || 0),
      total_recetas: Number(totalRecetas),
      
      // Estadísticas adicionales calculadas
      porcentaje_atendidas: estadisticas.total_citas > 0 
        ? Math.round((Number(estadisticas.citas_atendidas || 0) / Number(estadisticas.total_citas)) * 100)
        : 0,
      porcentaje_canceladas: estadisticas.total_citas > 0 
        ? Math.round((Number(estadisticas.citas_canceladas || 0) / Number(estadisticas.total_citas)) * 100)
        : 0
    };

    console.log(`✅ [obtenerEstadisticasMedico] Estadísticas finales:`, estadisticasFinales);
    res.json({ success: true, data: estadisticasFinales });

  } catch (error) {
    console.error('❌ [obtenerEstadisticasMedico] Error general:', error);
    
    // En caso de error total, devolver estadísticas vacías pero válidas
    const estadisticasVacias = {
      total_citas: 0,
      citas_atendidas: 0,
      citas_pendientes: 0,
      citas_canceladas: 0,
      citas_hoy: 0,
      total_recetas: 0,
      porcentaje_atendidas: 0,
      porcentaje_canceladas: 0
    };

    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener estadísticas',
      error: error.message,
      data: estadisticasVacias // Proporcionar datos por defecto
    });
  }
};

// ===============================
// EXPORTACIÓN DE MÓDULO
// ===============================

module.exports = {
  // Gestión de Perfil
  obtenerPerfilMedico,
  actualizarPerfilMedico,
  
  // Gestión de Citas
  obtenerCitasMedico,
  solicitarCancelacionCita,
  marcarCitaAtendida,
  atenderCitaCompleta,
  
  // Gestión de Pacientes
  obtenerDatosPaciente,
  
  // Gestión de Historial Médico
  obtenerHistorialMedico,
  agregarHistorialMedico,
  obtenerHistorialPorMedico,
  
  // Gestión de Recetas
  obtenerRecetasMedico,
  generarReceta,
  obtenerReceta,
  
  // Estadísticas
  obtenerEstadisticasMedico
};