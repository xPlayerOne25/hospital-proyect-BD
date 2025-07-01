// ===============================
// ROUTES COMPLETO: routes/bitacora.js
// ===============================

const express = require('express');
const router = express.Router();
const bitacoraController = require('../controllers/bitacoraController');

// Middleware de validación básica
const validarCURP = (req, res, next) => {
  const { curp } = req.params;
  if (!curp || curp.length !== 18) {
    return res.status(400).json({
      success: false,
      message: 'CURP debe tener exactamente 18 caracteres'
    });
  }
  next();
};

const validarCedula = (req, res, next) => {
  const { cedula } = req.query;
  if (cedula && cedula.length < 8) {
    return res.status(400).json({
      success: false,
      message: 'Cédula debe tener al menos 8 caracteres'
    });
  }
  next();
};

const validarFechas = (req, res, next) => {
  const { fecha_inicio, fecha_fin } = req.query;
  
  if (fecha_inicio && fecha_fin) {
    const inicio = new Date(fecha_inicio);
    const fin = new Date(fecha_fin);
    
    if (inicio > fin) {
      return res.status(400).json({
        success: false,
        message: 'La fecha de inicio no puede ser posterior a la fecha de fin'
      });
    }
  }
  
  next();
};

// ===============================
// RUTAS PRINCIPALES DE BITÁCORA
// ===============================

// Obtener historial médico de un paciente (para vista del médico)
router.get('/historial/paciente/:curp', validarCURP, bitacoraController.obtenerHistorialPaciente);

// Obtener resumen de actividad de un paciente
router.get('/resumen/paciente/:curp', validarCURP, bitacoraController.obtenerResumenPaciente);

// Obtener movimientos de un médico específico
router.get('/movimientos/medico', validarCedula, bitacoraController.obtenerMovimientosMedico);

// Obtener bitácora completa con filtros (para administradores)
router.get('/completa', validarFechas, bitacoraController.obtenerBitacoraCompleta);

// Obtener estadísticas de la bitácora
router.get('/estadisticas', bitacoraController.obtenerEstadisticasBitacora);

// Obtener movimientos por rango de fechas
router.get('/por-fecha', validarFechas, bitacoraController.obtenerMovimientosPorFecha);

// ===============================
// RUTAS DE GESTIÓN
// ===============================

// Registrar movimiento manual
router.post('/movimiento', bitacoraController.registrarMovimientoManual);

// Limpiar bitácora antigua (solo para administradores)
router.delete('/limpiar', bitacoraController.limpiarBitacoraAntigua);

// ===============================
// RUTAS DE UTILIDAD
// ===============================

// Ping para verificar que el módulo funciona
router.get('/ping', (req, res) => {
  res.json({
    success: true,
    message: 'Módulo de bitácora funcionando correctamente',
    timestamp: new Date().toISOString(),
    endpoints_disponibles: [
      'GET /historial/paciente/:curp',
      'GET /resumen/paciente/:curp', 
      'GET /movimientos/medico',
      'GET /completa',
      'GET /estadisticas',
      'GET /por-fecha',
      'POST /movimiento',
      'DELETE /limpiar'
    ]
  });
});

// Middleware de manejo de errores específico para bitácora
router.use((error, req, res, next) => {
  console.error('❌ Error en rutas de bitácora:', error);
  
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Error de validación en bitácora',
      error: error.message
    });
  }
  
  if (error.name === 'DatabaseError') {
    return res.status(500).json({
      success: false,
      message: 'Error de base de datos en bitácora',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
    });
  }
  
  res.status(500).json({
    success: false,
    message: 'Error interno en módulo de bitácora',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
  });
});

module.exports = router;