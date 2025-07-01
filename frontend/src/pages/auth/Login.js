// src/pages/auth/Login.jsx - CORREGIDO
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../styles/components.css';

const Login = () => {
  const [formData, setFormData] = useState({
    usuario_nombre: '',
    contrasena: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await login(formData);
      
      if (result.success) {
        switch (result.user.tipo_usuario) {
          case 'Paciente':
            navigate('/paciente');
            break;
          case 'Medico':
            navigate('/medico');
            break;
          case 'Recepcionista':
            navigate('/recepcionista');
            break;
          case 'Farmaceutico':
            navigate('/farmacia');
            break;
          default:
            navigate('/');
        }
      } else {
        setError(result.message || 'Error al iniciar sesión');
      }
    } catch (error) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const fillTestData = (userType) => {
    const testUsers = {
      paciente: { usuario_nombre: 'juan.perez', contrasena: '123456' },
      medico: { usuario_nombre: 'dr.gonzalez', contrasena: '123456' },
      recepcionista: { usuario_nombre: 'recep.sofia', contrasena: '123456' },
      farmaceutico: { usuario_nombre: 'farm.pedro', contrasena: '123456' }
    };
    
    setFormData(testUsers[userType]);
  };

  return (
    <div className="modern-auth-container">
      <div className="modern-auth-background">
        <div className="auth-pattern"></div>
      </div>
      
      <div className="modern-auth-content">
        {/* Left side - Branding */}
        <div className="auth-branding">
          <div className="brand-content">
            <div className="brand-icon">
              <div className="medical-cross">
                <div className="cross-horizontal"></div>
                <div className="cross-vertical"></div>
              </div>
            </div>
            <h1 className="brand-title">Hospital System</h1>
            <p className="brand-subtitle">
              Plataforma médica integral para pacientes y profesionales de la salud
            </p>
            <div className="brand-features">
              <div className="feature-item">
                <span className="feature-icon">🏥</span>
                <span>Gestión hospitalaria completa</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">👨‍⚕️</span>
                <span>Para médicos y pacientes</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">📱</span>
                <span>Acceso desde cualquier dispositivo</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Login Form */}
        <div className="auth-form-section">
          <div className="auth-form-container">
            <div className="form-header">
              <h2 className="form-title">Iniciar Sesión</h2>
              <p className="form-subtitle">Accede a tu cuenta</p>
            </div>

            {error && (
              <div className="modern-alert modern-alert-error">
                <span className="alert-icon">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="modern-form">
              <div className="form-group-modern">
                <label className="form-label-modern">Usuario</label>
                <div className="input-container">
                  <span className="input-icon">👤</span>
                  <input
                    type="text"
                    value={formData.usuario_nombre}
                    onChange={(e) => setFormData({...formData, usuario_nombre: e.target.value})}
                    className="form-input-modern"
                    placeholder="Ingresa tu usuario"
                    required
                  />
                </div>
              </div>

              <div className="form-group-modern">
                <label className="form-label-modern">Contraseña</label>
                <div className="input-container">
                  <span className="input-icon">🔒</span>
                  <input
                    type="password"
                    value={formData.contrasena}
                    onChange={(e) => setFormData({...formData, contrasena: e.target.value})}
                    className="form-input-modern"
                    placeholder="Ingresa tu contraseña"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn-modern btn-modern-primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="loading-spinner"></span>
                    Iniciando...
                  </>
                ) : (
                  <>
                    <span>Iniciar Sesión</span>
                    <span className="btn-arrow">→</span>
                  </>
                )}
              </button>

              <div className="form-divider">
                <span>o accede como</span>
              </div>

              {/* Test user buttons */}
              <div className="test-users-grid">
                <button 
                  type="button"
                  className="test-user-btn"
                  onClick={() => fillTestData('paciente')}
                >
                  <span className="test-user-icon">👤</span>
                  <span>Paciente</span>
                </button>
                <button 
                  type="button"
                  className="test-user-btn"
                  onClick={() => fillTestData('medico')}
                >
                  <span className="test-user-icon">👨‍⚕️</span>
                  <span>Médico</span>
                </button>
                <button 
                  type="button"
                  className="test-user-btn"
                  onClick={() => fillTestData('recepcionista')}
                >
                  <span className="test-user-icon">👩‍💼</span>
                  <span>Recepcionista</span>
                </button>
                <button 
                  type="button"
                  className="test-user-btn"
                  onClick={() => fillTestData('farmaceutico')}
                >
                  <span className="test-user-icon">💊</span>
                  <span>Farmacéutico</span>
                </button>
              </div>

              <div className="form-footer">
                <p>¿No tienes cuenta? 
                  <a href="/register" className="link-modern">Regístrate aquí</a>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;