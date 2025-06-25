const { executeQuery } = require('./config/database');
const { generateMSSQLHash } = require('./controllers/authController');

async function testHashing() {
  const testPassword = '123456';
  
  console.log('=== Prueba de Hashing ===');
  
  // 1. Generar hash en Node.js
  const nodeHash = generateMSSQLHash(testPassword);
  console.log('Hash generado en Node.js:', nodeHash);
  
  // 2. Generar hash directamente en MSSQL
  const sqlResult = await executeQuery(
    "SELECT HASHBYTES('SHA2_256', @password) as hash",
    { password: testPassword }
  );
  const sqlHash = `0x${sqlResult.recordset[0].hash.toString('hex').toUpperCase()}`;
  console.log('Hash generado en MSSQL:', sqlHash);
  
  // 3. Comparación
  console.log('¿Los hashes coinciden?:', nodeHash === sqlHash);
  
  // 4. Verificar con la base de datos
  const userResult = await executeQuery(
    `SELECT TOP 1 id_usuario FROM USUARIO WHERE contrasena = ${nodeHash}`
  );
  console.log('Usuarios con este hash:', userResult.recordset.length);
}

testHashing().then(() => process.exit());