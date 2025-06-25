import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { register } = useAuth();

  const [formData, setFormData] = useState({
    usuario_nombre: '',
    usuario_correo: '',
    contrasena: '',
    confirmarContrasena: '',
    pac_nombre: '',
    pac_paterno: '',
    pac_materno: '',
    pac_fechaNacimiento: '',
    pac_tel: '',
    CURP: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    const requiredFields = [
      'usuario_nombre', 'usuario_correo', 'contrasena', 'pac_nombre', 
      'pac_paterno', 'pac_fechaNacimiento', 'pac_tel', 'CURP'
    ];

    for (let field of requiredFields) {
      if (!formData[field] || formData[field].trim() === '') {
        return `El campo ${field.replace('_', ' ')} es requerido`;
      }
    }

    if (formData.contrasena.length < 6) {
      return 'La contraseña debe tener al menos 6 caracteres';
    }

    if (formData.contrasena !== formData.confirmarContrasena) {
      return 'Las contraseñas no coinciden';
    }

    const curpRegex = /^[A-Z]{4}[0-9]{6}[HM][A-Z]{5}[0-9A-Z][0-9]$/;
    if (!curpRegex.test(formData.CURP.toUpperCase())) {
      return 'El CURP no tiene un formato válido';
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(formData.pac_tel)) {
      return 'El teléfono debe tener 10 dígitos';
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const { confirmarContrasena, ...dataToSend } = formData;
      dataToSend.CURP = dataToSend.CURP.toUpperCase();

      const response = await register(dataToSend);

      if (response.success) {
        setSuccess('¡Registro exitoso! Serás redirigido al login en 3 segundos...');
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setError(response.message || 'Error en el registro');
      }

    } catch (error) {
      setError(error.response?.data?.message || 'Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ maxWidth: '600px' }}>
        <div className="auth-header">
          <h1 className="auth-title">🏥 Hospital System</h1>
          <p className="auth-subtitle">Registro de Paciente</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          {/* Datos de usuario */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Nombre de Usuario *</label>
              <input
                type="text"
                className="form-input"
                name="usuario_nombre"
                value={formData.usuario_nombre}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Correo Electrónico *</label>
              <input
                type="email"
                className="form-input"
                name="usuario_correo"
                value={formData.usuario_correo}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Contraseña *</label>
              <input
                type="password"
                className="form-input"
                name="contrasena"
                value={formData.contrasena}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Confirmar Contraseña *</label>
              <input
                type="password"
                className="form-input"
                name="confirmarContrasena"
                value={formData.confirmarContrasena}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Datos personales */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Nombre(s) *</label>
              <input
                type="text"
                className="form-input"
                name="pac_nombre"
                value={formData.pac_nombre}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Apellido Paterno *</label>
              <input
                type="text"
                className="form-input"
                name="pac_paterno"
                value={formData.pac_paterno}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Apellido Materno</label>
              <input
                type="text"
                className="form-input"
                name="pac_materno"
                value={formData.pac_materno}
                onChange={handleChange}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div className="form-group">
              <label className="form-label">CURP *</label>
              <input
                type="text"
                className="form-input"
                name="CURP"
                value={formData.CURP}
                onChange={handleChange}
                maxLength="18"
                style={{ textTransform: 'uppercase' }}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Fecha de Nacimiento *</label>
              <input
                type="date"
                className="form-input"
                name="pac_fechaNacimiento"
                value={formData.pac_fechaNacimiento}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Teléfono *</label>
            <input
              type="tel"
              className="form-input"
              name="pac_tel"
              value={formData.pac_tel}
              onChange={handleChange}
              maxLength="10"
              placeholder="10 dígitos"
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-lg" 
            style={{ width: '100%' }}
            disabled={loading}
          >
            {loading ? 'Registrando...' : 'Crear Cuenta'}
          </button>

          <div className="text-center mt-3">
            <Link to="/login" className="link">
              ¿Ya tienes cuenta? Inicia sesión aquí
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;