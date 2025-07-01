// src/pages/auth/Register.jsx - CORREGIDO
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../styles/components.css';

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
    <div className="modern-auth-container">
      <div className="modern-auth-background">
        <div className="auth-pattern"></div>
      </div>
      
      <div className="modern-auth-content register-layout">
        <div className="auth-form-section register-form">
          <div className="auth-form-container">
            <div className="form-header">
              <h2 className="form-title">Crear Cuenta</h2>
              <p className="form-subtitle">Regístrate como paciente</p>
            </div>

            {error && (
              <div className="modern-alert modern-alert-error">
                <span className="alert-icon">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="modern-alert modern-alert-success">
                <span className="alert-icon">✅</span>
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="modern-form">
              {/* Datos de usuario */}
              <div className="row">
                <div className="col-md-6">
                  <div className="form-group-modern">
                    <label className="form-label-modern">Nombre de Usuario *</label>
                    <div className="input-container">
                      <span className="input-icon">👤</span>
                      <input
                        type="text"
                        className="form-input-modern"
                        name="usuario_nombre"
                        value={formData.usuario_nombre}
                        onChange={handleChange}
                        placeholder="Ej: juan.perez"
                        required
                      />
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group-modern">
                    <label className="form-label-modern">Correo Electrónico *</label>
                    <div className="input-container">
                      <span className="input-icon">📧</span>
                      <input
                        type="email"
                        className="form-input-modern"
                        name="usuario_correo"
                        value={formData.usuario_correo}
                        onChange={handleChange}
                        placeholder="correo@ejemplo.com"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-md-6">
                  <div className="form-group-modern">
                    <label className="form-label-modern">Contraseña *</label>
                    <div className="input-container">
                      <span className="input-icon">🔒</span>
                      <input
                        type="password"
                        className="form-input-modern"
                        name="contrasena"
                        value={formData.contrasena}
                        onChange={handleChange}
                        placeholder="Mínimo 6 caracteres"
                        required
                      />
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group-modern">
                    <label className="form-label-modern">Confirmar Contraseña *</label>
                    <div className="input-container">
                      <span className="input-icon">🔒</span>
                      <input
                        type="password"
                        className="form-input-modern"
                        name="confirmarContrasena"
                        value={formData.confirmarContrasena}
                        onChange={handleChange}
                        placeholder="Repite tu contraseña"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Datos personales */}
              <div className="row">
                <div className="col-md-4">
                  <div className="form-group-modern">
                    <label className="form-label-modern">Nombre(s) *</label>
                    <div className="input-container">
                      <span className="input-icon">👤</span>
                      <input
                        type="text"
                        className="form-input-modern"
                        name="pac_nombre"
                        value={formData.pac_nombre}
                        onChange={handleChange}
                        placeholder="Juan Carlos"
                        required
                      />
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="form-group-modern">
                    <label className="form-label-modern">Apellido Paterno *</label>
                    <div className="input-container">
                      <span className="input-icon">👨</span>
                      <input
                        type="text"
                        className="form-input-modern"
                        name="pac_paterno"
                        value={formData.pac_paterno}
                        onChange={handleChange}
                        placeholder="Pérez"
                        required
                      />
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="form-group-modern">
                    <label className="form-label-modern">Apellido Materno</label>
                    <div className="input-container">
                      <span className="input-icon">👩</span>
                      <input
                        type="text"
                        className="form-input-modern"
                        name="pac_materno"
                        value={formData.pac_materno}
                        onChange={handleChange}
                        placeholder="García"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-md-6">
                  <div className="form-group-modern">
                    <label className="form-label-modern">CURP *</label>
                    <div className="input-container">
                      <span className="input-icon">🆔</span>
                      <input
                        type="text"
                        className="form-input-modern font-monospace"
                        name="CURP"
                        value={formData.CURP}
                        onChange={handleChange}
                        maxLength="18"
                        style={{ textTransform: 'uppercase' }}
                        placeholder="PEGG850615HDFRZN01"
                        required
                      />
                    </div>
                    <small className="form-hint">18 caracteres del CURP oficial</small>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group-modern">
                    <label className="form-label-modern">Fecha de Nacimiento *</label>
                    <div className="input-container">
                      <span className="input-icon">📅</span>
                      <input
                        type="date"
                        className="form-input-modern"
                        name="pac_fechaNacimiento"
                        value={formData.pac_fechaNacimiento}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="form-group-modern">
                <label className="form-label-modern">Teléfono *</label>
                <div className="input-container">
                  <span className="input-icon">📱</span>
                  <input
                    type="tel"
                    className="form-input-modern"
                    name="pac_tel"
                    value={formData.pac_tel}
                    onChange={handleChange}
                    maxLength="10"
                    placeholder="5512345678"
                    required
                  />
                </div>
                <small className="form-hint">10 dígitos sin espacios ni guiones</small>
              </div>

              <button 
                type="submit" 
                className="btn-modern btn-modern-primary"
                disabled={loading}
                style={{ width: '100%' }}
              >
                {loading ? (
                  <>
                    <span className="loading-spinner"></span>
                    Creando cuenta...
                  </>
                ) : (
                  'Crear Cuenta ✓'
                )}
              </button>

              <div className="form-footer">
                <p>¿Ya tienes cuenta? 
                  <Link to="/login" className="link-modern">Inicia sesión aquí</Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;