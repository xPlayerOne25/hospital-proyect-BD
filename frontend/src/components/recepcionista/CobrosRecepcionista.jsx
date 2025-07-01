// Frontend/src/components/recepcionista/CobrosRecepcionista.jsx

import React, { useEffect, useState } from 'react';
import api from '../../services/authService';

const CobrosRecepcionista = () => {
  const [citas, setCitas] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [ticketActivo, setTicketActivo] = useState(null);

  useEffect(() => {
    obtenerCobros();
  }, []);

  const obtenerCobros = async () => {
    try {
      const res = await api.get('/recepcionista/cobros');
      console.log('✅ Cobros recibidos:', res.data);
      setCitas(res.data);
    } catch (error) {
      console.error('Error al obtener cobros:', error);
    }
  };

  const citasFiltradas = citas.filter((cita) => {
    const texto = `${cita.nombre_paciente} ${cita.folio_cita}`.toLowerCase();
    return texto.includes(busqueda.toLowerCase());
  });

  return (
    <div>
      <h2>💳 Cobros y Tickets</h2>
      <input
        type="text"
        className="input"
        placeholder="Buscar por paciente o folio..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        style={{ marginBottom: '15px', width: '100%' }}
      />

      <table className="table">
        <thead>
          <tr>
            <th>Folio</th>
            <th>Paciente</th>
            <th>Fecha cita</th>
            <th>Total a pagar</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {citasFiltradas.map((cita) => (
            <tr key={cita.folio_cita}>
              <td>{cita.folio_cita}</td>
              <td>{cita.nombre_paciente}</td>
              <td>{cita.fecha_hora?.substring(0, 16).replace('T', ' ')}</td>
              <td>${cita.total.toFixed(2)}</td>
              <td>
                <button className="btn btn-sm" onClick={() => setTicketActivo(cita)}>
                  🧾 Ver Ticket
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal ticket */}
      {ticketActivo && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>🧾 Ticket de Pago</h3>
            <p><strong>Folio:</strong> {ticketActivo.folio_cita}</p>
            <p><strong>Paciente:</strong> {ticketActivo.nombre_paciente}</p>
            <p><strong>Especialidad:</strong> {ticketActivo.nombre_especialidad}</p>
            <p><strong>Fecha:</strong> {ticketActivo.fecha_hora?.substring(0, 16).replace('T', ' ')}</p>
            <hr />
            <p><strong>Consulta:</strong> ${ticketActivo.costo_especialidad.toFixed(2)}</p>
            <p><strong>Servicios:</strong> ${ticketActivo.total_servicios.toFixed(2)}</p>
            <p><strong>Medicamentos:</strong> ${ticketActivo.total_medicamentos.toFixed(2)}</p>
            <hr />
            <h4>Total: ${ticketActivo.total.toFixed(2)}</h4>

            <div className="modal-actions">
              <button className="btn" onClick={() => setTicketActivo(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CobrosRecepcionista;
