const { sql, executeStoredProcedure } = require('../config/database');

exports.obtenerPerfil = async (req, res) => {
  try {
    const result = await executeStoredProcedure('sp_getPerfilPaciente', {
      curp: req.user.curp
    });

    const datos = result.recordset[0];

    if (!datos) {
      return res.status(404).json({ success: false, message: 'Paciente no encontrado' });
    }

    res.json(datos); // Ya incluye usuario_correo desde el SP
  } catch (error) {
    console.error('❌ Error al obtener perfil:', error);
    res.status(500).json({ success: false, message: 'Error al obtener perfil' });
  }
};

exports.actualizarPerfil = async (req, res) => {
  try {
    const {
      pac_nombre,
      pac_paterno,
      pac_materno,
      pac_tel,
      pac_fechaNacimiento,
      usuario_correo,
      usuario_nombre // a
    } = req.body;

    const parametros = {
      curp: req.user.curp,
      nombre: pac_nombre,
      paterno: pac_paterno,
      materno: pac_materno,
      telefono: pac_tel,
      fechaNacimiento: pac_fechaNacimiento,
      correo: usuario_correo, // 👈 clave correcta
      nombreUsuario: usuario_nombre // 👈 clave correcta
    };

    console.log("📤 Enviando al SP:", parametros); // Útil para depuración

    await executeStoredProcedure('sp_actualizarPerfilPaciente', parametros);

    res.json({ success: true, message: '✅ Perfil actualizado correctamente' });
  } catch (error) {
    console.error('❌ Error al actualizar perfil:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar perfil' });
  }
};
