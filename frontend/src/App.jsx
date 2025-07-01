import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';

// Páginas de pago (FUERA de protección para que PayPal pueda acceder)
import PagoExito from './pages/paciente/PagoExito';
import PagoTarjeta from './pages/paciente/PagoTarjeta';

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
            {/* ===== RUTAS PÚBLICAS (Sin autenticación) ===== */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* ===== RUTAS DE PAGO (Públicas para PayPal) ===== */}
            <Route path="/pago-exito" element={<PagoExito />} />
            <Route path="/paciente/pago-exito" element={<PagoExito />} />
            <Route path="/pago-tarjeta" element={<PagoTarjeta />} />
            <Route path="/paciente/pago-tarjeta" element={<PagoTarjeta />} />
            
            {/* ===== RUTAS PROTEGIDAS POR ROL ===== */}
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
            
            {/* ===== REDIRECCIONES ===== */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            
            {/* ===== 404 ===== */}
            <Route path="*" element={
              <div style={{ 
                textAlign: 'center', 
                padding: '50px',
                fontSize: '18px',
                color: '#666'
              }}>
                <h2>404 - Página no encontrada</h2>
                <p>La página que buscas no existe.</p>
                <a href="/login" style={{ color: '#007bff' }}>Volver al inicio</a>
              </div>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;