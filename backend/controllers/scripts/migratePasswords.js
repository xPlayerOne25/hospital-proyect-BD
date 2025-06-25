const { executeQuery } = require('./config/database');
const crypto = require('crypto');

// Función compatible con tu configuración
function generateMSSQLHash(password) {
  return `0x${crypto.createHash('sha256').update(password, 'utf8').digest('hex').toUpperCase()}`;
}

async function migrateUserPasswords() {
  try {
    console.log('🚀 Iniciando migración de contraseñas...');
    
    // 1. Obtener todos los usuarios
    const users = await executeQuery('SELECT id_usuario, contrasena FROM USUARIO');
    console.log(`🔍 Encontrados ${users.recordset.length} usuarios para migrar`);
    
    // 2. Migrar cada usuario
    for (const [index, user] of users.recordset.entries()) {
      const newHash = generateMSSQLHash('123456'); // Contraseña por defecto
      
      // 3. Actualizar en la base de datos
      await executeQuery(
        `UPDATE USUARIO SET contrasena = CONVERT(VARBINARY(MAX), ${newHash}) WHERE id_usuario = @id`,
        { id: user.id_usuario }
      );
      
      // Mostrar progreso cada 10 usuarios
      if ((index + 1) % 10 === 0) {
        console.log(`🔄 Migrados ${index + 1}/${users.recordset.length} usuarios`);
      }
    }
    
    console.log('✅ Migración completada exitosamente');
  } catch (error) {
    console.error('❌ Error durante la migración:', error.message);
  } finally {
    process.exit();
  }
}

migrateUserPasswords();