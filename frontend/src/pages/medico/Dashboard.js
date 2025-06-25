import React from 'react';
import { useAuth } from '../../context/AuthContext';

const MedicoDashboard = () => {
  const { user, logout } = useAuth();

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="dashboard-nav">
          <div className="dashboard-logo">🏥 Hospital System</div>
          <div className="dashboard-user">
            <span>Dr. {user?.empleado_nombre || user?.usuario_nombre}</span>
            <button onClick={logout} className="btn btn-sm">Salir</button>
          </div>
        </div>
      </header>
      
      <div className="dashboard-content">
        <h1>👨‍⚕️ Dashboard del Médico</h1>
        <div className="card">
          <h2>Panel Médico</h2>
          <p>Gestiona tus citas, pacientes y recetas.</p>
        </div>
      </div>
    </div>
  );
};

export default MedicoDashboard;