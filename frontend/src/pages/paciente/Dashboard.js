import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AgendarCita from '../../components/forms/AgendarCita';
import MisCitas from '../../components/paciente/MisCitas';
import Paciente from './Paciente';

const PacienteDashboard = () => {
  const { user, logout } = useAuth();

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="dashboard-nav">
          <div className="dashboard-logo">🏥 Hospital System</div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <Link to="/paciente" className="btn btn-outline btn-sm">🏠 Inicio</Link>
            <Link to="/paciente/mis-citas" className="btn btn-outline btn-sm">📅 Mis Citas</Link>
            <Link to="/paciente/agendar" className="btn btn-outline btn-sm">📝 Agendar Cita</Link>
            <Link to="/paciente/perfil" className="btn btn-outline btn-sm">👤 Mi Perfil</Link>
          </div>

          <div className="dashboard-user">
            <span>Bienvenido, {user?.pac_nombre || user?.usuario_nombre}</span>
            <button onClick={logout} className="btn btn-sm">Salir</button>
          </div>
        </div>
      </header>

      <div className="dashboard-content">
        <Routes>
          <Route path="/" element={<PacienteHome />} />
          <Route path="/mis-citas" element={<MisCitas />} />
          <Route path="/agendar" element={<AgendarCita />} />
          <Route path="/perfil" element={<Paciente />} />
        </Routes>
      </div>
    </div>
  );
};

const PacienteHome = () => {
  const { user } = useAuth();

  return (
    <>
      <h1>👤 Bienvenido, {user?.pac_nombre || user?.usuario_nombre}!</h1>

      <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card">
          <h3>📅 Mis Citas</h3>
          <p>Gestiona tus citas médicas</p>
          <Link to="/paciente/mis-citas" className="btn btn-primary">Ver Todas Mis Citas</Link>
        </div>

        <div className="card">
          <h3>📋 Acciones Rápidas</h3>
          <Link to="/paciente/agendar" className="btn btn-primary">📝 Agendar Nueva Cita</Link>
          <button className="btn btn-outline">📄 Ver Mis Recetas</button>
        </div>
      </div>

      <div className="card">
        <h3>ℹ️ Información Importante</h3>
        <div className="alert alert-warning">
          <strong>⏰ Recordatorio:</strong> Tienes 8 horas para confirmar el pago de tu cita agendada.
        </div>
        <div className="alert alert-info">
          <strong>📋 Política de Cancelación:</strong> Cancelación gratuita hasta 48hrs antes.
        </div>
      </div>
    </>
  );
};

export default PacienteDashboard;
