// test-db.js - Con debug de variables de entorno
require('dotenv').config();
const { executeQuery } = require('./config/database');

// Debug de variables de entorno
console.log('🔍 Debug de variables de entorno:');
console.log('DB_SERVER:', process.env.DB_SERVER);
console.log('DB_DATABASE:', process.env.DB_DATABASE);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '***CONFIGURADA***' : 'NO CONFIGURADA');
console.log('DB_PORT:', process.env.DB_PORT);
console.log('');

async function testConnection() {
    try {
        console.log('🔄 Probando conexión a la base de datos...');
        
        // Verificar que las variables están cargadas
        if (!process.env.DB_USER) {
            throw new Error('DB_USER no está configurado en .env');
        }
        if (!process.env.DB_PASSWORD) {
            throw new Error('DB_PASSWORD no está configurado en .env');
        }
        
        // Prueba 1: Consulta simple
        const result1 = await executeQuery('SELECT COUNT(*) AS total FROM PACIENTE');
        console.log('✅ Pacientes en DB:', result1.recordset[0].total);
        
        // Prueba 2: Consulta de especialidades
        const result2 = await executeQuery('SELECT COUNT(*) AS total FROM ESPECIALIDAD');
        console.log('✅ Especialidades en DB:', result2.recordset[0].total);
        
        // Prueba 3: Consulta de médicos
        const result3 = await executeQuery(`
            SELECT 
                m.cedula,
                e.empleado_nombre + ' ' + e.empleado_paterno AS nombre_medico,
                esp.nombre_especialidad
            FROM MEDICO m
            INNER JOIN EMPLEADO e ON m.fk_med_id_empleado = e.id_empleado
            INNER JOIN ESPECIALIDAD esp ON m.fk_id_especialidad = esp.id_especialidad
        `);
        
        console.log('✅ Médicos encontrados:', result3.recordset.length);
        console.log('👨‍⚕️ Primer médico:', result3.recordset[0]);
        
        console.log('\n🎉 ¡Conexión exitosa! Base de datos funcionando correctamente.');
        
    } catch (error) {
        console.error('❌ Error de conexión:', error.message);
        console.error('🔧 Verifica tu archivo .env y la configuración de SQL Server');
    }
}

// Ejecutar la prueba
testConnection();