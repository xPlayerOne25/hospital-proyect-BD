import React, { useState, useEffect } from 'react';
import api from '../../utils/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import html2pdf from 'html2pdf.js';
import './MisRecetas.css'; // o agrégalo a tu components.css

const MisRecetas = () => {
  const { user } = useAuth();
  const [recetas, setRecetas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [recetaSeleccionada, setRecetaSeleccionada] = useState(null);

  useEffect(() => {
    cargarRecetas();
  }, []);

  const cargarRecetas = async () => {
    try {
      const res = await api.get('/paciente/recetas');
      if (res.data.success) {
        setRecetas(res.data.data);
      } else {
        setError('No se pudieron cargar las recetas.');
      }
    } catch (err) {
      console.error('Error al obtener recetas:', err);
      setError('Error de conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const abrirModal = (receta) => {
    setRecetaSeleccionada(receta);
    setModalVisible(true);
  };

  const cerrarModal = () => {
    setRecetaSeleccionada(null);
    setModalVisible(false);
  };

  const imprimirReceta = () => {
    const element = document.getElementById('receta-pdf');

    const opt = {
      margin: 0.4,
      filename: `receta_${recetaSeleccionada.id_receta}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save();
  };

  if (loading) return <div className="loading">Cargando recetas...</div>;

  if (error) {
    return (
      <div className="alert alert-danger">
        <strong>Error:</strong> {error}
        <button className="btn btn-outline" onClick={cargarRecetas}>🔄 Reintentar</button>
      </div>
    );
  }

  return (
    <div className="mis-recetas-container">
      <h1>💊 Mis Recetas</h1>
      <p>Consulta las recetas médicas que te han sido asignadas.</p>

      {recetas.length === 0 ? (
        <div className="card text-center">
          <p>No tienes recetas registradas aún.</p>
        </div>
      ) : (
        <div className="recetas-list">
          {recetas.map((receta, index) => (
            <div key={index} className="card receta-card">
              <div className="card-header">
                <h3>📋 Receta #{receta.id_receta}</h3>
                <span>{receta.fecha_emision}</span>
              </div>
              <div className="card-body">
                <p><strong>👨‍⚕️ Médico:</strong> {receta.nombre_medico}</p>
                <p><strong>📅 Fecha:</strong> {receta.fecha_emision}</p>
                <button className="btn-ver" onClick={() => abrirModal(receta)}>👁️ Ver detalles</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalVisible && recetaSeleccionada && (
        <div className="modal-overlay" onClick={cerrarModal}>
          <div className="modal-receta" onClick={(e) => e.stopPropagation()}>
           <div id="receta-pdf" className="receta-formato">
  <div className="encabezado-receta">
    <img src="/img/LogoHospital.png" alt="Logo Hospital" className="logo-receta" />
    <div className="info-hospital">
      <h1>Hospital System </h1>
      <p>📍 Calle Salud #123, Condesa, CDMX</p>
      <p>☎️ (741) 123 4567 | 🕐 Horario: 8am - 8pm</p>
    </div>
  </div>

  <hr />

            <h2 className="titulo-receta">Receta Médica</h2>
            <p><strong>📄 Folio:</strong> {recetaSeleccionada.id_receta}</p>
            <p><strong>👨‍⚕️ Médico:</strong> {recetaSeleccionada.nombre_medico}</p>
            <p><strong>📅 Fecha:</strong> {recetaSeleccionada.fecha_emision}</p>
            <p><strong>📝 Diagnóstico:</strong> {recetaSeleccionada.diagnostico || 'No especificado'}</p>
            <p><strong>🧴 Tratamiento:</strong> {recetaSeleccionada.tratamiento || 'No especificado'}</p>
            <p><strong>📌 Indicaciones:</strong> {recetaSeleccionada.observaciones_generales || 'Sin observaciones'}</p>

            <p><strong>💊 Medicamentos:</strong></p>
            <ul>
                {recetaSeleccionada.medicamento
                ? recetaSeleccionada.medicamento.split(';').map((med, i) => (
                    <li key={i}>{med.trim()}</li>
                    ))
                : <li>No especificado</li>}
            </ul>

            <div className="firma-sello">
                <div className="linea-firma">Firma del Médico</div>
                <div className="linea-sello">Sello del Hospital</div>
            </div>
            </div>


            <div className="acciones-modal">
              <button className="btn-imprimir" onClick={imprimirReceta}>🖨️ Imprimir receta</button>
              <button className="btn-cerrar" onClick={cerrarModal}>❌ Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MisRecetas;
