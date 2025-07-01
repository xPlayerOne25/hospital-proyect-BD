//backend/routes/recepcionista.js
const express = require('express');
const router = express.Router();
const recepcionistaController = require('../controllers/recepcionistaController');
const {
  validatePaciente,
  validateCrearPaciente,
  validateDoctor,
  validateCURP,
  validateCedula,
  validateFolio,
  validateFolioCita,
  validateCancelarCita,
} = require('../middleware/validationMiddleware');

// ===============================
// GESTIÓN DE PACIENTES
// ===============================

// ✅ Obtener todos los pacientes
router.get('/pacientes', recepcionistaController.obtenerPacientes);

// ✅ Crear un nuevo paciente
router.post('/pacientes', validateCrearPaciente, recepcionistaController.crearPaciente);

// ✅ Actualizar un paciente
router.put('/pacientes/:curp', validateCURP, validatePaciente, recepcionistaController.actualizarPaciente);

// ===============================
// GESTIÓN DE DOCTORES
// ===============================

// ✅ Obtener todos los doctores
router.get('/doctores', recepcionistaController.obtenerDoctores);

// ✅ Crear un nuevo doctor
router.post('/doctores', validateDoctor, recepcionistaController.crearDoctor);

// ✅ Crear usuario para doctor existente
router.post('/doctores/:cedula/usuario', validateCedula, recepcionistaController.crearUsuarioDoctor);

// ✅ Dar de baja un doctor (verificando que no tenga citas)
router.delete('/doctores/:cedula', validateCedula, recepcionistaController.darBajaDoctor);

// Ruta adicional para dar de baja (mantengo por compatibilidad)
router.put('/doctores/baja/:cedula', recepcionistaController.darBajaDoctor);

// ===============================
// GESTIÓN DE CITAS - RUTAS BÁSICAS
// ===============================

// ✅ Obtener todas las citas
router.get('/citas', recepcionistaController.obtenerCitas);

// ✅ Cancelar cita con política de devolución
router.put('/citas/cancelar/:folio', validateCancelarCita, recepcionistaController.cancelarCita);

// ===============================
// GESTIÓN AVANZADA DE CITAS - NUEVAS RUTAS
// ===============================

// ✅ Obtener todos los estatus de cita disponibles
router.get('/citas/estatus', recepcionistaController.obtenerEstatusCita);

// ✅ Obtener estadísticas de citas por estatus
router.get('/citas/estadisticas', recepcionistaController.obtenerEstadisticasCitas);

// ✅ Procesar citas pasadas (marcar como "No Acudió")
router.post('/citas/procesar-pasadas', recepcionistaController.procesarCitasPasadas);

// ✅ Obtener historial de cambios de una cita específica
router.get('/citas/:folio/historial', recepcionistaController.obtenerHistorialCita);

// ✅ Actualizar estatus de una cita específica
router.put('/citas/:folio/estatus', recepcionistaController.actualizarEstatusCita);

// ===============================
// GESTIÓN DE COBROS Y TICKETS
// ===============================

// ✅ Obtener resumen de cobros y tickets
router.get('/cobros', recepcionistaController.obtenerCobros);

// ✅ Generar ticket específico para una cita
router.get('/tickets/:folio_cita', validateFolioCita, recepcionistaController.generarTicket);

// ===============================
// CATÁLOGOS Y REFERENCIAS
// ===============================

// ✅ Obtener todas las especialidades
router.get('/especialidades', recepcionistaController.obtenerEspecialidades);

// ✅ Obtener todos los consultorios
router.get('/consultorios', recepcionistaController.obtenerConsultorios);

// ===============================
// ESTADÍSTICAS Y REPORTES
// ===============================

// ✅ Obtener estadísticas del dashboard
router.get('/estadisticas', recepcionistaController.obtenerEstadisticas);

// ===============================
// MIDDLEWARE DE VALIDACIÓN
// ===============================

// Middleware para validar que el usuario sea recepcionista
const validarRecepcionista = (req, res, next) => {
  // TODO: Implementar validación de rol de recepcionista
  // Por ahora, permite el acceso
  next();
};

// Aplicar middleware a todas las rutas (opcional)
// router.use(validarRecepcionista);

module.exports = router;