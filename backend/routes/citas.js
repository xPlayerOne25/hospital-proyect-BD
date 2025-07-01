// routes/citas.js - ARCHIVO COMPLETO
const express = require('express');
const router = express.Router();

console.log('📋 Cargando rutas de citas...');

// ✅ IMPORTAR EL CONTROLADOR COMPLETO
const citaController = require('../controllers/citaController');

// ✅ MIDDLEWARE DE AUTENTICACIÓN CON MANEJO DE ERRORES
let authenticateToken;
try {
  authenticateToken = require('../middleware/auth');
  console.log('✅ Middleware de autenticación cargado');
} catch (error) {
  console.warn('⚠️ Middleware de autenticación no encontrado, creando dummy...');
  authenticateToken = (req, res, next) => {
    console.warn('⚠️ Usando middleware dummy - todas las rutas son públicas');
    req.user = { curp: 'DEMO123456789012', userType: 'paciente' };
    next();
  };
}

// ===== RUTAS PÚBLICAS =====
console.log('📋 Configurando rutas públicas...');

// Obtener todas las especialidades
router.get('/especialidades', (req, res) => {
  console.log('🔍 GET /especialidades');
  citaController.getEspecialidades(req, res);
});

// Obtener médicos por especialidad
router.get('/medicos/:especialidadId', (req, res) => {
  console.log('👨‍⚕️ GET /medicos/:especialidadId');
  citaController.getMedicosByEspecialidad(req, res);
});

// Obtener próximas fechas disponibles
router.get('/fechas-disponibles', (req, res) => {
  console.log('📅 GET /fechas-disponibles');
  citaController.getFechasDisponibles(req, res);
});

// Obtener información completa de un doctor
router.get('/doctor/:cedula/info', (req, res) => {
  console.log('👨‍⚕️ GET /doctor/:cedula/info');
  citaController.getDoctorInfo(req, res);
});

// Obtener horarios disponibles de un doctor para una fecha específica
router.get('/doctor/:cedula/horarios/:fecha', (req, res) => {
  console.log('⏰ GET /doctor/:cedula/horarios/:fecha');
  citaController.getHorariosDisponibles(req, res);
});

// ===== RUTAS CON AUTENTICACIÓN =====
console.log('📋 Configurando rutas con autenticación...');

// Generar nueva cita (requiere autenticación)
router.post('/generar', authenticateToken, (req, res) => {
  console.log('📝 POST /generar');
  citaController.generarCita(req, res);
});

// Actualizar estatus de cita (requiere autenticación)
router.put('/:folio/estatus', authenticateToken, (req, res) => {
  console.log('🔄 PUT /:folio/estatus');
  citaController.actualizarEstatusCita(req, res);
});

// Obtener citas del paciente autenticado
router.get('/paciente', authenticateToken, (req, res) => {
  console.log('👤 GET /paciente');
  citaController.getCitasPaciente(req, res);
});

// Obtener citas pendientes de pago (paciente autenticado)
router.get('/pendientes-pago', authenticateToken, (req, res) => {
  console.log('💳 GET /pendientes-pago');
  citaController.getCitasPendientesPago(req, res);
});

// ===== RUTAS DE CANCELACIÓN =====
console.log('📋 Configurando rutas de cancelación...');

// Consultar política de cancelación antes de cancelar
router.get('/:folio/politica-cancelacion', (req, res) => {
  console.log('📋 GET /:folio/politica-cancelacion');
  citaController.obtenerPoliticaCancelacion(req, res);
});

// Cancelar cita con política de devolución
router.put('/cancelar/:folio', (req, res) => {
  console.log('❌ PUT /cancelar/:folio');
  citaController.cancelarCita(req, res);
});

// ===== RUTA DE PRUEBA =====
router.get('/test', (req, res) => {
  console.log('🧪 GET /test');
  res.json({
    success: true,
    message: '✅ Rutas de citas funcionando correctamente',
    timestamp: new Date().toISOString(),
    availableRoutes: [
      'GET /especialidades - Obtener especialidades',
      'GET /medicos/:especialidadId - Obtener médicos por especialidad',
      'GET /fechas-disponibles - Obtener fechas disponibles',
      'GET /doctor/:cedula/info - Información del doctor',
      'GET /doctor/:cedula/horarios/:fecha - Horarios disponibles',
      'POST /generar - Generar nueva cita (requiere auth)',
      'PUT /:folio/estatus - Actualizar estatus (requiere auth)',
      'GET /paciente - Obtener citas del paciente (requiere auth)',
      'GET /pendientes-pago - Citas pendientes de pago (requiere auth)',
      'GET /:folio/politica-cancelacion - Consultar política',
      'PUT /cancelar/:folio - Cancelar cita con política'
    ],
    controller: 'citaController',
    middleware: authenticateToken.name || 'dummy'
  });
});

// ===== MANEJO DE ERRORES EN RUTAS =====
router.use((error, req, res, next) => {
  console.error('❌ Error en rutas de citas:', error);
  res.status(500).json({
    success: false,
    message: 'Error interno en el módulo de citas',
    error: error.message,
    timestamp: new Date().toISOString()
  });
});

console.log('✅ Rutas de citas configuradas correctamente');

module.exports = router;