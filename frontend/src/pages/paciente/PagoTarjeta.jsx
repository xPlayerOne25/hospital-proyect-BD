import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/axiosInstance';

const PagoTarjeta = () => {
  const [formulario, setFormulario] = useState({
    nombre: '',
    numero: '',
    vencimiento: '',
    cvv: ''
  });
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  const folio_cita = localStorage.getItem('folio_cita_pago');

  const handleChange = (e) => {
    setFormulario({
      ...formulario,
      [e.target.name]: e.target.value
    });
  };

  const handlePagar = async () => {
    if (!folio_cita) {
      setMensaje('❌ No se encontró la cita para pago.');
      setError(true);
      return;
    }

    try {
      const res = await api.post('/pagos/pago_tarjeta', {
        folio_cita,
        ...formulario
      });

      if (res.data.success) {
        setMensaje('✅ Pago realizado con éxito.');
        localStorage.removeItem('folio_cita_pago');
        setTimeout(() => navigate('/paciente'), 2000);
      } else {
        throw new Error('Error en el pago');
      }
    } catch (err) {
      console.error('❌ Error al pagar con tarjeta:', err);
      setMensaje('❌ No se pudo procesar el pago.');
      setError(true);
    }
  };

  return (
    <div className="pago-tarjeta-container" style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      background: '#f5f5f5',
      padding: '1rem'
    }}>
      <div className="card" style={{
        background: '#fff',
        padding: '2rem',
        borderRadius: '1rem',
        boxShadow: '0 0 20px rgba(0,0,0,0.1)',
        maxWidth: '400px',
        width: '100%'
      }}>
        <h2 style={{ marginBottom: '1.5rem' }}>💳 Pago con Tarjeta</h2>

        <input
          type="text"
          name="nombre"
          placeholder="Nombre en la tarjeta"
          value={formulario.nombre}
          onChange={handleChange}
          className="form-control"
          style={{ marginBottom: '1rem' }}
        />
        <input
          type="text"
          name="numero"
          placeholder="Número de tarjeta (ficticio)"
          value={formulario.numero}
          onChange={handleChange}
          className="form-control"
          style={{ marginBottom: '1rem' }}
        />
        <input
          type="text"
          name="vencimiento"
          placeholder="Vencimiento (MM/AA)"
          value={formulario.vencimiento}
          onChange={handleChange}
          className="form-control"
          style={{ marginBottom: '1rem' }}
        />
        <input
          type="text"
          name="cvv"
          placeholder="CVV"
          value={formulario.cvv}
          onChange={handleChange}
          className="form-control"
          style={{ marginBottom: '1rem' }}
        />

        <button className="btn btn-primary w-100" onClick={handlePagar}>
          Pagar ahora
        </button>

        {mensaje && (
          <p style={{ marginTop: '1rem', color: error ? 'red' : 'green' }}>
            {mensaje}
          </p>
        )}
      </div>
    </div>
  );
};

export default PagoTarjeta;
