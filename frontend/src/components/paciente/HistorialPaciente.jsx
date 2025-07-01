import React, { useEffect, useState } from 'react';
import api from '../../utils/axiosInstance';

const HistorialPaciente = () => {
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    obtenerHistorial();
  }, []);

  const obtenerHistorial = async () => {
    try {
      const res = await api.get('/paciente/historial');

      if (res.data.success) {
        setHistorial(res.data.data);
      } else {
        setError('No se pudo obtener el historial médico.');
      }
    } catch (err) {
      console.error('Error al obtener historial:', err);
      setError('Error de conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Cargando historial...</div>;
  }

  if (error) {
    return (
      <div className="alert alert-danger">
        <strong>Error:</strong> {error}
        <button className="btn btn-outline" onClick={obtenerHistorial}>🔄 Reintentar</button>
      </div>
    );
  }

  return (
    <div className="historial-paciente-container">
      <h1>📋 Mi Historial Médico</h1>
      <p>Consulta tus diagnósticos previos, tratamientos y seguimiento clínico.</p>

      {historial.length === 0 ? (
        <div className="card text-center">
          <p>No hay historial disponible.</p>
        </div>
      ) : (
        <div className="historial-list">
          {historial.map((registro, index) => (
            <div key={index} className="card historial-card">
              <div className="card-header">
                <h3>🩺 Consulta #{registro.id_consulta}</h3>
                <span>{registro.fecha_consulta}</span>
              </div>
              <div className="card-body">
                <p><strong>👨‍⚕️ Médico:</strong> {registro.nombre_medico}</p>
                <p><strong>🏥 Especialidad:</strong> {registro.nombre_especialidad}</p>
                <p><strong>📝 Diagnóstico:</strong> {registro.diagnostico}</p>
                <p><strong>💊 Tratamiento:</strong> {registro.tratamiento}</p>
                <p><strong>📅 Fecha:</strong> {registro.fecha_consulta}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistorialPaciente;
