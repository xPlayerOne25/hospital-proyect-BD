// Frontend/src/components/recepcionista/CobrosRecepcionista.jsx
import React, { useEffect, useState } from 'react';
import authService from '../../services/authService';

const CobrosRecepcionista = () => {
  const [citas, setCitas] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [ticketActivo, setTicketActivo] = useState(null);
  const [detallesTicket, setDetallesTicket] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    obtenerCobros();
  }, []);

  const obtenerCobros = async () => {
    try {
      setCargando(true);
      setError(null);
      
      console.log('🔍 [DEBUG] Llamando a authService.obtenerCobros()...');
      const response = await authService.obtenerCobros();
      console.log('📥 [DEBUG] Respuesta completa de cobros:', response);
      
      // Verificar estructura de respuesta
      if (response && response.success !== false) {
        const citasData = response.data || response || [];
        console.log('✅ [DEBUG] Citas procesadas:', citasData);
        setCitas(Array.isArray(citasData) ? citasData : []);
      } else {
        console.error('❌ [DEBUG] Error en respuesta:', response);
        setError(response.message || 'Error al obtener cobros');
      }
      
    } catch (error) {
      console.error('❌ [DEBUG] Error completo:', error);
      console.error('❌ [DEBUG] Error.response:', error.response);
      console.error('❌ [DEBUG] Error.message:', error.message);
      
      const mensajeError = authService.handleError(error);
      setError(mensajeError);
      setCitas([]);
    } finally {
      setCargando(false);
    }
  };

  const generarTicket = async (folioCita) => {
    try {
      setCargando(true);
      setError(null);
      
      console.log(`🧾 [DEBUG] Generando ticket para folio: ${folioCita}`);
      console.log('🔍 [DEBUG] URL base API:', process.env.REACT_APP_API_URL || 'http://localhost:5000/api');
      
      // Primero intentar obtener el ticket básico
      console.log('📞 [DEBUG] Llamando a authService.generarTicket()...');
      const ticketResponse = await authService.generarTicket(folioCita);
      console.log('📥 [DEBUG] Respuesta de ticket:', ticketResponse);
      
      if (ticketResponse && ticketResponse.success !== false) {
        const ticketData = ticketResponse.data || ticketResponse;
        console.log('✅ [DEBUG] Datos del ticket:', ticketData);
        
        // Intentar obtener detalles (opcional)
        let detallesData = { servicios: [], medicamentos: [] };
        try {
          console.log('📞 [DEBUG] Llamando a authService.obtenerDetallesTicket()...');
          const detallesResponse = await authService.obtenerDetallesTicket(folioCita);
          console.log('📥 [DEBUG] Respuesta de detalles:', detallesResponse);
          
          if (detallesResponse && detallesResponse.success !== false) {
            detallesData = detallesResponse.data || detallesData;
          }
        } catch (detallesError) {
          console.warn('⚠️ [DEBUG] Error obteniendo detalles (no crítico):', detallesError);
        }
        
        setTicketActivo(ticketData);
        setDetallesTicket(detallesData);
        
      } else {
        throw new Error(ticketResponse.message || 'Error al generar ticket');
      }
      
    } catch (error) {
      console.error('❌ [DEBUG] Error generando ticket:', error);
      console.error('❌ [DEBUG] Error.response:', error.response);
      
      let mensajeError = 'Error desconocido';
      
      if (error.response) {
        // Error de respuesta del servidor
        console.error('❌ [DEBUG] Status:', error.response.status);
        console.error('❌ [DEBUG] Data:', error.response.data);
        
        if (error.response.status === 404) {
          mensajeError = `No se encontró la cita con folio ${folioCita}`;
        } else if (error.response.status === 500) {
          mensajeError = error.response.data?.message || 'Error interno del servidor';
        } else {
          mensajeError = error.response.data?.message || `Error ${error.response.status}`;
        }
      } else if (error.request) {
        // Error de red
        console.error('❌ [DEBUG] Request error:', error.request);
        mensajeError = 'Error de conexión. Verifica que el servidor esté funcionando.';
      } else {
        // Error de configuración
        mensajeError = error.message;
      }
      
      setError(mensajeError);
      alert(`Error al generar ticket: ${mensajeError}`);
    } finally {
      setCargando(false);
    }
  };

  const imprimirTicket = () => {
    try {
      if (!ticketActivo) {
        alert('No hay ticket activo para imprimir');
        return;
      }

      console.log('🖨️ [DEBUG] Datos del ticket para imprimir:', ticketActivo);
      authService.imprimirTicket(ticketActivo, detallesTicket);
      
    } catch (error) {
      console.error('❌ [DEBUG] Error al imprimir:', error);
      alert('Error al imprimir el ticket: ' + error.message);
    }
  };

  const cerrarTicket = () => {
    setTicketActivo(null);
    setDetallesTicket(null);
    setError(null);
  };

  // Test de conectividad de API
  const testAPI = async () => {
    try {
      console.log('🔬 [TEST] Probando conectividad de API...');
      console.log('🔗 [TEST] URL:', process.env.REACT_APP_API_URL || 'http://localhost:5000/api');
      
      // Probar endpoint básico
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/recepcionista/cobros`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('hospital_token') || ''}`
        }
      });
      
      console.log('📊 [TEST] Status:', response.status);
      console.log('📋 [TEST] Headers:', response.headers);
      
      const data = await response.text();
      console.log('📄 [TEST] Respuesta cruda:', data);
      
      try {
        const jsonData = JSON.parse(data);
        console.log('📦 [TEST] Datos JSON:', jsonData);
      } catch (e) {
        console.log('⚠️ [TEST] No es JSON válido');
      }
      
    } catch (error) {
      console.error('❌ [TEST] Error de conectividad:', error);
    }
  };

  const citasFiltradas = Array.isArray(citas) ? citas.filter((cita) => {
    const texto = `${cita.nombre_paciente || ''} ${cita.folio_cita || ''}`.toLowerCase();
    return texto.includes(busqueda.toLowerCase());
  }) : [];

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px' }}>
      {/* Debug Panel */}
      <div style={{
        background: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '8px',
        padding: '15px',
        marginBottom: '20px'
      }}>
        <h4>🔧 Panel de Debug</h4>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <button 
            onClick={testAPI}
            style={{
              background: '#007bff',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            🔬 Test API
          </button>
          <button 
            onClick={() => console.log('📊 Estado actual:', { citas, ticketActivo, error })}
            style={{
              background: '#28a745',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            📊 Log Estado
          </button>
        </div>
        <div style={{ fontSize: '14px', color: '#6c757d' }}>
          <p><strong>API URL:</strong> {process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}</p>
          <p><strong>Token:</strong> {localStorage.getItem('hospital_token') ? 'Presente' : 'No encontrado'}</p>
          <p><strong>Citas cargadas:</strong> {citas.length}</p>
          <p><strong>Error actual:</strong> {error || 'Ninguno'}</p>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div style={{
          background: '#f8d7da',
          color: '#721c24',
          border: '1px solid #f5c6cb',
          borderRadius: '8px',
          padding: '15px',
          marginBottom: '20px'
        }}>
          <h4>❌ Error</h4>
          <p>{error}</p>
          <button 
            onClick={obtenerCobros}
            style={{
              background: '#dc3545',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            🔄 Reintentar
          </button>
        </div>
      )}

      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '30px',
        padding: '25px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        borderRadius: '16px'
      }}>
        <div>
          <h2 style={{ margin: 0 }}>💳 Cobros y Tickets</h2>
          <p style={{ margin: '8px 0 0 0', opacity: 0.9 }}>
            Gestiona los pagos y genera tickets para las citas
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{citas.length}</div>
            <div style={{ fontSize: '14px', opacity: 0.8 }}>Total citas</div>
          </div>
          <button 
            onClick={obtenerCobros}
            disabled={cargando}
            style={{ 
              background: 'rgba(255,255,255,0.2)', 
              border: '2px solid rgba(255,255,255,0.3)', 
              color: 'white',
              padding: '12px 20px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            {cargando ? '⏳' : '🔄'} Actualizar
          </button>
        </div>
      </div>

      {/* Filtro de búsqueda */}
      <div style={{ marginBottom: '25px' }}>
        <input
          type="text"
          placeholder="🔍 Buscar por paciente o folio..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{ 
            width: '100%', 
            padding: '16px 20px',
            border: '2px solid #e1e5e9',
            borderRadius: '12px',
            fontSize: '16px'
          }}
        />
      </div>

      {/* Tabla */}
      {cargando && !citas.length ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '6px solid #f3f3f3',
            borderTop: '6px solid #667eea',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 30px'
          }}></div>
          <h3>Cargando información...</h3>
        </div>
      ) : (
        <div style={{
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.08)',
          overflow: 'hidden'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8f9fa' }}>
                <th style={{ padding: '20px 16px', textAlign: 'left' }}>Folio</th>
                <th style={{ padding: '20px 16px', textAlign: 'left' }}>Paciente</th>
                <th style={{ padding: '20px 16px', textAlign: 'left' }}>Especialidad</th>
                <th style={{ padding: '20px 16px', textAlign: 'left' }}>Fecha/Hora</th>
                <th style={{ padding: '20px 16px', textAlign: 'left' }}>Total</th>
                <th style={{ padding: '20px 16px', textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {citasFiltradas.length > 0 ? (
                citasFiltradas.map((cita) => (
                  <tr key={cita.folio_cita} style={{ borderBottom: '1px solid #f1f3f4' }}>
                    <td style={{ padding: '20px 16px', fontWeight: '700', color: '#667eea' }}>
                      #{cita.folio_cita}
                    </td>
                    <td style={{ padding: '20px 16px' }}>{cita.nombre_paciente}</td>
                    <td style={{ padding: '20px 16px' }}>{cita.nombre_especialidad}</td>
                    <td style={{ padding: '20px 16px' }}>
                      {cita.fecha_hora ? 
                        new Date(cita.fecha_hora).toLocaleString('es-MX') : 
                        'No disponible'
                      }
                    </td>
                    <td style={{ padding: '20px 16px', fontWeight: '700', color: '#38a169' }}>
                      ${parseFloat(cita.total || 0).toFixed(2)}
                    </td>
                    <td style={{ padding: '20px 16px', textAlign: 'center' }}>
                      <button 
                        onClick={() => {
                          console.log('🔘 [DEBUG] Click en ticket, folio:', cita.folio_cita);
                          generarTicket(cita.folio_cita);
                        }}
                        disabled={cargando}
                        style={{
                          background: '#667eea',
                          color: 'white',
                          border: 'none',
                          padding: '12px 20px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: '600'
                        }}
                      >
                        {cargando ? '⏳' : '🧾'} Ticket
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '60px 20px' }}>
                    {busqueda ? 
                      '🔍 No se encontraron resultados' : 
                      '📋 No hay citas disponibles para cobro'
                    }
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal del ticket - versión simplificada para debug */}
      {ticketActivo && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }} 
          onClick={cerrarTicket}
        >
          <div 
            style={{
              background: 'white',
              borderRadius: '16px',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto',
              padding: '30px'
            }} 
            onClick={(e) => e.stopPropagation()}
          >
            <h3>🧾 Ticket de Pago - #{ticketActivo.folio_cita}</h3>
            
            {/* Debug info */}
            <div style={{ 
              background: '#f8f9fa', 
              padding: '15px', 
              borderRadius: '8px', 
              marginBottom: '20px',
              fontSize: '14px'
            }}>
              <h4>🔍 Debug Info:</h4>
              <pre style={{ overflow: 'auto', maxHeight: '200px' }}>
                {JSON.stringify(ticketActivo, null, 2)}
              </pre>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <p><strong>Paciente:</strong> {ticketActivo.nombre_paciente || 'No disponible'}</p>
              <p><strong>Médico:</strong> {ticketActivo.nombre_medico || 'No disponible'}</p>
              <p><strong>Especialidad:</strong> {ticketActivo.nombre_especialidad || 'No disponible'}</p>
              <p><strong>Total:</strong> ${parseFloat(ticketActivo.total || 0).toFixed(2)}</p>
            </div>

            <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end' }}>
              <button 
                onClick={cerrarTicket}
                style={{
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Cerrar
              </button>
              <button 
                onClick={imprimirTicket}
                style={{
                  background: '#28a745',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                🖨️ Imprimir
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default CobrosRecepcionista;