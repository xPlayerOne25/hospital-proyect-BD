// backend/server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🔗 Rutas de la API
app.use('/api/auth', require('./routes/auth'));
app.use('/api/citas', require('./routes/citas'));
app.use('/api/paciente', require('./routes/paciente'));
app.use('/api/pagos', require('./routes/pagos'));
app.use('/api/recepcionista', require('./routes/recepcionista'));
app.use('/api/medico', require('./routes/medico')); // 🆕 NUEVA RUTA MÉDICO
app.use('/api/bitacora', require('./routes/bitacora'));

// 🌐 Ruta básica de prueba
app.get('/', (req, res) => {
  res.json({ 
    message: '✅ API del Sistema Hospitalario funcionando correctamente',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    port: PORT,
    endpoints: {
      auth: '/api/auth',
      citas: '/api/citas',
      pacientes: '/api/paciente',
      pagos: '/api/pagos',
      recepcionista: '/api/recepcionista',
      medico: '/api/medico', // 🆕 NUEVO ENDPOINT
    }
  });
});

// 🧪 Ruta de prueba de base de datos
app.get('/api/test-db', async (req, res) => {
  try {
    const { executeQuery } = require('./config/database');
    const result = await executeQuery('SELECT COUNT(*) as total FROM PACIENTE');
    
    res.json({
      success: true,
      message: '✅ Conexión a base de datos exitosa',
      data: {
        pacientes: result.recordset[0].total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '❌ Error de conexión a base de datos',
      error: error.message
    });
  }
});

// ❌ Ruta no encontrada
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false,
    error: 'Ruta no encontrada',
    path: req.originalUrl,
    message: 'Verifica la documentación de la API'
  });
});

// 🔥 Manejo global de errores
app.use((err, req, res, next) => {
  console.error('💥 Error:', err.stack);
  res.status(500).json({ 
    success: false,
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Algo salió mal'
  });
});

// 🚀 Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📊 Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Endpoints principales disponibles:`);
  console.log(`   🧪 Test DB:                 GET /api/test-db`);
  console.log(`   
  🔐 AUTENTICACIÓN:`);
  console.log(`      Login:                   POST /api/auth/login`);
  console.log(`      Registro:                POST /api/auth/register-paciente`);
  console.log(`      Verificar token:         GET /api/auth/verify`);
  console.log(`   
  📅 CITAS:`);
  console.log(`      Generar cita:            POST /api/citas/generar`);
  console.log(`      Ver citas paciente:      GET /api/citas/paciente/:curp`);
  console.log(`      Ver médicos:             GET /api/citas/medicos/:especialidadId`);
  console.log(`   
  🏥 RECEPCIONISTA:`);
  console.log(`      Pacientes:               GET /api/recepcionista/pacientes`);
  console.log(`      Crear paciente:          POST /api/recepcionista/pacientes`);
  console.log(`      Actualizar paciente:     PUT /api/recepcionista/pacientes/:curp`);
  console.log(`      Doctores:                GET /api/recepcionista/doctores`);
  console.log(`      Crear doctor:            POST /api/recepcionista/doctores`);
  console.log(`      Crear usuario doctor:    POST /api/recepcionista/doctores/:cedula/usuario`);
  console.log(`      Dar baja doctor:         DELETE /api/recepcionista/doctores/:cedula`);
  console.log(`      Citas:                   GET /api/recepcionista/citas`);
  console.log(`      Cancelar cita:           PUT /api/recepcionista/citas/cancelar/:folio`);
  console.log(`      Cobros:                  GET /api/recepcionista/cobros`);
  console.log(`      Tickets:                 GET /api/recepcionista/tickets/:folio_cita`);
  console.log(`      Especialidades:          GET /api/recepcionista/especialidades`);
  console.log(`      Consultorios:            GET /api/recepcionista/consultorios`);
  console.log(`      Estadísticas:            GET /api/recepcionista/estadisticas`);
  console.log(`   
  🩺 MÉDICO:`);
  console.log(`      Perfil:                  GET /api/medico/perfil/:cedula`);
  console.log(`      Citas:                   GET /api/medico/citas/:cedula`);
  console.log(`      Recetas:                 GET /api/medico/recetas/:cedula`);
  console.log(`      Crear receta:            POST /api/medico/recetas`);
  console.log(`      Datos paciente:          GET /api/medico/pacientes/:curp`);
  console.log(`      Estadísticas:            GET /api/medico/estadisticas/:cedula`);
  console.log(`   
  💰 PAGOS:`);
  console.log(`      Ver pagos:               GET /api/pagos`);
});

module.exports = app;