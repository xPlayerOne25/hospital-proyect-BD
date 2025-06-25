import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';

// Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import PacienteDashboard from './pages/paciente/Dashboard';
import MedicoDashboard from './pages/medico/Dashboard';
import RecepcionistaDashboard from './pages/recepcionista/Dashboard';
import FarmaciaDashboard from './pages/farmacia/Dashboard';

// Styles
import './styles/global.css';
import './styles/components.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Rutas públicas - TODAS simples */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Rutas protegidas por rol */}
            <Route 
              path="/paciente/*" 
              element={
                <ProtectedRoute allowedRoles={['Paciente']}>
                  <PacienteDashboard />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/medico/*" 
              element={
                <ProtectedRoute allowedRoles={['Medico']}>
                  <MedicoDashboard />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/recepcionista/*" 
              element={
                <ProtectedRoute allowedRoles={['Recepcionista']}>
                  <RecepcionistaDashboard />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/farmacia/*" 
              element={
                <ProtectedRoute allowedRoles={['Farmaceutico']}>
                  <FarmaciaDashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* Redirección por defecto */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            
            {/* 404 */}
            <Route path="*" element={<div className="error-404">Página no encontrada</div>} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;