const { executeQuery } = require('./config/database');
const crypto = require('crypto');

function generateMSSQLHash(password) {
  return `0x${crypto.createHash('sha256').update(password, 'utf8').digest('hex').toUpperCase()}`;
}

async function testHashing() {
  try {
    console.log('🧪 Iniciando pruebas de hashing...');
    const testPassword = '123456';
    
    // 1. Generar hash en Node.js
    const nodeHash = generateMSSQLHash(testPassword);
    console.log('🔑 Hash generado en Node.js:', nodeHash);
    
    // 2. Generar hash directo en MSSQL
    const sqlResult = await executeQuery(
      `SELECT HASHBYTES('SHA2_256', @password) as hash`,
      { password: testPassword }
    );
    
    const sqlHash = `0x${sqlResult.recordset[0].hash.toString('hex').toUpperCase()}`;
    console.log('💾 Hash generado en MSSQL:', sqlHash);
    
    // 3. Comparación
    console.log('🔍 Comparando hashes...');
    if (nodeHash === sqlHash) {
      console.log('✅ Los hashes coinciden perfectamente');
    } else {
      console.log('❌ Los hashes NO coinciden');
      console.log('Diferencia:', {
        nodeLength: nodeHash.length,
        sqlLength: sqlHash.length,
        nodeStart: nodeHash.substring(0, 20),
        sqlStart: sqlHash.substring(0, 20)
      });
    }
    
    // 4. Verificar con usuarios existentes
    console.log('\n🔎 Verificando con usuarios existentes...');
    const testUser = await executeQuery(
      `SELECT TOP 1 id_usuario FROM USUARIO WHERE contrasena = CONVERT(VARBINARY(MAX), ${nodeHash})`
    );
    
    if (testUser.recordset.length > 0) {
      console.log(`👤 Usuario encontrado con este hash (ID: ${testUser.recordset[0].id_usuario})`);
    } else {
      console.log('⚠️ No se encontraron usuarios con este hash');
    }
    
  } catch (error) {
    console.error('❌ Error en las pruebas:', error.message);
  } finally {
    process.exit();
  }
}

testHashing();