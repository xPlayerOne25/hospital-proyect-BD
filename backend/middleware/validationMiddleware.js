// backend/middleware/validationMiddleware.js

// Validación para crear doctor
const validateDoctor = (req, res, next) => {
  console.log('🔍 [validateDoctor] Validando datos del doctor:', req.body);
  
  const {
    cedula,
    empleado_nombre,
    empleado_paterno,
    empleado_correo,
    especialidad_id,
    empleado_tel
  } = req.body;

  const errores = [];

  // Validaciones obligatorias
  if (!cedula || cedula.trim() === '') {
    errores.push('Cédula es obligatoria');
  }

  if (!empleado_nombre || empleado_nombre.trim() === '') {
    errores.push('Nombre es obligatorio');
  }

  if (!empleado_paterno || empleado_paterno.trim() === '') {
    errores.push('Apellido paterno es obligatorio');
  }

  if (!empleado_correo || empleado_correo.trim() === '') {
    errores.push('Correo es obligatorio');
  } else if (!/\S+@\S+\.\S+/.test(empleado_correo)) {
    errores.push('Correo debe tener formato válido');
  }

  if (!especialidad_id) {
    errores.push('Especialidad es obligatoria');
  } else if (isNaN(parseInt(especialidad_id))) {
    errores.push('Especialidad debe ser un número válido');
  }

  if (!empleado_tel || empleado_tel.trim() === '') {
    errores.push('Teléfono es obligatorio');
  }

  if (errores.length > 0) {
    console.log('❌ [validateDoctor] Errores de validación:', errores);
    return res.status(400).json({
      success: false,
      message: 'Errores de validación',
      errores: errores
    });
  }

  console.log('✅ [validateDoctor] Validación exitosa');
  next();
};

// Validación simple para cédula
const validateCedula = (req, res, next) => {
  const { cedula } = req.params;
  
  if (!cedula || cedula.trim() === '') {
    return res.status(400).json({
      success: false,
      message: 'Cédula es obligatoria'
    });
  }
  
  next();
};

// Validación para CURP
const validateCURP = (req, res, next) => {
  const { curp } = req.params;
  
  if (!curp || curp.trim() === '') {
    return res.status(400).json({
      success: false,
      message: 'CURP es obligatorio'
    });
  }
  
  next();
};

// Validación para crear paciente
const validateCrearPaciente = (req, res, next) => {
  const {
    curp,
    nombre,
    apellido_paterno,
    correo
  } = req.body;

  const errores = [];

  if (!curp || curp.trim() === '') {
    errores.push('CURP es obligatorio');
  }

  if (!nombre || nombre.trim() === '') {
    errores.push('Nombre es obligatorio');
  }

  if (!apellido_paterno || apellido_paterno.trim() === '') {
    errores.push('Apellido paterno es obligatorio');
  }

  if (!correo || correo.trim() === '') {
    errores.push('Correo es obligatorio');
  } else if (!/\S+@\S+\.\S+/.test(correo)) {
    errores.push('Correo debe tener formato válido');
  }

  if (errores.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Errores de validación',
      errores: errores
    });
  }

  next();
};

// Validación para actualizar paciente
const validatePaciente = (req, res, next) => {
  const {
    nombre,
    apellido_paterno
  } = req.body;

  const errores = [];

  if (!nombre || nombre.trim() === '') {
    errores.push('Nombre es obligatorio');
  }

  if (!apellido_paterno || apellido_paterno.trim() === '') {
    errores.push('Apellido paterno es obligatorio');
  }

  if (errores.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Errores de validación',
      errores: errores
    });
  }

  next();
};

// Validaciones para citas
const validateFolio = (req, res, next) => {
  const { folio } = req.params;
  
  if (!folio || folio.trim() === '') {
    return res.status(400).json({
      success: false,
      message: 'Folio es obligatorio'
    });
  }
  
  next();
};

const validateFolioCita = (req, res, next) => {
  const { folio_cita } = req.params;
  
  if (!folio_cita || folio_cita.trim() === '') {
    return res.status(400).json({
      success: false,
      message: 'Folio de cita es obligatorio'
    });
  }
  
  next();
};

const validateCancelarCita = (req, res, next) => {
  const { folio } = req.params;
  
  if (!folio || folio.trim() === '') {
    return res.status(400).json({
      success: false,
      message: 'Folio es obligatorio para cancelar cita'
    });
  }
  
  next();
};

module.exports = {
  validateDoctor,
  validateCedula,
  validateCURP,
  validateCrearPaciente,
  validatePaciente,
  validateFolio,
  validateFolioCita,
  validateCancelarCita
};