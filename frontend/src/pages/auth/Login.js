import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';


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
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">🏥 Hospital System</h1>
          <p className="auth-subtitle">Inicia sesión en tu cuenta</p>
        </div>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Usuario</label>
            <input
              type="text"
              value={formData.usuario_nombre}
              onChange={(e) => setFormData({...formData, usuario_nombre: e.target.value})}
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <input
              type="password"
              value={formData.contrasena}
              onChange={(e) => setFormData({...formData, contrasena: e.target.value})}
              className="form-input"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%' }}
            disabled={loading}
          >
            {loading ? 'Iniciando...' : 'Iniciar Sesión'}
          </button>
          <div className="text-center mt-3">
            <a href="/register" className="link">¿No tienes cuenta? Regístrate</a>
          </div>
        </form>

        <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
          <button className="btn btn-outline btn-sm" onClick={() => fillTestData('paciente')}>
            👤 Paciente
          </button>
          <button className="btn btn-outline btn-sm" onClick={() => fillTestData('medico')}>
            👨‍⚕️ Médico
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;