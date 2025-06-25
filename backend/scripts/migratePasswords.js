const { executeQuery } = require('./config/database');
const { generateMSSQLHash } = require('./controllers/authController');

async function migrateUserPasswords() {
  try {
    console.log('Iniciando migración de contraseñas...');
    
    // Obtener todos los usuarios
    const users = await executeQuery('SELECT id_usuario, contrasena FROM USUARIO');
    
    for (const user of users.recordset) {
      // Generar nuevo hash (asumiendo que la contraseña es '123456')
      const newHash = generateMSSQLHash(DEFAULT_PASSWORD);
      
      // Actualizar en la base de datos
      await executeQuery(
        `UPDATE USUARIO SET contrasena = ${newHash} WHERE id_usuario = @id`,
        { id: user.id_usuario }
      );
      
      console.log(`Actualizado usuario ID: ${user.id_usuario}`);
    }
    
    console.log('Migración completada exitosamente');
  } catch (error) {
    console.error('Error en migración:', error);
  } finally {
    process.exit();
  }
}

migrateUserPasswords();