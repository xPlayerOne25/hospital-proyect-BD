import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import PacientesRecepcionista from '../../components/recepcionista/PacientesRecepcionista';
import DoctoresRecepcionista from '../../components/recepcionista/DoctoresRecepcionista';
import CitasRecepcionista from '../../components/recepcionista/CitasRecepcionista';
import CobrosRecepcionista from '../../components/recepcionista/CobrosRecepcionista';



const RecepcionistaDashboard = () => {
  const { user, logout } = useAuth();
  const [seccionActiva, setSeccionActiva] = useState('inicio');

  const renderContenido = () => {
    switch (seccionActiva) {
      case 'pacientes':
        return <PacientesRecepcionista />;
      case 'doctores':
        return <DoctoresRecepcionista />;
      case 'citas':
        return <CitasRecepcionista />;
      case 'cobros':
        return <CobrosRecepcionista />;
      default:
        return (
          <div className="card">
            <h2>Panel de Recepción</h2>
            <p>Gestiona citas, pacientes y pagos.</p>
          </div>
        );
    }
  };

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

        {/* Menú de botones */}
        <div className="btn-group" style={{ marginBottom: '20px' }}>
          <button className="btn" onClick={() => setSeccionActiva('inicio')}>🏠 Inicio</button>
          <button className="btn" onClick={() => setSeccionActiva('pacientes')}>👤 Pacientes</button>
          <button className="btn" onClick={() => setSeccionActiva('doctores')}>🩺 Doctores</button>
          <button className="btn" onClick={() => setSeccionActiva('citas')}>📅 Citas</button>
          <button className="btn" onClick={() => setSeccionActiva('cobros')}>💳 Cobros</button>
        </div>

        {/* Contenido dinámico */}
        {renderContenido()}
      </div>
    </div>
  );
};



export default RecepcionistaDashboard;
