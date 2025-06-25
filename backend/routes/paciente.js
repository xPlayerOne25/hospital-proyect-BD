const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const {
  obtenerPerfil,
  actualizarPerfil
} = require('../controllers/pacienteController');

// Ruta para obtener el perfil del paciente
router.get('/perfil', authenticateToken, obtenerPerfil);

// Ruta para actualizar el perfil del paciente
router.put('/perfil', authenticateToken, actualizarPerfil);

module.exports = router;
