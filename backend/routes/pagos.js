//backend/routes/pagos.js
const express = require('express');
const router = express.Router();

const {
  crearOrdenPaypal,
  capturarOrdenPaypal, 
  pagarConTarjeta
} = require('../controllers/pagoController');

// Crear orden PayPal
router.post('/crear-orden', crearOrdenPaypal);

// 🔧 FIX: Capturar orden PayPal (esta ruta faltaba)
router.post('/capturar/:token', capturarOrdenPaypal);

// Pago con tarjeta
router.post('/tarjeta', pagarConTarjeta);

module.exports = router;