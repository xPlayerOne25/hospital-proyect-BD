const express = require('express');
const router = express.Router();

// Middleware de autenticación
const authenticateToken = require('../middleware/auth');

// Controladores
const {
  getEspecialidades,
  getMedicosByEspecialidad,
  generarCita,
  actualizarEstatusCita,
  getCitasPaciente
} = require('../controllers/citaController');

// Obtener todas las especialidades (público)
router.get('/especialidades', getEspecialidades);

// Obtener médicos por especialidad (público)
router.get('/medicos/:especialidadId', getMedicosByEspecialidad);

// Generar nueva cita (requiere autenticación)
router.post('/generar', authenticateToken, generarCita);

// Actualizar estatus de cita (requiere autenticación)
router.put('/:folio/estatus', authenticateToken, actualizarEstatusCita);

// Obtener citas del paciente autenticado
router.get('/paciente', authenticateToken, getCitasPaciente);

module.exports = router;
