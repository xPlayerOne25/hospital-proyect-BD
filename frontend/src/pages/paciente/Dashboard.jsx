import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AgendarCita from '../../components/forms/AgendarCita';
import MisCitas from '../../components/paciente/MisCitas';
import PerfilPaciente from './Paciente';
import MisRecetas from '../../components/paciente/MisRecetas';
import HistorialPaciente from '../../components/paciente/HistorialPaciente';
import '../../styles/components.css';

const PacienteDashboard = () => {
  const { user, logout } = useAuth();

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="dashboard-nav">
          <div className="dashboard-logo">
            <h2>🏥 Portal del Paciente</h2>
          </div>
          <div className="dashboard-user">
            <span>{user?.pac_nombre || user?.usuario_nombre}</span>
            <span className="user-role">Paciente</span>
            <button onClick={logout} className="btn btn-sm btn-outline">
              Salir
            </button>
          </div>
        </div>
      </header>

      <div className="dashboard-content">
        <div className="dashboard-header-section">
          <h1>👤 Bienvenido, {user?.pac_nombre || user?.usuario_nombre}</h1>

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">📅</div>
              <div className="stat-content">
                <div className="stat-label">Mis Citas</div>
                <Link to="/paciente/mis-citas" className="btn btn-sm btn-primary">Ver</Link>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📝</div>
              <div className="stat-content">
                <div className="stat-label">Agendar Cita</div>
                <Link to="/paciente/agendar" className="btn btn-sm btn-primary">Agendar</Link>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">👤</div>
              <div className="stat-content">
                <div className="stat-label">Mi Perfil</div>
                <Link to="/paciente/perfil" className="btn btn-sm btn-primary">Editar</Link>
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-navigation">
          {[
            { path: "/", label: "🏠 Inicio" },
            { path: "/mis-citas", label: "📅 Mis Citas" },
            { path: "/agendar", label: "📝 Agendar Cita" },
            { path: "/perfil", label: "👤 Mi Perfil" },
            { path: "/mis-recetas", label: "📄 Mis Recetas" },
            { path: "/historial", label: "📚 Historial" },
          ].map((item) => (
            <Link to={`/paciente${item.path}`} key={item.path} className="nav-btn">
              {item.label}
            </Link>
          ))}
        </div>

        <div className="dashboard-main-content">
          <Routes>
            <Route path="/" element={<PacienteInicio />} />
            <Route path="/mis-citas" element={<MisCitas />} />
            <Route path="/agendar" element={<AgendarCita />} />
            <Route path="/perfil" element={<PerfilPaciente />} />
            <Route path="/mis-recetas" element={<MisRecetas />} />
            <Route path="/historial" element={<HistorialPaciente />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

const PacienteInicio = () => {
  return (
    <div className="card">
      <h3>ℹ️ Recordatorios</h3>
      <div className="alert alert-warning">
        ⏰ Tienes 8 horas para confirmar el pago de una cita agendada.
      </div>
      <div className="alert alert-info">
        📋 Cancelación gratuita hasta 48hrs antes de la cita.
      </div>
    </div>
  );
};

export default PacienteDashboard;
