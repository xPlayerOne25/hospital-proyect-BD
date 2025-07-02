//backend/routes/medico.js
const express = require('express');
const router = express.Router();
const medicoController = require('../controllers/medicoController');

// Importar validaciones si las tienes
// const { validateCedula, validateCURP, validateFolio } = require('../middleware/validationMiddleware');

// ===============================
// GESTIÓN DE PERFIL MÉDICO
// ===============================

// ✅ Obtener datos del médico
router.get('/perfil/:cedula', medicoController.obtenerPerfilMedico);

// ✅ Actualizar datos editables del médico (solo teléfono y correo)
router.put('/perfil/:cedula', medicoController.actualizarPerfilMedico);

// ✅ Obtener estadísticas del médico
router.get('/estadisticas/:cedula', medicoController.obtenerEstadisticasMedico);

// ===============================
// GESTIÓN DE CITAS MÉDICAS
// ===============================

// ✅ Obtener citas del médico
// Query params: ?fecha_inicio=2024-01-01&fecha_fin=2024-12-31&estatus=Pendiente
router.get('/citas/:cedula', medicoController.obtenerCitasMedico);

// ✅ Solicitar cancelación de cita (requiere aprobación de recepcionista)
router.post('/citas/cancelar/:folio_cita', medicoController.solicitarCancelacionCita);

// ✅ Marcar cita como atendida
router.put('/citas/atender/:folio_cita', medicoController.marcarCitaAtendida);

// ✅ Atender cita completa
router.post('/citas/atender-completa/:folio_cita', medicoController.atenderCitaCompleta);



// ===============================
// GESTIÓN DE PACIENTES
// ===============================

// ✅ Obtener datos del paciente
router.get('/pacientes/:curp', medicoController.obtenerDatosPaciente);

// ===============================
// GESTIÓN DE HISTORIAL MÉDICO
// ===============================

// ✅ Obtener historial médico del paciente
router.get('/historial/:curp', medicoController.obtenerHistorialMedico);

// ✅ Agregar entrada al historial médico

// ===============================
// GESTIÓN DE RECETAS
// ===============================

// ✅ Obtener todas las recetas del médico
// Query params: ?fecha_inicio=2024-01-01&fecha_fin=2024-12-31&paciente=Juan
router.get('/recetas/:cedula', medicoController.obtenerRecetasMedico);
router.get('/pacientes/:curp', medicoController.getPacientePorCURP);

// ✅ Generar nueva receta
router.post('/recetas', medicoController.generarReceta);

// ✅ Obtener receta específica
router.get('/receta/:id_receta', medicoController.obtenerReceta);

// ===============================
// MIDDLEWARE DE VALIDACIÓN (FUTURO)
// ===============================

// Middleware para validar que el usuario sea médico
const validarMedico = (req, res, next) => {
  // TODO: Implementar validación de rol de médico
  // Por ahora, permite el acceso
  next();
};

// Aplicar middleware a todas las rutas (opcional)
// router.use(validarMedico);

module.exports = router;