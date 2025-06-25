import React from 'react';
import { useAuth } from '../../context/AuthContext';

const FarmaciaDashboard = () => {
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
        <h1>💊 Dashboard Farmacia</h1>
        <div className="card">
          <h2>Panel de Farmacia</h2>
          <p>Gestiona inventario, ventas y recetas.</p>
        </div>
      </div>
    </div>
  );
};

export default FarmaciaDashboard;