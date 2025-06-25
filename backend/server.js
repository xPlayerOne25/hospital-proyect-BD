const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;


// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ruta básica de prueba
app.get('/', (req, res) => {
  res.json({ 
    message: 'API del Sistema Hospitalario funcionando correctamente',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/auth',
      citas: '/api/citas',
      pacientes: '/api/pacientes (próximamente)',
      medicos: '/api/medicos (próximamente)',
      farmacia: '/api/farmacia (próximamente)'
    }
  });
});

// Rutas de la API
app.use('/api/auth', require('./routes/auth'));
app.use('/api/citas', require('./routes/citas'));
app.use('/api/pacientes', require('./routes/paciente'));

// Rutas que crearemos después
// app.use('/api/pacientes', require('./routes/pacientes'));
// app.use('/api/medicos', require('./routes/medicos'));
// app.use('/api/farmacia', require('./routes/farmacia'));

// Ruta de prueba de base de datos
app.get('/api/test-db', async (req, res) => {
  try {
    const { executeQuery } = require('./config/database');
    
    const result = await executeQuery('SELECT COUNT(*) as total FROM PACIENTE');
    
    res.json({
      success: true,
      message: 'Conexión a base de datos exitosa',
      data: {
        pacientes: result.recordset[0].total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error de conexión a base de datos',
      error: error.message
    });
  }
});

// Manejo de errores 404
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false,
    error: 'Ruta no encontrada',
    path: req.originalUrl,
    message: 'Verifica la documentación de la API'
  });
});

// Manejo global de errores
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ 
    success: false,
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Algo salió mal'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📊 Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Endpoints disponibles:`);
  console.log(`   💾 Base de datos: GET /api/test-db`);
  console.log(`   🔐 Autenticación: POST /api/auth/login`);
  console.log(`   📝 Registro: POST /api/auth/register-paciente`);
  console.log(`   ✅ Verificar token: GET /api/auth/verify`);
  console.log(`   🏥 Especialidades: GET /api/citas/especialidades`);
  console.log(`   👨‍⚕️ Médicos: GET /api/citas/medicos/:especialidadId`);
  console.log(`   📅 Generar cita: POST /api/citas/generar`);
  console.log(`   🔄 Actualizar estatus: PUT /api/citas/:folio/estatus`);
  console.log(`   👀 Ver citas:`);
  console.log(`      👤 Por paciente: GET /api/citas/paciente/:curp`);
  console.log(`      👨‍⚕️ Por médico: GET /api/citas/medico/:cedula`);
  console.log(`      🔍 Detalle cita: GET /api/citas/:folio_cita`);
});

module.exports = app;