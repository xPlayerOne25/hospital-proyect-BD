import React, { useState, useEffect } from 'react';
import { citasService } from '../../services/citasService';
import { useAuth } from '../../context/AuthContext';

const MisCitas = () => {
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtro, setFiltro] = useState('todas'); // todas, proximas, completadas
  const { user } = useAuth();

useEffect(() => {
  // Debug del token
  const token = localStorage.getItem('hospital_token');
  const user = localStorage.getItem('hospital_user');
  
  console.log('🔍 Debug Frontend:');
  console.log('Token en localStorage:', token ? token.substring(0, 20) + '...' : 'No token');
  console.log('User en localStorage:', user);
  console.log('User desde context:', user);
  
  cargarCitas();
}, []);

  const cargarCitas = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await citasService.getCitasPaciente();
      
      if (response.success) {
        setCitas(response.data);
      } else {
        setError('No se pudieron cargar las citas');
      }
    } catch (err) {
      console.error('Error al cargar citas:', err);
      setError('Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const citasFiltradas = citas.filter(cita => {
    switch (filtro) {
      case 'proximas':
        return cita.estado_cita === 'Próxima' || cita.estado_cita === 'Programada';
      case 'completadas':
        return cita.estado_cita === 'Completada';
      case 'pendientes':
        return cita.estatus_pago_texto === 'Pendiente';
      default:
        return true;
    }
  });

  const obtenerColorEstatus = (cita) => {
    if (cita.estatus_pago_texto === 'Pendiente') return 'warning';
    if (cita.estado_cita === 'Completada') return 'success';
    if (cita.estado_cita === 'Próxima') return 'primary';
    if (cita.estado_cita === 'Perdida') return 'danger';
    return 'secondary';
  };

  const obtenerIconoEstatus = (cita) => {
    if (cita.estatus_pago_texto === 'Pendiente') return '⏳';
    if (cita.estado_cita === 'Completada') return '✅';
    if (cita.estado_cita === 'Próxima') return '📅';
    if (cita.estado_cita === 'Perdida') return '❌';
    return '📋';
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando tus citas...</p>
      </div>
    );
  }

  return (
    <div className="mis-citas-container">
      <div className="page-header">
        <h1>📅 Mis Citas</h1>
        <p>Gestiona y revisa todas tus citas médicas</p>
      </div>

      {error && (
        <div className="alert alert-danger">
          <strong>Error:</strong> {error}
          <button 
            className="btn btn-sm btn-outline"
            onClick={cargarCitas}
            style={{ marginLeft: '1rem' }}
          >
            🔄 Reintentar
          </button>
        </div>
      )}

      {/* Filtros */}
      <div className="filtros-container" style={{ margin: '1rem 0' }}>
        <div className="btn-group">
          <button 
            className={`btn ${filtro === 'todas' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setFiltro('todas')}
          >
            Todas ({citas.length})
          </button>
          <button 
            className={`btn ${filtro === 'proximas' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setFiltro('proximas')}
          >
            Próximas ({citas.filter(c => c.estado_cita === 'Próxima' || c.estado_cita === 'Programada').length})
          </button>
          <button 
            className={`btn ${filtro === 'completadas' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setFiltro('completadas')}
          >
            Completadas ({citas.filter(c => c.estado_cita === 'Completada').length})
          </button>
          <button 
            className={`btn ${filtro === 'pendientes' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setFiltro('pendientes')}
          >
            Pago Pendiente ({citas.filter(c => c.estatus_pago_texto === 'Pendiente').length})
          </button>
        </div>
      </div>

      {/* Lista de Citas */}
      {citasFiltradas.length === 0 ? (
        <div className="card text-center">
          <div style={{ padding: '2rem' }}>
            <h3>📋 No hay citas</h3>
            <p>
              {filtro === 'todas' 
                ? 'Aún no tienes citas registradas.' 
                : `No tienes citas ${filtro}.`
              }
            </p>
            <a href="/paciente/agendar" className="btn btn-primary">
              📝 Agendar Nueva Cita
            </a>
          </div>
        </div>
      ) : (
        <div className="citas-grid">
          {citasFiltradas.map(cita => (
            <div key={cita.folio_cita} className="card cita-card">
              <div className="card-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="folio">Folio: #{cita.folio_cita}</span>
                  <span className={`badge badge-${obtenerColorEstatus(cita)}`}>
                    {obtenerIconoEstatus(cita)} {cita.citaestatus_descripcion}
                  </span>
                </div>
              </div>
              
              <div className="card-body">
                <div className="cita-info">
                  <div className="info-row">
                    <strong>🩺 Especialidad:</strong>
                    <span>{cita.nombre_especialidad}</span>
                  </div>
                  
                  <div className="info-row">
                    <strong>👨‍⚕️ Médico:</strong>
                    <span>{cita.nombre_medico}</span>
                  </div>
                  
                  <div className="info-row">
                    <strong>📅 Fecha:</strong>
                    <span>{cita.fecha_formateada}</span>
                  </div>
                  
                  <div className="info-row">
                    <strong>🕐 Hora:</strong>
                    <span>{cita.hora_formateada}</span>
                  </div>
                  
                  <div className="info-row">
                    <strong>🏥 Consultorio:</strong>
                    <span>{cita.consultorio_numero}</span>
                  </div>
                  
                  <div className="info-row">
                    <strong>💰 Costo:</strong>
                    <span>${cita.pago_cantidadTotal}</span>
                  </div>
                  
                  <div className="info-row">
                    <strong>💳 Pago:</strong>
                    <span className={`badge badge-${cita.estatus_pago_texto === 'Pagado' ? 'success' : 'warning'}`}>
                      {cita.estatus_pago_texto}
                    </span>
                  </div>
                </div>
                
                {/* Acciones */}
                <div className="cita-acciones" style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                  {cita.estatus_pago_texto === 'Pendiente' && (
                    <button className="btn btn-primary btn-sm">
                      💳 Pagar Cita
                    </button>
                  )}
                  
                  {cita.puede_cancelar && (
                    <button className="btn btn-danger btn-sm">
                      ❌ Cancelar
                    </button>
                  )}
                  
                  <button className="btn btn-outline btn-sm">
                    👁️ Ver Detalles
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Información adicional */}
      <div className="card" style={{ marginTop: '2rem' }}>
        <div className="card-body">
          <h4>ℹ️ Información Importante</h4>
          <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
            <li>Las citas deben ser pagadas dentro de las 8 horas posteriores a su registro.</li>
            <li>Puedes cancelar tu cita hasta 48 horas antes sin costo adicional.</li>
            <li>Llega 15 minutos antes de tu cita programada.</li>
            <li>Trae una identificación oficial y tu comprobante de pago.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MisCitas;