import React from 'react';
import { useAuth } from '../../context/AuthContext';

const RecepcionistaDashboard = () => {
  const { user, logout } = useAuth();

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="dashboard-nav">
          <div className="dashboard-logo">🏥 Hospital System</div>
          <div className="dashboard-user">
            <span>{user?.empleado_nombre || user?.usuario_nombre}</span>
            <button onClick={logout} className="btn btn-sm">Salir</button>
          </div>
        </div>
      </header>
      
      <div className="dashboard-content">
        <h1>📋 Dashboard Recepcionista</h1>
        <div className="card">
          <h2>Panel de Recepción</h2>
          <p>Gestiona citas, pacientes y pagos.</p>
        </div>
      </div>
    </div>
  );
};

export default RecepcionistaDashboard;