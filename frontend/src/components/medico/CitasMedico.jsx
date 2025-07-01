// src/components/medico/CitasMedico.jsx
import React, { useState, useEffect } from 'react';
import { medicoService } from '../../services/medicoService';
import '../../styles/components.css';

const CitasMedico = ({ cedula }) => {
  const [citas, setCitas] = useState([]); // 🔧 SIEMPRE inicializar como array vacío
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    estatus: '',
    fecha_inicio: '',
    fecha_fin: ''
  });
  const [citaSeleccionada, setCitaSeleccionada] = useState(null);
  const [mostrarModalAtender, setMostrarModalAtender] = useState(false);

  useEffect(() => {
    cargarCitas();
  }, [cedula, filtros]);

  const cargarCitas = async () => {
    try {
      setLoading(true);
      console.log('🔄 Cargando citas para médico:', cedula, 'con filtros:', filtros);
      
      const response = await medicoService.obtenerCitas(cedula, filtros);
      
      console.log('📋 Respuesta completa del servicio:', response);
      console.log('📋 ¿Tiene success?', !!response.success);
      console.log('📋 ¿Tiene data?', !!response.data);
      console.log('📋 Tipo de data:', typeof response.data);
      console.log('📋 Es array?:', Array.isArray(response.data));
      
      // 🔧 FIX: Manejo específico de la respuesta
      if (response) {
        // Verificar si la respuesta tiene la estructura esperada
        if (response.success !== undefined) {
          // Respuesta con estructura { success: boolean, data: array }
          if (response.success && response.data) {
            if (Array.isArray(response.data)) {
              setCitas(response.data);
              console.log('✅ Citas establecidas correctamente:', response.data.length, 'citas');
            } else {
              console.warn('⚠️ response.data no es un array:', response.data);
              setCitas([]); // Fallback a array vacío
            }
          } else if (response.success && !response.data) {
            // Success pero sin datos (array vacío válido)
            setCitas([]);
            console.log('ℹ️ Respuesta exitosa sin citas');
          } else {
            // Success = false
            console.warn('⚠️ Respuesta con success = false:', response);
            setCitas([]);
          }
        } else if (Array.isArray(response)) {
          // Respuesta directa como array
          setCitas(response);
          console.log('✅ Citas establecidas directamente como array:', response.length, 'citas');
        } else {
          console.warn('⚠️ Formato de respuesta no reconocido:', response);
          setCitas([]);
        }
      } else {
        console.warn('⚠️ Respuesta vacía o null');
        setCitas([]);
      }
    } catch (error) {
      console.error('❌ Error al cargar citas:', error);
      console.error('❌ Detalles del error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      setCitas([]); // 🔧 IMPORTANTE: Siempre fallback a array vacío
    } finally {
      setLoading(false);
    }
  };

  const abrirModalAtender = (cita) => {
    setCitaSeleccionada(cita);
    setMostrarModalAtender(true);
  };

  const cerrarModalAtender = () => {
    setCitaSeleccionada(null);
    setMostrarModalAtender(false);
  };

  const cancelarCita = async (folio_cita) => {
    const motivo = prompt('¿Motivo de la cancelación?');
    if (!motivo) return;

    try {
      await medicoService.cancelarCita(folio_cita, {
        cedula_medico: cedula,
        motivo
      });
      alert('✅ Cita cancelada correctamente');
      cargarCitas();
    } catch (error) {
      console.error('❌ Error al cancelar cita:', error);
      alert('❌ Error al cancelar la cita: ' + (error.response?.data?.message || error.message));
    }
  };

  const getEstatusClass = (estatus) => {
    const clases = {
      'Pagada pendiente por atender': 'badge-warning',
      'Agendada': 'badge-info',
      'Atendida': 'badge-success',
      'Cancelada Doctor': 'badge-danger',
      'Cancelada Paciente': 'badge-danger',
      'No acudió': 'badge-secondary'
    };
    return clases[estatus] || 'badge-secondary';
  };

  const puedeAtender = (cita) => {
    return cita.estatus === 'Pagada pendiente por atender' || cita.estatus === 'Pagada';
  };

  const puedeCancelar = (cita) => {
    return !['Atendida', 'Cancelada Doctor', 'Cancelada Paciente', 'No acudió'].includes(cita.estatus);
  };

  // 🔧 FIX: Asegurar que citas sea array antes de usar filter
  const citasArray = Array.isArray(citas) ? citas : [];
  
  const citasHoy = citasArray.filter(cita => {
    try {
      const fechaCita = new Date(cita.cita_fechahora);
      const hoy = new Date();
      return fechaCita.toDateString() === hoy.toDateString();
    } catch (error) {
      console.error('Error al filtrar citas de hoy:', error);
      return false;
    }
  });

  const citasPendientes = citasArray.filter(cita => 
    cita.estatus === 'Pagada pendiente por atender' || cita.estatus === 'Agendada'
  );

  // 🔧 FIX: Función para formatear fecha sin problemas de zona horaria
const formatearFecha = (fechaString) => {
  if (!fechaString) return '';
  const fecha = new Date(fechaString);
  return `${fecha.getUTCDate().toString().padStart(2, '0')}/${(fecha.getUTCMonth() + 1)
    .toString()
    .padStart(2, '0')}/${fecha.getUTCFullYear()}`;
};

const formatearHora = (horaString) => {
  if (!horaString) return '';
  const hora = new Date(horaString);
  const horasUTC = hora.getUTCHours().toString().padStart(2, '0');
  const minutos = hora.getUTCMinutes().toString().padStart(2, '0');
  return `${horasUTC}:${minutos}`;
};

  if (loading) {
    return (
      <div className="card">
        <div className="card-body text-center">
          <div className="spinner-border" role="status">
            <span className="sr-only">Cargando...</span>
          </div>
          <p className="mt-3">Cargando citas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header d-flex justify-content-between align-items-center flex-wrap">
        <h2 className="mb-0">📅 Mis Citas Médicas</h2>
        <div className="d-flex gap-2 flex-wrap">
          <span className="badge badge-info">📋 Total: {citasArray.length}</span>
          <span className="badge badge-primary">🗓️ Hoy: {citasHoy.length}</span>
          <span className="badge badge-warning">⏳ Pendientes: {citasPendientes.length}</span>
        </div>
      </div>

      <div className="card-body">
        {/* Filtros */}
        <div className="card mb-4">
          <div className="card-body">
            <div className="row">
              <div className="col-md-3">
                <label className="form-label">Estado:</label>
                <select
                  value={filtros.estatus}
                  onChange={(e) => setFiltros(prev => ({...prev, estatus: e.target.value}))}
                  className="form-control"
                >
                  <option value="">Todos los estados</option>
                  <option value="Agendada">Agendada</option>
                  <option value="Pagada pendiente por atender">Pendiente por atender</option>
                  <option value="Atendida">Atendida</option>
                  <option value="Cancelada Doctor">Cancelada por médico</option>
                  <option value="Cancelada Paciente">Cancelada por paciente</option>
                  <option value="No acudió">No acudió</option>
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label">Desde:</label>
                <input
                  type="date"
                  value={filtros.fecha_inicio}
                  onChange={(e) => setFiltros(prev => ({...prev, fecha_inicio: e.target.value}))}
                  className="form-control"
                />
              </div>
              <div className="col-md-3">
                <label className="form-label">Hasta:</label>
                <input
                  type="date"
                  value={filtros.fecha_fin}
                  onChange={(e) => setFiltros(prev => ({...prev, fecha_fin: e.target.value}))}
                  className="form-control"
                />
              </div>
              <div className="col-md-3 d-flex align-items-end">
                <button 
                  onClick={() => setFiltros({estatus: '', fecha_inicio: '', fecha_fin: ''})} 
                  className="btn btn-outline-secondary"
                >
                  🗑️ Limpiar
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Debug info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="alert alert-info">
            <strong>🔍 DEBUG:</strong><br />
            Cédula: {cedula}<br />
            Citas recibidas: {citasArray.length}<br />
            Tipo de citas: {typeof citas}<br />
            Es array: {Array.isArray(citas) ? 'Sí' : 'No'}<br />
            Loading: {loading ? 'Sí' : 'No'}
          </div>
        )}

        {/* Lista de citas */}
        {citasArray.length === 0 ? (
          <div className="text-center py-5">
            <h4 className="text-muted">📅 No hay citas</h4>
            <p className="text-muted">
              {loading ? 'Cargando...' : 'No se encontraron citas con los filtros aplicados.'}
            </p>
          </div>
        ) : (
          <div className="row">
            {citasArray.map((cita, index) => (
              <div key={cita.folio_cita || index} className="col-lg-6 mb-4">
                <div className="card h-100">
                  <div className="card-header d-flex justify-content-between align-items-center">
                    <strong>#{cita.folio_cita}</strong>
                    <span className={`badge ${getEstatusClass(cita.estatus)}`}>
                      {cita.estatus}
                    </span>
                  </div>

                  <div className="card-body">
                    <h5 className="card-title">👤 {cita.nombre_paciente}</h5>
                    <div className="mb-3">
                      <small className="text-muted">CURP: {cita.curp_paciente}</small>
                      {cita.telefono_paciente && (
                        <>
                          <br />
                          <small className="text-muted">📞 {cita.telefono_paciente}</small>
                        </>
                      )}
                      <br />
                      <small className="text-muted">🎂 Edad: {cita.pac_edad} años</small>
                    </div>

                    <div className="list-group list-group-flush">
                      <div className="list-group-item d-flex justify-content-between px-0">
                        <span>🗓️ Fecha:</span>
                        <span>{formatearFecha(cita.cita_fechahora)}</span>
                      </div>
                      <div className="list-group-item d-flex justify-content-between px-0">
                        <span>⏰ Hora:</span>
                        <span>{formatearHora(cita.cita_fechahora)}</span>
                      </div>
                      <div className="list-group-item d-flex justify-content-between px-0">
                        <span>🏥 Consultorio:</span>
                        <span>{cita.consultorio_numero || 'Sin asignar'}</span>
                      </div>
                      <div className="list-group-item d-flex justify-content-between px-0">
                        <span>🩺 Especialidad:</span>
                        <span>{cita.nombre_especialidad}</span>
                      </div>
                      <div className="list-group-item d-flex justify-content-between px-0">
                        <span>💰 Pago:</span>
                        <span>${cita.pago_cantidadTotal || 0}</span>
                      </div>
                      <div className="list-group-item d-flex justify-content-between px-0">
                        <span>💳 Estado Pago:</span>
                        <span className={`badge ${cita.estatuspago ? 'badge-success' : 'badge-warning'}`}>
                          {cita.estatuspago ? 'Pagado' : 'Pendiente'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="card-footer">
                    <div className="d-flex gap-2 flex-wrap">
                      {puedeAtender(cita) && (
                        <button
                          onClick={() => abrirModalAtender(cita)}
                          className="btn btn-success btn-sm"
                        >
                          ✅ Atender
                        </button>
                      )}
                      
                      {puedeCancelar(cita) && (
                        <button
                          onClick={() => cancelarCita(cita.folio_cita)}
                          className="btn btn-danger btn-sm"
                        >
                          ❌ Cancelar
                        </button>
                      )}

                      <button
                        onClick={() => alert('Funcionalidad en desarrollo')}
                        className="btn btn-info btn-sm"
                      >
                        👁️ Ver Paciente
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal para atender cita */}
      {mostrarModalAtender && citaSeleccionada && (
        <ModalAtenderCita
          cita={citaSeleccionada}
          cedula={cedula}
          onClose={cerrarModalAtender}
          onSuccess={() => {
            cargarCitas();
            cerrarModalAtender();
          }}
        />
      )}
    </div>
  );
};

// Modal para atender cita (igual que antes)
const ModalAtenderCita = ({ cita, cedula, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    motivo_consulta: '',
    examen_fisico: '',
    diagnostico: '',
    tipo_sangre: '',
    alergias: '',
    padecimientos_previos: '',
    peso: '',
    estatura: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.motivo_consulta || !formData.diagnostico) {
      alert('Motivo de consulta y diagnóstico son obligatorios');
      return;
    }

    try {
      setLoading(true);
      await medicoService.atenderCitaCompleta(cita.folio_cita, {
        ...formData,
        cedula_medico: cedula
      });
      alert('✅ Cita atendida correctamente');
      onSuccess();
    } catch (error) {
      console.error('❌ Error al atender cita:', error);
      alert('❌ Error al atender la cita: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal fade show d-block" tabIndex="-1" role="dialog">
        <div className="modal-dialog modal-lg" role="document" onClick={(e) => e.stopPropagation()}>
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">🏥 Atender Cita - {cita.nombre_paciente}</h5>
              <button type="button" className="btn-close" onClick={onClose}></button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label className="form-label">Motivo de consulta *</label>
                      <textarea
                        value={formData.motivo_consulta}
                        onChange={(e) => setFormData({...formData, motivo_consulta: e.target.value})}
                        placeholder="Motivo de la consulta..."
                        required
                        rows="3"
                        className="form-control"
                      />
                    </div>

                    <div className="form-group mb-3">
                      <label className="form-label">Examen físico</label>
                      <textarea
                        value={formData.examen_fisico}
                        onChange={(e) => setFormData({...formData, examen_fisico: e.target.value})}
                        placeholder="Resultados del examen físico..."
                        rows="3"
                        className="form-control"
                      />
                    </div>

                    <div className="form-group mb-3">
                      <label className="form-label">Diagnóstico *</label>
                      <textarea
                        value={formData.diagnostico}
                        onChange={(e) => setFormData({...formData, diagnostico: e.target.value})}
                        placeholder="Diagnóstico médico..."
                        required
                        rows="3"
                        className="form-control"
                      />
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="row">
                      <div className="col-md-4">
                        <div className="form-group mb-3">
                          <label className="form-label">Tipo de sangre</label>
                          <select
                            value={formData.tipo_sangre}
                            onChange={(e) => setFormData({...formData, tipo_sangre: e.target.value})}
                            className="form-control"
                          >
                            <option value="">Seleccionar</option>
                            <option value="O+">O+</option>
                            <option value="O-">O-</option>
                            <option value="A+">A+</option>
                            <option value="A-">A-</option>
                            <option value="B+">B+</option>
                            <option value="B-">B-</option>
                            <option value="AB+">AB+</option>
                            <option value="AB-">AB-</option>
                          </select>
                        </div>
                      </div>

                      <div className="col-md-4">
                        <div className="form-group mb-3">
                          <label className="form-label">Peso (kg)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={formData.peso}
                            onChange={(e) => setFormData({...formData, peso: e.target.value})}
                            placeholder="70.5"
                            className="form-control"
                          />
                        </div>
                      </div>

                      <div className="col-md-4">
                        <div className="form-group mb-3">
                          <label className="form-label">Estatura (m)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={formData.estatura}
                            onChange={(e) => setFormData({...formData, estatura: e.target.value})}
                            placeholder="1.75"
                            className="form-control"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="form-group mb-3">
                      <label className="form-label">Alergias</label>
                      <textarea
                        value={formData.alergias}
                        onChange={(e) => setFormData({...formData, alergias: e.target.value})}
                        placeholder="Alergias conocidas..."
                        rows="2"
                        className="form-control"
                      />
                    </div>

                    <div className="form-group mb-3">
                      <label className="form-label">Padecimientos previos</label>
                      <textarea
                        value={formData.padecimientos_previos}
                        onChange={(e) => setFormData({...formData, padecimientos_previos: e.target.value})}
                        placeholder="Historial de padecimientos..."
                        rows="2"
                        className="form-control"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={onClose} className="btn btn-secondary">
                  Cancelar
                </button>
                <button type="submit" disabled={loading} className="btn btn-success">
                  {loading ? 'Guardando...' : '✅ Atender Cita'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <div className="modal-backdrop show"></div>
    </div>
  );
};

export default CitasMedico;