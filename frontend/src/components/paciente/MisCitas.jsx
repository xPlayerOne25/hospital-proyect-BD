// File: frontend/src/pages/paciente/MisCitas.jsx
import React, { useState, useEffect } from 'react';
import { citasService } from '../../services/citasService';
import { useAuth } from '../../context/AuthContext';
import BotonPagoPaypal from '../../components/paciente/BotonPagoPaypal';

const MisCitas = () => {
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtro, setFiltro] = useState('todas');
  const [citaParaCancelar, setCitaParaCancelar] = useState(null);
  const [showModalCancelacion, setShowModalCancelacion] = useState(false);
  const [politicaCancelacion, setPoliticaCancelacion] = useState(null);
  const [motivoCancelacion, setMotivoCancelacion] = useState('');
  const [loadingCancelacion, setLoadingCancelacion] = useState(false);
  const { user } = useAuth();

  // 🔧 SOLUCIÓN FINAL: Función para formatear hora correctamente
  const formatearHoraSinZonaHoraria = (horaString) => {
    if (!horaString) return '';
    
    console.log('🔍 Procesando hora:', horaString);
    
    // Detectar formato "10:30 a.m." o "03:30 p.m." (con puntos)
    if (horaString.includes('a.m.') || horaString.includes('p.m.')) {
      const timeMatch = horaString.match(/(\d{1,2}):(\d{2})\s*(a\.m\.|p\.m\.)/i);
      if (timeMatch) {
        const horas = parseInt(timeMatch[1]);
        const minutos = parseInt(timeMatch[2]);
        const periodo = timeMatch[3].toLowerCase();
        
        let horaCorrecta, periodoCorrecta;
        
        if (periodo === 'a.m.') {
          if (horas >= 1 && horas <= 11) {
            let horasConDesfase = horas + 6;
            if (horasConDesfase > 12) {
              horasConDesfase = horasConDesfase - 12;
              periodoCorrecta = 'PM';
            } else if (horasConDesfase === 12) {
              periodoCorrecta = 'PM';
            } else {
              periodoCorrecta = 'AM';
            }
            horaCorrecta = horasConDesfase;
          } else {
            horaCorrecta = horas === 0 ? 12 : horas;
            periodoCorrecta = 'AM';
          }
        } else if (periodo === 'p.m.') {
          let horasConDesfase = horas + 6;
          if (horasConDesfase > 12) {
            horasConDesfase = horasConDesfase - 12;
            periodoCorrecta = 'AM';
          } else {
            horaCorrecta = horas;
            periodoCorrecta = 'PM';
          }
          horaCorrecta = horasConDesfase;
        }
        
        const resultado = `${horaCorrecta}:${minutos.toString().padStart(2, '0')} ${periodoCorrecta}`;
        return resultado;
      }
    }
    
    // Detectar formato "10:30 AM" o "10:30 PM" (sin puntos)
    if (horaString.includes('AM') || horaString.includes('PM')) {
      const timeMatch = horaString.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
      if (timeMatch) {
        const horas = parseInt(timeMatch[1]);
        const minutos = parseInt(timeMatch[2]);
        const periodo = timeMatch[3].toUpperCase();
        return `${horas}:${minutos.toString().padStart(2, '0')} ${periodo}`;
      }
    }
    
    // Si la hora viene como "16:30:00" o "16:30" (formato 24h)
    if (horaString.includes(':') && !horaString.includes('a.m.') && !horaString.includes('p.m.') && !horaString.includes('AM') && !horaString.includes('PM')) {
      const parts = horaString.split(':');
      const horas = parseInt(parts[0]);
      const minutos = parseInt(parts[1]) || 0;
      
      if (horas >= 0 && horas <= 23) {
        const periodo = horas >= 12 ? 'PM' : 'AM';
        const horasDisplay = horas > 12 ? horas - 12 : (horas === 0 ? 12 : horas);
        const resultado = `${horasDisplay}:${minutos.toString().padStart(2, '0')} ${periodo}`;
        return resultado;
      }
    }
    
    // Si viene como timestamp completo
    if (horaString.includes('T')) {
      const timePart = horaString.split('T')[1];
      if (timePart) {
        const timeOnly = timePart.split('.')[0];
        return formatearHoraSinZonaHoraria(timeOnly);
      }
    }
    
    return horaString;
  };

  // 🔧 FIX: Función para formatear fecha sin problemas de zona horaria
  const formatearFechaSinZonaHoraria = (fechaString) => {
    if (!fechaString) return '';
    
    // Si viene como "2025-07-19"
    if (fechaString.includes('-') && !fechaString.includes('T')) {
      const [year, month, day] = fechaString.split('-');
      const fecha = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      
      return fecha.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    
    // Si viene como timestamp completo
    if (fechaString.includes('T')) {
      const fechaPart = fechaString.split('T')[0];
      return formatearFechaSinZonaHoraria(fechaPart);
    }
    
    return fechaString;
  };

  useEffect(() => {
    cargarCitas();
  }, []);

  const cargarCitas = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await citasService.getCitasPaciente();

      if (response?.success && Array.isArray(response.data)) {
        setCitas(response.data);
      } else {
        setError('No se pudieron cargar las citas');
        setCitas([]);
      }
    } catch (err) {
      console.error('Error al cargar citas:', err);
      setError('Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  // ✅ NUEVA FUNCIÓN: Abrir modal de cancelación
  const abrirModalCancelacion = async (cita) => {
    try {
      console.log('📋 Abriendo modal de cancelación para cita:', cita.folio_cita);
      
      // Obtener política de cancelación
      const politica = await citasService.getPoliticaCancelacion(cita.folio_cita);
      console.log('📋 Política obtenida:', politica);
      
      setCitaParaCancelar(cita);
      setPoliticaCancelacion(politica);
      setMotivoCancelacion('');
      setShowModalCancelacion(true);
    } catch (error) {
      console.error('❌ Error obteniendo política:', error);
      alert('❌ Error al obtener información de cancelación');
    }
  };

  // ✅ NUEVA FUNCIÓN: Confirmar cancelación
  const confirmarCancelacion = async () => {
    if (!citaParaCancelar) return;

    // Verificar si se puede cancelar según la política
    if (politicaCancelacion && !politicaCancelacion.puede_cancelar) {
      alert('❌ Esta cita ya no se puede cancelar (fecha/hora pasada)');
      return;
    }

    // Mostrar información de la política antes de cancelar
    let mensaje = `¿Estás seguro de que deseas cancelar la cita #${citaParaCancelar.folio_cita}?\n\n`;
    
    if (politicaCancelacion) {
      mensaje += `📋 POLÍTICA DE DEVOLUCIÓN:\n`;
      mensaje += `⏰ Anticipación: ${politicaCancelacion.horas_anticipacion} horas\n`;
      mensaje += `💰 Devolución: ${politicaCancelacion.porcentaje_devolucion}% ($${politicaCancelacion.monto_devolucion.toFixed(2)})\n\n`;
      
      if (politicaCancelacion.porcentaje_devolucion === 0) {
        mensaje += `⚠️ No habrá devolución por cancelación tardía.`;
      } else {
        mensaje += `✅ Se procesará la devolución correspondiente.`;
      }
    }

    if (!window.confirm(mensaje)) {
      return;
    }

    try {
      setLoadingCancelacion(true);
      console.log('❌ Cancelando cita:', citaParaCancelar.folio_cita);
      
      const response = await citasService.cancelarCita(
        citaParaCancelar.folio_cita, 
        motivoCancelacion || 'Cancelación por el paciente'
      );
      
      console.log('✅ Cita cancelada:', response);
      
      // Mostrar resultado
      if (response.success) {
        const { politica_aplicada } = response.data;
        let mensajeExito = `✅ Cita cancelada exitosamente\n\n`;
        
        if (politica_aplicada) {
          mensajeExito += `💰 Información de devolución:\n`;
          mensajeExito += `• Porcentaje: ${politica_aplicada.porcentaje_devolucion}%\n`;
          mensajeExito += `• Monto: $${politica_aplicada.monto_devolucion.toFixed(2)}\n\n`;
          mensajeExito += `${response.data.siguiente_paso}`;
        }
        
        alert(mensajeExito);
        
        // Cerrar modal y recargar citas
        setShowModalCancelacion(false);
        await cargarCitas();
      }
    } catch (error) {
      console.error('❌ Error cancelando cita:', error);
      const mensaje = error.response?.data?.message || error.message || 'Error al cancelar la cita';
      alert(`❌ ${mensaje}`);
    } finally {
      setLoadingCancelacion(false);
    }
  };

  // ✅ NUEVA FUNCIÓN: Cerrar modal
  const cerrarModal = () => {
    setShowModalCancelacion(false);
    setCitaParaCancelar(null);
    setPoliticaCancelacion(null);
    setMotivoCancelacion('');
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
        <div className="spinner" />
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
          <button className="btn btn-sm btn-outline" onClick={cargarCitas}>
            🔄 Reintentar
          </button>
        </div>
      )}

      <div className="filtros-container" style={{ margin: '1rem 0' }}>
        <div className="btn-group">
          <button className={`btn ${filtro === 'todas' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFiltro('todas')}>
            Todas ({citas.length})
          </button>
          <button className={`btn ${filtro === 'proximas' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFiltro('proximas')}>
            Próximas
          </button>
          <button className={`btn ${filtro === 'completadas' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFiltro('completadas')}>
            Completadas
          </button>
          <button className={`btn ${filtro === 'pendientes' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFiltro('pendientes')}>
            Pago Pendiente
          </button>
        </div>
      </div>

      {citasFiltradas.length === 0 ? (
        <div className="card text-center">
          <div style={{ padding: '2rem' }}>
            <h3>📋 No hay citas</h3>
            <p>{filtro === 'todas' ? 'Aún no tienes citas registradas.' : `No tienes citas ${filtro}.`}</p>
            <a href="/paciente/agendar-cita" className="btn btn-primary">📝 Agendar Nueva Cita</a>
          </div>
        </div>
      ) : (
        <div className="citas-grid">
          {citasFiltradas.map(cita => (
            <div key={cita.folio_cita} className="card cita-card">
              <div className="card-header">
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="folio">Folio: #{cita.folio_cita}</span>
                  <span className={`badge badge-${obtenerColorEstatus(cita)}`}>
                    {obtenerIconoEstatus(cita)} {cita.citaestatus_descripcion}
                  </span>
                </div>
              </div>
              <div className="card-body">
                <div className="cita-info">
                  <div><strong>🩺 Especialidad:</strong> {cita.nombre_especialidad}</div>
                  <div><strong>👨‍⚕️ Médico:</strong> {cita.nombre_medico}</div>
                  <div><strong>📅 Fecha:</strong> {formatearFechaSinZonaHoraria(cita.fecha_formateada)}</div>
                  <div><strong>🕐 Hora:</strong> {formatearHoraSinZonaHoraria(cita.hora_formateada)}</div>
                  <div><strong>🏥 Consultorio:</strong> {cita.consultorio_numero}</div>
                  <div><strong>💰 Costo:</strong> ${cita.pago_cantidadTotal}</div>
                  <div><strong>💳 Pago:</strong> <span className={`badge badge-${cita.estatus_pago_texto === 'Pagado' ? 'success' : 'warning'}`}>{cita.estatus_pago_texto}</span></div>
                </div>
                <div className="cita-acciones" style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                  {cita.estatus_pago_texto === 'Pendiente' && (
                    <>
                      <BotonPagoPaypal
                        folioCita={cita.folio_cita}
                        cantidad={cita.pago_cantidadTotal}
                        onSuccess={cargarCitas}
                      />
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          localStorage.setItem('folio_cita_pago', cita.folio_cita);
                          window.location.href = '/paciente/pago-tarjeta';
                        }}
                      >
                        💳 Pagar con Tarjeta
                      </button>
                    </>
                  )}
                  {/* ✅ BOTÓN DE CANCELAR CON FUNCIONALIDAD */}
                  {cita.puede_cancelar && (
                    <button 
                      className="btn btn-danger btn-sm"
                      onClick={() => abrirModalCancelacion(cita)}
                      disabled={loadingCancelacion}
                    >
                      ❌ Cancelar
                    </button>
                  )}
                  <button className="btn btn-outline btn-sm">👁️ Ver Detalles</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ✅ MODAL DE CANCELACIÓN */}
      {showModalCancelacion && citaParaCancelar && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">❌ Cancelar Cita #{citaParaCancelar.folio_cita}</h5>
                <button type="button" className="btn-close" onClick={cerrarModal}>✕</button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <h6>📋 Información de la cita:</h6>
                  <p><strong>Especialidad:</strong> {citaParaCancelar.nombre_especialidad}</p>
                  <p><strong>Médico:</strong> {citaParaCancelar.nombre_medico}</p>
                  <p><strong>Fecha:</strong> {formatearFechaSinZonaHoraria(citaParaCancelar.fecha_formateada)}</p>
                  <p><strong>Hora:</strong> {formatearHoraSinZonaHoraria(citaParaCancelar.hora_formateada)}</p>
                </div>

                {politicaCancelacion && (
                  <div className="mb-3">
                    <h6>💰 Política de Devolución:</h6>
                    <div className={`alert alert-${politicaCancelacion.porcentaje_devolucion >= 100 ? 'success' : politicaCancelacion.porcentaje_devolucion >= 50 ? 'warning' : 'danger'}`}>
                      <p><strong>Anticipación:</strong> {politicaCancelacion.horas_anticipacion} horas</p>
                      <p><strong>Devolución:</strong> {politicaCancelacion.porcentaje_devolucion}% (${politicaCancelacion.monto_devolucion.toFixed(2)})</p>
                      {politicaCancelacion.porcentaje_devolucion === 0 && (
                        <small>⚠️ No habrá devolución por cancelación tardía</small>
                      )}
                    </div>
                  </div>
                )}

                <div className="mb-3">
                  <label className="form-label">Motivo de cancelación (opcional):</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={motivoCancelacion}
                    onChange={(e) => setMotivoCancelacion(e.target.value)}
                    placeholder="Describe el motivo de la cancelación..."
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={cerrarModal}>
                  ✕ No Cancelar
                </button>
                <button 
                  type="button" 
                  className="btn btn-danger"
                  onClick={confirmarCancelacion}
                  disabled={loadingCancelacion}
                >
                  {loadingCancelacion ? 'Cancelando...' : '✅ Confirmar Cancelación'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MisCitas;