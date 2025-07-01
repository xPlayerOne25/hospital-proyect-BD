//config/database.js
const sql = require('mssql');

// Configuración de la conexión a SQL Server
const config = {
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_DATABASE || 'HospitalDB',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT) || 1433,
  options: {
    encrypt: false, // Para conexiones locales
    trustServerCertificate: true, // Para desarrollo local
    enableArithAbort: true,
    requestTimeout: 30000,
    connectionTimeout: 30000,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

let poolConnection = null;

// Función para obtener la conexión
async function getConnection() {
  try {
    if (poolConnection) {
      return poolConnection;
    }

    poolConnection = await sql.connect(config);
    console.log('✅ Conexión a SQL Server establecida correctamente');
    return poolConnection;
  } catch (error) {
    console.error('❌ Error al conectar con SQL Server:', error.message);
    throw error;
  }
}

// Función para cerrar la conexión
async function closeConnection() {
  try {
    if (poolConnection) {
      await poolConnection.close();
      poolConnection = null;
      console.log('🔒 Conexión a SQL Server cerrada');
    }
  } catch (error) {
    console.error('❌ Error al cerrar la conexión:', error.message);
  }
}

// Función para ejecutar consultas
async function executeQuery(query, params = {}) {
  try {
    const pool = await getConnection();
    const request = pool.request();
    
    // Agregar parámetros si existen
    for (const [key, value] of Object.entries(params)) {
      request.input(key, value);
    }
    
    const result = await request.query(query);
    return result;
  } catch (error) {
    console.error('❌ Error ejecutando consulta:', error.message);
    throw error;
  }
}

// Función para ejecutar stored procedures
async function executeStoredProcedure(procedureName, params = {}) {
  try {
    const pool = await getConnection();
    const request = pool.request();
    
    // Agregar parámetros
    for (const [key, value] of Object.entries(params)) {
      request.input(key, value);
    }
    
    const result = await request.execute(procedureName);
    return result;
  } catch (error) {
    console.error('❌ Error ejecutando stored procedure:', error.message);
    throw error;
  }
}

// Manejo de cierre graceful
process.on('SIGINT', async () => {
  console.log('\n🔄 Cerrando aplicación...');
  await closeConnection();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🔄 Cerrando aplicación...');
  await closeConnection();
  process.exit(0);
});

module.exports = {
  sql,
  getConnection,
  closeConnection,
  executeQuery,
  executeStoredProcedure
};