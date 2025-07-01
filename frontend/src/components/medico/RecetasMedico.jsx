// src/components/medico/RecetasMedico.jsx - CÓDIGO COMPLETO SIN CORTES
import React, { useState, useEffect } from 'react';
import { medicoService } from '../../services/medicoService';
import '../../styles/components.css';

const RecetasMedico = ({ cedula }) => {
  const [recetas, setRecetas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    fecha_inicio: '',
    fecha_fin: '',
    paciente_curp: ''
  });
  const [mostrarModalCrear, setMostrarModalCrear] = useState(false);
  const [recetaSeleccionada, setRecetaSeleccionada] = useState(null);
  const [mostrarDetalles, setMostrarDetalles] = useState(false);

  useEffect(() => {
    cargarRecetas();
  }, [cedula, filtros]);

  const cargarRecetas = async () => {
    try {
      setLoading(true);
      const response = await medicoService.obtenerRecetas(cedula, filtros);
      setRecetas(response.data || []);
    } catch (error) {
      console.error('❌ Error al cargar recetas:', error);
      setRecetas([]);
    } finally {
      setLoading(false);
    }
  };

  const abrirModalCrear = () => {
    setMostrarModalCrear(true);
  };

  const cerrarModalCrear = () => {
    setMostrarModalCrear(false);
  };

  const verDetalles = (receta) => {
    setRecetaSeleccionada(receta);
    setMostrarDetalles(true);
  };

  const cerrarDetalles = () => {
    setRecetaSeleccionada(null);
    setMostrarDetalles(false);
  };

  const imprimirReceta = (receta) => {
    window.print();
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-MX');
  };

  if (loading) {
    return (
      <div className="card">
        <div className="card-body text-center">
          <div className="spinner-border" role="status">
            <span className="sr-only">Cargando...</span>
          </div>
          <p className="mt-3">Cargando recetas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header d-flex justify-content-between align-items-center flex-wrap">
        <h2 className="mb-0">💊 Mis Recetas Médicas</h2>
        <div className="d-flex gap-2 flex-wrap">
          <span className="badge badge-info">📋 Total: {recetas.length}</span>
          <button onClick={abrirModalCrear} className="btn btn-primary btn-sm">
            ➕ Nueva Receta
          </button>
        </div>
      </div>

      <div className="card-body">
        {/* Filtros */}
        <div className="card mb-4">
          <div className="card-body">
            <div className="row">
              <div className="col-md-3">
                <label className="form-label">CURP del Paciente:</label>
                <input
                  type="text"
                  value={filtros.paciente_curp}
                  onChange={(e) => setFiltros(prev => ({...prev, paciente_curp: e.target.value.toUpperCase()}))}
                  placeholder="CURP..."
                  className="form-control"
                  maxLength="18"
                  style={{ fontFamily: 'monospace' }}
                />
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
                  onClick={() => setFiltros({fecha_inicio: '', fecha_fin: '', paciente_curp: ''})} 
                  className="btn btn-outline-secondary"
                >
                  🗑️ Limpiar
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de recetas */}
        {recetas.length === 0 ? (
          <div className="text-center py-5">
            <h4 className="text-muted">💊 No hay recetas</h4>
            <p className="text-muted">No se encontraron recetas con los filtros aplicados.</p>
            <button onClick={abrirModalCrear} className="btn btn-primary">
              ➕ Crear Primera Receta
            </button>
          </div>
        ) : (
          <div className="row">
            {recetas.map((receta) => (
              <div key={receta.id_receta} className="col-lg-6 mb-4">
                <div className="card h-100 receta-card">
                  <div className="card-header d-flex justify-content-between align-items-center">
                    <strong>Receta #{receta.folio_receta}</strong>
                    <span className="badge badge-success">
                      {formatearFecha(receta.fecha_emision)}
                    </span>
                  </div>

                  <div className="card-body">
                    <h5 className="card-title">👤 {receta.nombre_paciente}</h5>
                    <div className="mb-3">
                      <small className="text-muted">CURP: {receta.curp_paciente}</small>
                      <br />
                      <small className="text-muted">📞 {receta.telefono_paciente || 'No registrado'}</small>
                    </div>

                    <div className="mb-3">
                      <strong className="text-muted">🏥 Diagnóstico:</strong>
                      <p className="mb-2">{receta.diagnostico}</p>
                    </div>

                    <div className="mb-3">
                      <strong className="text-muted">💊 Medicamentos:</strong>
                      <div className="medicamentos-lista">
                        {receta.medicamentos && receta.medicamentos.length > 0 ? (
                          receta.medicamentos.slice(0, 2).map((med, index) => (
                            <div key={index} className="medicamento-item mb-2">
                              <small>
                                <strong>{med.nombre}</strong> - {med.dosis}
                                <br />
                                <span className="text-muted">{med.indicaciones}</span>
                              </small>
                            </div>
                          ))
                        ) : (
                          <small className="text-muted">Sin medicamentos registrados</small>
                        )}
                        {receta.medicamentos && receta.medicamentos.length > 2 && (
                          <small className="text-info">
                            +{receta.medicamentos.length - 2} medicamentos más...
                          </small>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="card-footer">
                    <div className="d-flex gap-2 flex-wrap">
                      <button
                        onClick={() => verDetalles(receta)}
                        className="btn btn-info btn-sm"
                      >
                        👁️ Ver Detalles
                      </button>
                      
                      <button
                        onClick={() => imprimirReceta(receta)}
                        className="btn btn-primary btn-sm"
                      >
                        🖨️ Imprimir
                      </button>

                      <button
                        onClick={() => alert('Funcionalidad en desarrollo')}
                        className="btn btn-warning btn-sm"
                      >
                        📧 Enviar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal para crear nueva receta */}
      {mostrarModalCrear && (
        <ModalCrearReceta
          cedula={cedula}
          onClose={cerrarModalCrear}
          onSuccess={() => {
            cargarRecetas();
            cerrarModalCrear();
          }}
        />
      )}

      {/* Modal para ver detalles de receta */}
      {mostrarDetalles && recetaSeleccionada && (
        <ModalDetallesReceta
          receta={recetaSeleccionada}
          onClose={cerrarDetalles}
        />
      )}
    </div>
  );
};

// Modal CORREGIDO para crear nueva receta - FILTRA CITAS SIN RECETA
const ModalCrearReceta = ({ cedula, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    folio_cita: '',
    curp_paciente: '',
    diagnostico: '',
    tratamiento: '',
    indicaciones_generales: '',
    medicamentos: [
      {
        nombre: '',
        dosis: '',
        frecuencia: '',
        duracion: '',
        indicaciones: ''
      }
    ]
  });
  const [loading, setLoading] = useState(false);
  const [pacienteEncontrado, setPacienteEncontrado] = useState(null);
  const [citasDisponibles, setCitasDisponibles] = useState([]);
  const [loadingCitas, setLoadingCitas] = useState(true);

  // FUNCIÓN CORREGIDA: Cargar solo citas atendidas SIN receta
  useEffect(() => {
    cargarCitasSinReceta();
  }, []);

  const cargarCitasSinReceta = async () => {
    try {
      setLoadingCitas(true);
      console.log('🔄 Cargando citas del médico sin receta...');
      
      // 1. Obtener todas las citas atendidas del médico
      const responseCitas = await medicoService.obtenerCitas(cedula, {});
      
      if (!responseCitas.success || !responseCitas.data) {
        console.error('❌ No se pudieron cargar las citas');
        setCitasDisponibles([]);
        return;
      }
      
      // 2. Filtrar solo citas atendidas
      const citasAtendidas = responseCitas.data.filter(cita => 
        cita.estatus === 'Atendida'
      );
      
      console.log(`✅ Citas atendidas encontradas: ${citasAtendidas.length}`);
      
      // 3. Obtener todas las recetas del médico para saber qué citas ya tienen receta
      const responseRecetas = await medicoService.obtenerRecetas(cedula, {});
      const recetasExistentes = responseRecetas.data || [];
      
      console.log(`✅ Recetas existentes: ${recetasExistentes.length}`);
      
      // 4. Crear array de folios de citas que YA TIENEN receta
      const foliosConReceta = recetasExistentes.map(receta => 
        parseInt(receta.folio_cita)
      );
      
      console.log('📋 Folios con receta:', foliosConReceta);
      
      // 5. FILTRAR CITAS QUE NO TIENEN RECETA
      const citasSinReceta = citasAtendidas.filter(cita => 
        !foliosConReceta.includes(parseInt(cita.folio_cita))
      );
      
      console.log(`🎯 Citas SIN receta disponibles: ${citasSinReceta.length}`);
      console.log('📋 Citas disponibles:', citasSinReceta.map(c => `Folio ${c.folio_cita} - ${c.nombre_paciente}`));
      
      setCitasDisponibles(citasSinReceta);
      
    } catch (error) {
      console.error('❌ Error al cargar citas sin receta:', error);
      setCitasDisponibles([]);
    } finally {
      setLoadingCitas(false);
    }
  };

  const buscarPaciente = async () => {
    if (!formData.curp_paciente.trim()) {
      alert('Ingresa un CURP válido');
      return;
    }

    try {
      const response = await medicoService.obtenerDatosPaciente(formData.curp_paciente);
      setPacienteEncontrado(response.data);
    } catch (error) {
      console.error('❌ Error al buscar paciente:', error);
      alert('❌ No se encontró el paciente');
      setPacienteEncontrado(null);
    }
  };

  const agregarMedicamento = () => {
    setFormData(prev => ({
      ...prev,
      medicamentos: [
        ...prev.medicamentos,
        {
          nombre: '',
          dosis: '',
          frecuencia: '',
          duracion: '',
          indicaciones: ''
        }
      ]
    }));
  };

  const removerMedicamento = (index) => {
    if (formData.medicamentos.length > 1) {
      setFormData(prev => ({
        ...prev,
        medicamentos: prev.medicamentos.filter((_, i) => i !== index)
      }));
    }
  };

  const actualizarMedicamento = (index, campo, valor) => {
    setFormData(prev => ({
      ...prev,
      medicamentos: prev.medicamentos.map((med, i) => 
        i === index ? { ...med, [campo]: valor } : med
      )
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.folio_cita) {
      alert('Debes seleccionar una cita');
      return;
    }
    
    if (!formData.diagnostico) {
      alert('El diagnóstico es obligatorio');
      return;
    }
    
    if (!formData.tratamiento) {
      alert('El tratamiento es obligatorio');
      return;
    }
    
    if (formData.medicamentos.some(med => !med.nombre || !med.dosis)) {
      alert('Todos los medicamentos deben tener nombre y dosis');
      return;
    }

    try {
      setLoading(true);
      
      const datosReceta = {
        folio_cita: parseInt(formData.folio_cita),
        tratamiento: formData.tratamiento,
        diagnostico: formData.diagnostico,
        medicamento: formData.medicamentos.map(med => 
          `${med.nombre} ${med.dosis} - ${med.frecuencia} por ${med.duracion}. ${med.indicaciones}`
        ).join('; '),
        observaciones: formData.indicaciones_generales,
        cedula_medico: cedula
      };
      
      console.log('📝 Enviando datos de receta:', datosReceta);
      
      await medicoService.crearReceta(datosReceta);
      alert('✅ Receta creada correctamente');
      onSuccess();
    } catch (error) {
      console.error('❌ Error al crear receta:', error);
      alert('❌ Error al crear la receta: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  // Obtener citas del paciente seleccionado (que no tengan receta)
  const citasPacienteSeleccionado = citasDisponibles.filter(cita => 
    cita.curp_paciente === formData.curp_paciente
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal fade show d-block" tabIndex="-1" role="dialog">
        <div className="modal-dialog modal-lg" role="document" onClick={(e) => e.stopPropagation()}>
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">💊 Nueva Receta Médica</h5>
              <button type="button" className="btn-close" onClick={onClose}></button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {/* Información sobre citas disponibles */}
                {loadingCitas ? (
                  <div className="alert alert-info">
                    <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                    Cargando citas disponibles...
                  </div>
                ) : (
                  <div className="alert alert-info">
                    <strong>ℹ️ Citas disponibles para receta:</strong> {citasDisponibles.length}
                    {citasDisponibles.length === 0 && (
                      <div className="mt-2">
                        <small className="text-warning">
                          ⚠️ No hay citas atendidas sin receta. Todas las citas atendidas ya tienen receta asignada.
                        </small>
                      </div>
                    )}
                  </div>
                )}

                {/* Búsqueda de paciente */}
                <div className="card mb-4">
                  <div className="card-header">
                    <h6 className="mb-0">👤 Buscar Paciente</h6>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-8">
                        <input
                          type="text"
                          value={formData.curp_paciente}
                          onChange={(e) => setFormData({...formData, curp_paciente: e.target.value.toUpperCase()})}
                          placeholder="CURP del paciente"
                          className="form-control"
                          maxLength="18"
                          style={{ fontFamily: 'monospace' }}
                        />
                      </div>
                      <div className="col-md-4">
                        <button type="button" onClick={buscarPaciente} className="btn btn-primary w-100">
                          🔍 Buscar
                        </button>
                      </div>
                    </div>

                    {pacienteEncontrado && (
                      <div className="alert alert-success mt-3">
                        <strong>✅ Paciente encontrado:</strong><br />
                        {pacienteEncontrado.pac_nombre} {pacienteEncontrado.pac_paterno} {pacienteEncontrado.pac_materno}<br />
                        <small>Edad: {pacienteEncontrado.pac_edad} años</small>
                      </div>
                    )}
                  </div>
                </div>

                {/* Selección de cita SIN receta */}
                {pacienteEncontrado && (
                  <div className="card mb-4">
                    <div className="card-header">
                      <h6 className="mb-0">📅 Seleccionar Cita Sin Receta</h6>
                    </div>
                    <div className="card-body">
                      <select
                        value={formData.folio_cita}
                        onChange={(e) => setFormData({...formData, folio_cita: e.target.value})}
                        className="form-control"
                        required
                        disabled={citasPacienteSeleccionado.length === 0}
                      >
                        <option value="">-- Selecciona una cita sin receta --</option>
                        {citasPacienteSeleccionado.map((cita) => (
                          <option key={cita.folio_cita} value={cita.folio_cita}>
                            Folio #{cita.folio_cita} - {new Date(cita.cita_fechahora).toLocaleDateString('es-MX')} - {cita.nombre_especialidad}
                          </option>
                        ))}
                      </select>
                      {citasPacienteSeleccionado.length === 0 && pacienteEncontrado && (
                        <small className="text-warning">
                          ⚠️ Este paciente no tiene citas atendidas sin receta
                        </small>
                      )}
                    </div>
                  </div>
                )}

                {/* Información de la receta */}
                <div className="row">
                  <div className="col-12">
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

                    <div className="form-group mb-3">
                      <label className="form-label">Tratamiento *</label>
                      <textarea
                        value={formData.tratamiento}
                        onChange={(e) => setFormData({...formData, tratamiento: e.target.value})}
                        placeholder="Descripción del tratamiento..."
                        required
                        rows="2"
                        className="form-control"
                      />
                    </div>

                    <div className="form-group mb-3">
                      <label className="form-label">Indicaciones Generales</label>
                      <textarea
                        value={formData.indicaciones_generales}
                        onChange={(e) => setFormData({...formData, indicaciones_generales: e.target.value})}
                        placeholder="Indicaciones generales para el paciente..."
                        rows="2"
                        className="form-control"
                      />
                    </div>
                  </div>
                </div>

                {/* Medicamentos */}
                <div className="card">
                  <div className="card-header d-flex justify-content-between align-items-center">
                    <h6 className="mb-0">💊 Medicamentos</h6>
                    <button type="button" onClick={agregarMedicamento} className="btn btn-success btn-sm">
                      ➕ Agregar
                    </button>
                  </div>
                  <div className="card-body">
                    {formData.medicamentos.map((medicamento, index) => (
                      <div key={index} className="medicamento-form mb-4 p-3 border rounded">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <h6 className="mb-0">Medicamento {index + 1}</h6>
                          {formData.medicamentos.length > 1 && (
                            <button 
                              type="button" 
                              onClick={() => removerMedicamento(index)}
                              className="btn btn-danger btn-sm"
                            >
                              🗑️
                            </button>
                          )}
                        </div>

                        <div className="row">
                          <div className="col-md-6">
                            <div className="form-group mb-3">
                              <label className="form-label">Nombre del Medicamento *</label>
                              <input
                                type="text"
                                value={medicamento.nombre}
                                onChange={(e) => actualizarMedicamento(index, 'nombre', e.target.value)}
                                placeholder="Ej: Paracetamol"
                                required
                                className="form-control"
                              />
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="form-group mb-3">
                              <label className="form-label">Dosis *</label>
                              <input
                                type="text"
                                value={medicamento.dosis}
                                onChange={(e) => actualizarMedicamento(index, 'dosis', e.target.value)}
                                placeholder="Ej: 500mg"
                                required
                                className="form-control"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="row">
                          <div className="col-md-6">
                            <div className="form-group mb-3">
                              <label className="form-label">Frecuencia</label>
                              <select
                                value={medicamento.frecuencia}
                                onChange={(e) => actualizarMedicamento(index, 'frecuencia', e.target.value)}
                                className="form-control"
                              >
                                <option value="">Seleccionar frecuencia</option>
                                <option value="Cada 4 horas">Cada 4 horas</option>
                                <option value="Cada 6 horas">Cada 6 horas</option>
                                <option value="Cada 8 horas">Cada 8 horas</option>
                                <option value="Cada 12 horas">Cada 12 horas</option>
                                <option value="Una vez al día">Una vez al día</option>
                                <option value="Dos veces al día">Dos veces al día</option>
                                <option value="Tres veces al día">Tres veces al día</option>
                              </select>
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="form-group mb-3">
                              <label className="form-label">Duración</label>
                              <input
                                type="text"
                                value={medicamento.duracion}
                                onChange={(e) => actualizarMedicamento(index, 'duracion', e.target.value)}
                                placeholder="Ej: 7 días"
                                className="form-control"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="form-group mb-0">
                          <label className="form-label">Indicaciones Específicas</label>
                          <textarea
                            value={medicamento.indicaciones}
                            onChange={(e) => actualizarMedicamento(index, 'indicaciones', e.target.value)}
                            placeholder="Ej: Tomar con alimentos, antes de dormir, etc."
                            rows="2"
                            className="form-control"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={onClose} className="btn btn-secondary">
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={loading || !pacienteEncontrado || !formData.folio_cita || citasDisponibles.length === 0} 
                  className="btn btn-success"
                >
                  {loading ? 'Creando...' : '💊 Crear Receta'}
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

// Modal para ver detalles completos de una receta
const ModalDetallesReceta = ({ receta, onClose }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal fade show d-block" tabIndex="-1" role="dialog">
        <div className="modal-dialog modal-xl" role="document" onClick={(e) => e.stopPropagation()}>
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">💊 Detalles de Receta #{receta.folio_receta}</h5>
              <button type="button" className="btn-close" onClick={onClose}></button>
            </div>

            <div className="modal-body">
              <div className="row">
                <div className="col-md-6">
                  <h6>📋 Información de la Cita</h6>
                  <div className="border rounded p-3 mb-3">
                    <p><strong>Folio:</strong> #{receta.folio_cita}</p>
                    <p><strong>Fecha:</strong> {new Date(receta.fecha_cita).toLocaleDateString('es-MX')}</p>
                    <p><strong>Especialidad:</strong> {receta.nombre_especialidad}</p>
                    <p><strong>Estatus:</strong> <span className="badge badge-success">{receta.estatus_cita}</span></p>
                  </div>
                </div>
                
                <div className="col-md-6">
                  <h6>👤 Información del Paciente</h6>
                  <div className="border rounded p-3 mb-3">
                    <p><strong>Nombre:</strong> {receta.nombre_paciente}</p>
                    <p><strong>CURP:</strong> <span style={{fontFamily: 'monospace'}}>{receta.curp_paciente}</span></p>
                    <p><strong>Edad:</strong> {receta.pac_edad} años</p>
                    <p><strong>Teléfono:</strong> {receta.telefono_paciente || 'No registrado'}</p>
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-12">
                  <h6>🏥 Diagnóstico</h6>
                  <div className="border rounded p-3 mb-3">
                    <p>{receta.diagnostico}</p>
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-12">
                  <h6>💉 Tratamiento</h6>
                  <div className="border rounded p-3 mb-3">
                    <p>{receta.tratamiento}</p>
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-12">
                  <h6>💊 Medicamentos Prescritos</h6>
                  <div className="border rounded p-3 mb-3">
                    {receta.medicamentos && Array.isArray(receta.medicamentos) ? (
                      receta.medicamentos.map((medicamento, index) => (
                        <div key={index} className="medicamento-detalle mb-3 p-2 border-left border-primary">
                          <div className="row">
                            <div className="col-md-6">
                              <strong>{medicamento.nombre}</strong>
                              <br />
                              <small className="text-muted">Dosis: {medicamento.dosis}</small>
                            </div>
                            <div className="col-md-6">
                              <small className="text-muted">
                                <strong>Frecuencia:</strong> {medicamento.frecuencia}<br />
                                <strong>Duración:</strong> {medicamento.duracion}
                              </small>
                            </div>
                          </div>
                          {medicamento.indicaciones && (
                            <div className="mt-2">
                              <small><strong>Indicaciones:</strong> {medicamento.indicaciones}</small>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-muted">
                        <p>💊 {receta.medicamentos || 'Sin medicamentos específicos registrados'}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {receta.observaciones_generales && (
                <div className="row">
                  <div className="col-12">
                    <h6>📝 Observaciones Generales</h6>
                    <div className="border rounded p-3 mb-3">
                      <p>{receta.observaciones_generales}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="row">
                <div className="col-md-6">
                  <h6>👨‍⚕️ Médico Prescriptor</h6>
                  <div className="border rounded p-3">
                    <p><strong>{receta.nombre_medico}</strong></p>
                    <p><small className="text-muted">Especialidad: {receta.nombre_especialidad}</small></p>
                  </div>
                </div>
                
                <div className="col-md-6">
                  <h6>📅 Información de Emisión</h6>
                  <div className="border rounded p-3">
                    <p><strong>Fecha de emisión:</strong> {new Date(receta.fecha_emision).toLocaleDateString('es-MX')}</p>
                    <p><strong>Folio de receta:</strong> {receta.folio_receta}</p>
                    <p><strong>Estado:</strong> <span className="badge badge-success">{receta.estatus_receta}</span></p>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" onClick={onClose} className="btn btn-secondary">
                Cerrar
              </button>
              <button 
                type="button" 
                onClick={() => window.print()} 
                className="btn btn-primary"
              >
                🖨️ Imprimir Receta
              </button>
              <button 
                type="button" 
                onClick={() => alert('Funcionalidad de envío en desarrollo')} 
                className="btn btn-info"
              >
                📧 Enviar por Email
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop show"></div>
    </div>
  );
};

export default RecetasMedico;