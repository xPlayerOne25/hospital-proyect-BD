// File: frontend/src/components/paciente/BotonPagoPaypal.jsx

import React from 'react';
import api from '../../utils/axiosInstance';

const BotonPagoPaypal = ({ folioCita, cantidad, onSuccess }) => {
  const iniciarPago = async () => {
    try {
      const res = await api.post('/pagos/crear-orden', {
        cantidad,
        folio: folioCita
      });

      const link = res.data.links.find(l => l.rel === 'approve');
      if (link) {
        // Guardamos el folio en localStorage para usarlo después al capturar el pago
        localStorage.setItem('folio_cita_pago', folioCita);
        window.location.href = link.href;
      }
    } catch (error) {
      console.error('Error al iniciar pago:', error);
      alert('No se pudo iniciar el pago.');
    }
  };

  return (
    <button className="btn btn-primary btn-sm" onClick={iniciarPago}>
      💳 Pagar con PayPal
    </button>
  );
};

export default BotonPagoPaypal;
