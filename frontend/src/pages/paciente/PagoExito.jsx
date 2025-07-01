// pages/paciente/PagoExito.jsx
import React, { useEffect, useState } from 'react';
import api from '../../utils/axiosInstance';

const PagoExito = () => {
  const [status, setStatus] = useState('processing');
  const [message, setMessage] = useState('Procesando tu pago...');
  const [details, setDetails] = useState(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const PayerID = urlParams.get('PayerID');
    const folioCita = localStorage.getItem('folio_cita_pago');
    
    console.log('🔍 Parámetros de pago:', { token, PayerID, folioCita });
    
    if (token && folioCita) {
      capturarPago(token, folioCita);
    } else {
      setStatus('error');
      setMessage('Faltan parámetros del pago. Por favor, intenta nuevamente.');
    }
  }, []);

  const capturarPago = async (token, folioCita) => {
    try {
      console.log('🔄 Capturando pago PayPal...');
      
      const response = await api.post(`/pagos/capturar/${token}`, {}, {
        headers: {
          'x-folio-cita': folioCita
        }
      });
      
      console.log('✅ Respuesta de captura:', response.data);
      
      // 🔧 CORREGIDO: Verificar response.data.success en lugar de response.success
      if (response.data.success) {
        setStatus('success');
        setMessage('¡Pago procesado exitosamente!');
        setDetails(response.data.detalles);
        
        localStorage.removeItem('folio_cita_pago');
        
        setTimeout(() => {
          window.location.href = '/paciente/citas';
        }, 3000);
      } else {
        throw new Error(response.data.message || 'Error en la captura del pago');
      }
    } catch (error) {
      console.error('❌ Error capturando pago:', error);
      setStatus('error');
      setMessage('Error al procesar el pago: ' + (error.response?.data?.message || error.message));
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'processing': return '⏳';
      case 'success': return '✅';
      case 'error': return '❌';
      default: return '📄';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'processing': return '#3b82f6';
      case 'success': return '#10b981';
      case 'error': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <div style={{ 
      maxWidth: '600px', 
      margin: '50px auto', 
      padding: '30px',
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      textAlign: 'center'
    }}>
      <div style={{ 
        fontSize: '4rem', 
        marginBottom: '20px',
        color: getStatusColor()
      }}>
        {getStatusIcon()}
      </div>
      
      <h1 style={{ 
        color: getStatusColor(), 
        marginBottom: '20px',
        fontSize: '1.8rem'
      }}>
        {status === 'processing' && 'Procesando Pago'}
        {status === 'success' && '¡Pago Exitoso!'}
        {status === 'error' && 'Error en el Pago'}
      </h1>
      
      <p style={{ 
        fontSize: '1.1rem', 
        color: '#6b7280',
        marginBottom: '30px'
      }}>
        {message}
      </p>

      {status === 'processing' && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f4f6',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto'
          }}></div>
          <style jsx>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}

      {status === 'success' && (
        <div style={{ marginBottom: '30px' }}>
          <div style={{
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '6px',
            padding: '15px',
            marginBottom: '20px'
          }}>
            <p style={{ color: '#166534', margin: 0 }}>
              <strong>Tu cita médica ha sido confirmada</strong>
            </p>
            <p style={{ color: '#166534', margin: '5px 0 0 0', fontSize: '0.9rem' }}>
              Serás redirigido a tus citas en unos segundos...
            </p>
          </div>
          
          {details && (
            <div style={{
              backgroundColor: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              padding: '15px',
              textAlign: 'left'
            }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem' }}>Detalles del Pago:</h3>
              <p style={{ margin: '5px 0', fontSize: '0.9rem' }}>
                <strong>ID de transacción:</strong> {details.id}
              </p>
              <p style={{ margin: '5px 0', fontSize: '0.9rem' }}>
                <strong>Monto:</strong> ${details.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.value} MXN
              </p>
              <p style={{ margin: '5px 0', fontSize: '0.9rem' }}>
                <strong>Estado:</strong> {details.status}
              </p>
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
        {status === 'success' && (
          <button 
            onClick={() => window.location.href = '/paciente/citas'}
            style={{
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Ver Mis Citas
          </button>
        )}
        
        {status === 'error' && (
          <>
            <button 
              onClick={() => window.location.href = '/paciente/mis-citas'}
              style={{
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              Volver a Mis Citas
            </button>
            <button 
              onClick={() => window.location.reload()}
              style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              Reintentar
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default PagoExito;