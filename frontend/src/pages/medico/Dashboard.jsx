import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { medicoService } from '../../services/medicoService';

import PerfilMedico from '../../components/medico/PerfilMedico';
import CitasMedico from '../../components/medico/CitasMedico';
import RecetasMedico from '../../components/medico/RecetasMedico';
import HistorialMedico from '../../components/medico/HistorialMedico';
import EstadisticasMedico from '../../components/medico/EstadisticasMedico';

import '../../styles/components.css';

const MedicoDashboard = () => {
  const { user, logout } = useAuth();
  const [seccionActiva, setSeccionActiva] = useState('inicio');
  const [estadisticas, setEstadisticas] = useState(null);
  const [loading, setLoading] = useState(true);

  const cedulaMedico = user?.cedula || user?.empleado_cedula || user?.CEDULA || user?.cedula_profesional;

  useEffect(() => {
    const cargarEstadisticas = async () => {
      try {
        setLoading(true);
        console.log('📊 Cargando estadísticas para médico:', cedulaMedico);

        const response = await medicoService.obtenerEstadisticas(cedulaMedico);
        const stats = response?.data || response;
        console.log('✅ Estadísticas cargadas:', stats);
        setEstadisticas(stats);
      } catch (error) {
        console.error('❌ Error al cargar estadísticas:', error);
        setEstadisticas({
          total_citas: 0,
          citas_atendidas: 0,
          citas_pendientes: 0,
          citas_canceladas: 0,
          total_recetas: 0,
          citas_hoy: 0
        });
      } finally {
        setLoading(false);
      }
    };

    if (cedulaMedico) {
      cargarEstadisticas();
    } else {
      console.error('❌ No se pudo obtener la cédula del médico');
      setLoading(false);
    }
  }, [cedulaMedico]);

  const renderContenido = () => {
    if (!cedulaMedico) {
      return (
        <div className="card">
          <div className="card-body text-center">
            <h4 className="text-danger">⚠️ Error de Autenticación</h4>
            <p>No se pudo obtener la cédula del médico.</p>
            <pre>{JSON.stringify(user, null, 2)}</pre>
          </div>
        </div>
      );
    }

    switch (seccionActiva) {
      case 'perfil':
        return <PerfilMedico cedula={cedulaMedico} />;
      case 'citas':
        return <CitasMedico cedula={cedulaMedico} />;
      case 'recetas':
        return <RecetasMedico cedula={cedulaMedico} />;
      case 'historial':
        return <HistorialMedico cedula={cedulaMedico} />;
      default:
        return <EstadisticasMedico estadisticas={estadisticas} loading={loading} />;
    }
  };

  const menuItems = [
    { key: 'inicio', label: '🏠 Inicio', icon: '📊' },
    { key: 'perfil', label: '👨‍⚕️ Mi Perfil', icon: '👤' },
    { key: 'citas', label: '📅 Mis Citas', icon: '📋' },
    { key: 'recetas', label: '💊 Recetas', icon: '📝' },
    { key: 'historial', label: '📋 Historial', icon: '📚' }
  ];

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="dashboard-nav">
          <div className="dashboard-logo">
            <h2>🏥 Sistema Médico</h2>
          </div>
          <div className="dashboard-user">
            <span>Dr. {user?.empleado_nombre || user?.usuario_nombre || user?.nombre}</span>
            <span className="user-role">Médico - Cédula: {cedulaMedico}</span>
            <button onClick={logout} className="btn btn-sm btn-outline">
              Salir
            </button>
          </div>
        </div>
      </header>

      <div className="dashboard-content">
        <div className="dashboard-header-section">
          <h1>👨‍⚕️ Dashboard Médico</h1>

          {!loading && estadisticas && cedulaMedico && (
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">📅</div>
                <div className="stat-content">
                  <div className="stat-number">{estadisticas.citas_hoy}</div>
                  <div className="stat-label">Citas Hoy</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">✅</div>
                <div className="stat-content">
                  <div className="stat-number">{estadisticas.citas_atendidas}</div>
                  <div className="stat-label">Atendidas</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">⏳</div>
                <div className="stat-content">
                  <div className="stat-number">{estadisticas.citas_pendientes}</div>
                  <div className="stat-label">Pendientes</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">💊</div>
                <div className="stat-content">
                  <div className="stat-number">{estadisticas.total_recetas}</div>
                  <div className="stat-label">Recetas</div>
                </div>
              </div>
            </div>
          )}

          {!loading && !estadisticas && (
            <div className="alert alert-warning text-center mt-4">
              ⚠️ No se pudieron cargar las estadísticas
            </div>
          )}
        </div>

        <div className="dashboard-navigation">
          {menuItems.map((item) => (
            <button
              key={item.key}
              className={`nav-btn ${seccionActiva === item.key ? 'active' : ''}`}
              onClick={() => setSeccionActiva(item.key)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </div>

        <div className="dashboard-main-content">{renderContenido()}</div>
      </div>
    </div>
  );
};

export default MedicoDashboard;
