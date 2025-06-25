const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { executeQuery } = require('../config/database');

// Función para generar JWT
const generateToken = (userId, userType, userInfo) => {
  return jwt.sign(
    { 
      userId, 
      userType,
      userInfo
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

// Función para crear hash compatible con MSSQL
function createMSSQLHash(password) {
  return crypto.createHash('sha256').update(password).digest('hex').toUpperCase();
}

// Función para comparar contraseñas
async function comparePassword(inputPassword, storedHash) {
  try {
    // Si el hash almacenado es un Buffer (desde MSSQL)
    if (Buffer.isBuffer(storedHash)) {
      const inputHash = createMSSQLHash(inputPassword);
      const storedHashHex = storedHash.toString('hex').toUpperCase();
      return inputHash === storedHashHex;
    }
    // Si el hash es un string (para futuras migraciones)
    else if (typeof storedHash === 'string') {
      // Comparación directa para hashes en formato hexadecimal
      if (/^[0-9A-F]{64}$/i.test(storedHash)) {
        const inputHash = createMSSQLHash(inputPassword);
        return inputHash === storedHash.toUpperCase();
      }
    }
    return false;
  } catch (error) {
    console.error('Error comparing passwords:', error);
    return false;
  }
}

// Login - Versión corregida
const login = async (req, res) => {
  try {
    const { usuario_nombre, contrasena } = req.body;

    // Validar campos requeridos
    if (!usuario_nombre || !contrasena) {
      return res.status(400).json({
        success: false,
        message: 'Usuario y contraseña son requeridos'
      });
    }

    // Buscar usuario en la base de datos
    const userQuery = `
      SELECT 
        u.id_usuario,
        u.usuario_nombre,
        u.usuario_correo,
        u.contrasena,
        tu.tipo_usuarioNombre,
        tu.tipo_usuarioDesc
      FROM USUARIO u
      INNER JOIN TIPO_USUARIO tu ON u.fk_id_tipoUsuario = tu.id_tipoUsuario
      WHERE u.usuario_nombre = @usuario_nombre
    `;

    const userResult = await executeQuery(userQuery, { usuario_nombre });

    if (userResult.recordset.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Usuario o contraseña incorrectos'
      });
    }

    const user = userResult.recordset[0];

    // Verificar contraseña
    const isValidPassword = await comparePassword(contrasena, user.contrasena);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Usuario o contraseña incorrectos'
      });
    }

    // Obtener información adicional según el tipo de usuario
    let additionalInfo = {};
    
    if (user.tipo_usuarioNombre === 'Paciente') {
      const pacienteQuery = `
        SELECT CURP, pac_nombre, pac_paterno, pac_materno, pac_tel
        FROM PACIENTE 
        WHERE fk_pac_id_usuario = @userId
      `;
      const pacienteResult = await executeQuery(pacienteQuery, { userId: user.id_usuario });
      if (pacienteResult.recordset.length > 0) {
        additionalInfo = pacienteResult.recordset[0];
      }
    } else if (user.tipo_usuarioNombre === 'Medico') {
      const medicoQuery = `
        SELECT 
          m.cedula,
          e.empleado_nombre,
          e.empleado_paterno,
          e.empleado_materno,
          esp.nombre_especialidad,
          c.consultorio_numero
        FROM MEDICO m
        INNER JOIN EMPLEADO e ON m.fk_med_id_empleado = e.id_empleado
        INNER JOIN ESPECIALIDAD esp ON m.fk_id_especialidad = esp.id_especialidad
        INNER JOIN CONSULTORIO c ON m.fk_id_consultorio = c.id_consultorio
        WHERE e.fk_empleado_id_usuario = @userId
      `;
      const medicoResult = await executeQuery(medicoQuery, { userId: user.id_usuario });
      if (medicoResult.recordset.length > 0) {
        additionalInfo = medicoResult.recordset[0];
      }
    } else if (user.tipo_usuarioNombre === 'Recepcionista' || user.tipo_usuarioNombre === 'Farmaceutico') {
      const empleadoQuery = `
        SELECT 
          e.id_empleado,
          e.empleado_nombre,
          e.empleado_paterno,
          e.empleado_materno,
          e.empleado_tel,
          e.empleado_correo
        FROM EMPLEADO e
        WHERE e.fk_empleado_id_usuario = @userId
      `;
      const empleadoResult = await executeQuery(empleadoQuery, { userId: user.id_usuario });
      if (empleadoResult.recordset.length > 0) {
        additionalInfo = empleadoResult.recordset[0];
      }
    }

    // Generar token
    const token = generateToken(user.id_usuario, user.tipo_usuarioNombre, additionalInfo);

    // Respuesta exitosa
    res.json({
      success: true,
      message: 'Login exitoso',
      data: {
        user: {
          id: user.id_usuario,
          usuario_nombre: user.usuario_nombre,
          usuario_correo: user.usuario_correo,
          tipo_usuario: user.tipo_usuarioNombre,
          tipo_descripcion: user.tipo_usuarioDesc,
          ...additionalInfo
        },
        token
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Registro de pacientes (auto-registro) - Versión corregida
const registerPaciente = async (req, res) => {
  try {
    const {
      usuario_nombre,
      usuario_correo,
      contrasena,
      CURP,
      pac_nombre,
      pac_paterno,
      pac_materno,
      pac_fechaNacimiento,
      pac_tel,
      direccion
    } = req.body;

    // Validar campos requeridos
    const requiredFields = ['usuario_nombre', 'usuario_correo', 'contrasena', 'CURP', 'pac_nombre', 'pac_paterno', 'pac_fechaNacimiento', 'pac_tel'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Campos requeridos faltantes: ${missingFields.join(', ')}`
      });
    }

    // Verificar que no exista el usuario o CURP
    const existingUserQuery = `
      SELECT COUNT(*) as count FROM USUARIO WHERE usuario_nombre = @usuario_nombre OR usuario_correo = @usuario_correo
    `;
    const existingUser = await executeQuery(existingUserQuery, { usuario_nombre, usuario_correo });
    
    if (existingUser.recordset[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: 'El usuario o correo ya existe'
      });
    }

    const existingCURPQuery = `SELECT COUNT(*) as count FROM PACIENTE WHERE CURP = @CURP`;
    const existingCURP = await executeQuery(existingCURPQuery, { CURP });
    
    if (existingCURP.recordset[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: 'El CURP ya está registrado'
      });
    }

    // Calcular edad
    const birthDate = new Date(pac_fechaNacimiento);
    const today = new Date();
    let edad = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      edad--;
    }

    // Insertar dirección primero
    const direccionQuery = `
      INSERT INTO DIRECCION (calle, numero, colonia, codigoPostal)
      OUTPUT INSERTED.id_direccion
      VALUES (@calle, @numero, @colonia, @codigoPostal)
    `;
    
    const direccionResult = await executeQuery(direccionQuery, {
      calle: direccion?.calle || 'N/A',
      numero: direccion?.numero || 'S/N',
      colonia: direccion?.colonia || 'N/A',
      codigoPostal: direccion?.codigoPostal || '00000'
    });

    const direccionId = direccionResult.recordset[0].id_direccion;

    // Crear hash compatible con MSSQL
    const passwordHash = createMSSQLHash(contrasena);

    // Insertar usuario
    const userQuery = `
      INSERT INTO USUARIO (fk_id_tipoUsuario, contrasena, usuario_nombre, usuario_correo)
      OUTPUT INSERTED.id_usuario
      VALUES (1, 0x${passwordHash}, @usuario_nombre, @usuario_correo)
    `;
    
    const userResult = await executeQuery(userQuery, {
      usuario_nombre,
      usuario_correo: usuario_correo
    });

    const userId = userResult.recordset[0].id_usuario;

    // Insertar paciente
    const pacienteQuery = `
      INSERT INTO PACIENTE (CURP, fk_pac_id_direccion, fk_pac_id_usuario, pac_nombre, pac_paterno, pac_materno, pac_fechaNacimiento, pac_edad, pac_tel)
      VALUES (@CURP, @direccionId, @userId, @pac_nombre, @pac_paterno, @pac_materno, @pac_fechaNacimiento, @edad, @pac_tel)
    `;
    
    await executeQuery(pacienteQuery, {
      CURP,
      direccionId,
      userId,
      pac_nombre,
      pac_paterno,
      pac_materno: pac_materno || null,
      pac_fechaNacimiento,
      edad,
      pac_tel
    });

    // Crear historial médico
    const historialQuery = `
      INSERT INTO HISTORIAL_MEDICO (fk_historialmed_CURP)
      VALUES (@CURP)
    `;
    await executeQuery(historialQuery, { CURP });

    res.status(201).json({
      success: true,
      message: 'Paciente registrado exitosamente',
      data: {
        userId,
        CURP,
        pac_nombre,
        pac_paterno
      }
    });

  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar paciente',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Verificar token
const verifyToken = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token no proporcionado'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    res.json({
      success: true,
      data: decoded
    });

  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Token inválido'
    });
  }
};

module.exports = {
  login,
  registerPaciente,
  verifyToken,
  createMSSQLHash,
  comparePassword
};