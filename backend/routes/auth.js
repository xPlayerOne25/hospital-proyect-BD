const express = require('express');
const router = express.Router();
const { login, registerPaciente, verifyToken } = require('../controllers/authController');

// @route   POST /api/auth/login
// @desc    Login de usuario
// @access  Public
router.post('/login', login);

// @route   POST /api/auth/register-paciente
// @desc    Registro de paciente (auto-registro)
// @access  Public
router.post('/register-paciente', registerPaciente);

// @route   GET /api/auth/verify
// @desc    Verificar token
// @access  Private
router.get('/verify', verifyToken);

// @route   GET /api/auth/test
// @desc    Ruta de prueba
// @access  Public
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Rutas de autenticación funcionando correctamente',
    endpoints: {
      login: 'POST /api/auth/login',
      register: 'POST /api/auth/register-paciente',
      verify: 'GET /api/auth/verify'
    }
  });
});

module.exports = router;