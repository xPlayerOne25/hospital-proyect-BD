// middleware/auth.js - Contenido completo

const jwt = require('jsonwebtoken');

module.exports = function authenticateToken(req, res, next) {
  console.log('🔍 Middleware ejecutándose...');
  console.log('📋 Headers recibidos:', req.headers);
  
  const authHeader = req.headers['authorization'];
  console.log('🔐 Auth header:', authHeader);
  
  const token = authHeader && authHeader.split(' ')[1];
  console.log('🎫 Token extraído:', token ? token.substring(0, 20) + '...' : 'No token');
  
  if (!token) {
    console.error('❌ Token no proporcionado');
    return res.status(401).json({
      success: false,
      message: 'Token no proporcionado'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.error('❌ Error al verificar token:', err.message);
      return res.status(403).json({
        success: false,
        message: 'Token inválido'
      });
    }
    
    console.log('✅ Token decodificado completo:', decoded);
    console.log('👤 UserInfo:', decoded.userInfo);
    
    // Extraer CURP de la estructura correcta
    const paciente_curp = decoded.userInfo?.CURP;
    console.log('🆔 CURP extraído:', paciente_curp);
    
    if (!paciente_curp) {
      console.error('❌ CURP no encontrado en userInfo:', decoded.userInfo);
      return res.status(403).json({
        success: false,
        message: 'CURP no encontrado en el token'
      });
    }
    
    // Asignar a req.user
    req.user = {
      curp: paciente_curp.trim(),
      ...decoded.userInfo,
      userId: decoded.userId,
      userType: decoded.userType
    };
    
    console.log('✅ Usuario asignado a req.user:', {
      curp: req.user.curp,
      nombre: req.user.pac_nombre,
      tipo: req.user.userType
    });
    
    next();
  });
};