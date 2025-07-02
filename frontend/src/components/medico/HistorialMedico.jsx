//src/components/medico/HistorialMedico.jsx

import React, { useEffect, useState } from 'react';
import { authService } from '../../services/authService';
import { medicoService } from '../../services/medicoService';

const HistorialMedico = ({ medicoCedula, medicoNombre }) => {
  const [vistaActiva, setVistaActiva] = useState('mis-pacientes');
  const [historialPacientes, setHistorialPacientes] = useState([]);
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState('');
  const [pacienteDatos, setPacienteDatos] = useState(null);
  const [historialDetallado, setHistorialDetallado] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [error, setError] = useState(null);
  const [busquedaCurp, setBusquedaCurp] = useState('');
  const [filtros, setFiltros] = useState({
    fechaInicio: '',
    fechaFin: '',
    tipoMovimiento: '',
    mostrarSoloMisPacientes: true
  });

  // Debug: Verificar props recibidas
  useEffect(() => {
    console.log('🔍 Props recibidas en HistorialMedico:', { medicoCedula, medicoNombre });
    if (!medicoCedula) {
      console.warn('⚠️ medicoCedula está vacía o undefined');
      setError('No se proporcionó cédula del médico');
    }
  }, [medicoCedula, medicoNombre]);

  // Cargar datos según la vista activa
  useEffect(() => {
    if (vistaActiva === 'mis-pacientes' && medicoCedula) {
      cargarPacientesDelMedico();
    }
  }, [medicoCedula, vistaActiva]);

  const cargarPacientesDelMedico = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('👨‍⚕️ Cargando pacientes del médico:', medicoCedula);
      
      // Usar la función del authService para obtener movimientos del médico
      const response = await authService.obtenerMovimientosMedico(medicoCedula, medicoNombre);
      
      if (response.success && response.data) {
        console.log('📊 Movimientos recibidos:', response.data.length);
        
        // Extraer pacientes únicos
        const pacientesUnicos = {};
        let movimientosProcesados = 0;
        let pacientesEncontrados = 0;

        response.data.forEach((mov, index) => {
          movimientosProcesados++;
          console.log(`🔄 Procesando movimiento ${index + 1}:`, {
            paciente_id: mov.paciente_id,
            paciente_nombre: mov.paciente_nombre,
            fecha_movimiento: mov.fecha_movimiento
          });

          if (mov.paciente_nombre && mov.paciente_id) {
            if (!pacientesUnicos[mov.paciente_id]) {
              pacientesEncontrados++;
              pacientesUnicos[mov.paciente_id] = {
                curp: mov.paciente_id,
                nombre: mov.paciente_nombre,
                ultimoMovimiento: mov.fecha_movimiento,
                totalConsultas: 1
              };
            } else {
              // Actualizar contador y fecha más reciente
              pacientesUnicos[mov.paciente_id].totalConsultas++;
              if (new Date(mov.fecha_movimiento) > new Date(pacientesUnicos[mov.paciente_id].ultimoMovimiento)) {
                pacientesUnicos[mov.paciente_id].ultimoMovimiento = mov.fecha_movimiento;
              }
            }
          }
        });

        const pacientesArray = Object.values(pacientesUnicos);
        console.log('📊 Resumen:', {
          movimientosProcesados,
          pacientesEncontrados,
          pacientesUnicosFinales: pacientesArray.length
        });

        setHistorialPacientes(pacientesArray);
        
        if (pacientesArray.length === 0) {
          setError('No se encontraron pacientes en el historial del médico');
        }
      } else {
        throw new Error(response.message || 'Error obteniendo movimientos');
      }
    } catch (error) {
      console.error('❌ Error cargando pacientes del médico:', error);
      setError(`Error al cargar pacientes: ${authService.handleError(error)}`);
      setHistorialPacientes([]);
    } finally {
      setLoading(false);
    }
  };

  const cargarHistorialDetallado = async (curpPaciente) => {
    if (!curpPaciente) return;

    try {
      setLoadingDetalle(true);
      setError(null);
      console.log('📋 Cargando historial detallado para:', curpPaciente);
      
      // Usar la función del authService para obtener historial del paciente
      const response = await medicoService.obtenerHistorialPaciente(curpPaciente);
      
      if (response.success && response.data) {
        console.log('✅ Historial cargado:', response.data.length, 'registros');
        setHistorialDetallado(response.data);
        
        // Intentar obtener datos básicos del paciente también
        try {
          const pacienteResponse = await authService.obtenerDatosPacienteMedico(curpPaciente);
          if (pacienteResponse.success) {
            setPacienteDatos(pacienteResponse.data);
          }
        } catch (pacienteError) {
          console.warn('⚠️ No se pudieron cargar datos básicos del paciente:', pacienteError);
        }
      } else {
        throw new Error(response.message || 'Error cargando historial');
      }
    } catch (error) {
      console.error('❌ Error cargando historial:', error);
      setError(`Error al cargar historial: ${authService.handleError(error)}`);
      setHistorialDetallado([]);
    } finally {
      setLoadingDetalle(false);
    }
  };

  const buscarPacientePorCurp = async () => {
    if (!busquedaCurp.trim()) {
      alert('Ingresa un CURP válido');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('🔍 Buscando paciente por CURP:', busquedaCurp);
      
      // Buscar datos del paciente
      const pacienteResponse = await authService.obtenerDatosPacienteMedico(busquedaCurp.toUpperCase());
      
      if (pacienteResponse.success && pacienteResponse.data) {
        setPacienteDatos(pacienteResponse.data);
        setPacienteSeleccionado(busquedaCurp.toUpperCase());
        
        // Cargar historial del paciente
        await cargarHistorialDetallado(busquedaCurp.toUpperCase());
      } else {
        throw new Error('Paciente no encontrado o sin permisos para verlo');
      }
    } catch (error) {
      console.error('❌ Error buscando paciente:', error);
      alert(`❌ ${authService.handleError(error)}`);
      setPacienteDatos(null);
      setHistorialDetallado([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSeleccionarPaciente = (curp) => {
    console.log('👤 Seleccionando paciente:', curp);
    setPacienteSeleccionado(curp);
    setPacienteDatos(null); // Limpiar datos anteriores
    cargarHistorialDetallado(curp);
  };

  const limpiarBusqueda = () => {
    setBusquedaCurp('');
    setPacienteSeleccionado('');
    setPacienteDatos(null);
    setHistorialDetallado([]);
    setError(null);
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'Fecha no disponible';
    try {
      return new Date(fecha).toLocaleString('es-MX', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.warn('⚠️ Error formateando fecha:', fecha, error);
      return 'Fecha inválida';
    }
  };

  const getIconoTipoMovimiento = (tipo) => {
    switch (tipo) {
      case 'INSERT': return '➕';
      case 'UPDATE': return '✏️';
      case 'DELETE': return '🗑️';
      default: return '📝';
    }
  };

  const getColorTipoMovimiento = (tipo) => {
    switch (tipo) {
      case 'INSERT': return 'success';
      case 'UPDATE': return 'warning';
      case 'DELETE': return 'danger';
      default: return 'info';
    }
  };

  // Filtrar historial según criterios
  const historialFiltrado = historialDetallado.filter(item => {
    let cumpleFiltros = true;
    
    if (filtros.fechaInicio) {
      cumpleFiltros = cumpleFiltros && new Date(item.fecha_movimiento) >= new Date(filtros.fechaInicio);
    }
    
    if (filtros.fechaFin) {
      cumpleFiltros = cumpleFiltros && new Date(item.fecha_movimiento) <= new Date(filtros.fechaFin);
    }
    
    if (filtros.tipoMovimiento) {
      cumpleFiltros = cumpleFiltros && item.tipo_movimiento === filtros.tipoMovimiento;
    }
    
    if (filtros.mostrarSoloMisPacientes && medicoCedula) {
      cumpleFiltros = cumpleFiltros && (
        item.usuario_responsable?.includes(medicoNombre) || 
        item.medico_responsable?.includes(medicoNombre) ||
        item.medico_cedula === medicoCedula
      );
    }
    
    return cumpleFiltros;
  });

  // Calcular estadísticas
  const estadisticas = {
    totalPacientes: historialPacientes.length,
    consultasEesteMes: historialPacientes.reduce((total, paciente) => {
      const esEsteMes = new Date(paciente.ultimoMovimiento).getMonth() === new Date().getMonth();
      return total + (esEsteMes ? paciente.totalConsultas || 1 : 0);
    }, 0),
    totalConsultas: historialPacientes.reduce((total, paciente) => total + (paciente.totalConsultas || 1), 0)
  };

  if (loading) {
    return (
      <div className="card">
        <div className="card-body text-center">
          <div className="spinner-border" role="status">
            <span className="sr-only">Cargando...</span>
          </div>
          <p className="mt-3">Cargando historial médico...</p>
        </div>
      </div>
    );
  }

  if (error && !historialPacientes.length && vistaActiva === 'mis-pacientes') {
    return (
      <div className="card">
        <div className="card-body">
          <div className="alert alert-danger">
            <h5 className="alert-heading">❌ Error</h5>
            <p>{error}</p>
            <hr />
            <button 
              className="btn btn-outline-danger btn-sm"
              onClick={() => {
                setError(null);
                if (medicoCedula) {
                  cargarPacientesDelMedico();
                }
              }}
            >
              🔄 Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header d-flex justify-content-between align-items-center">
        <div>
          <h2 className="mb-0">📋 Historial Médico</h2>
          <small className="text-muted">Dr. {medicoNombre} - Cédula: {medicoCedula}</small>
        </div>
        <div className="btn-group" role="group">
          <button
            className={`btn ${vistaActiva === 'mis-pacientes' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setVistaActiva('mis-pacientes')}
          >
            👨‍⚕️ Mis Pacientes
          </button>
          <button
            className={`btn ${vistaActiva === 'buscar-paciente' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setVistaActiva('buscar-paciente')}
          >
            🔍 Buscar Paciente
          </button>
        </div>
      </div>

      <div className="card-body">
        {vistaActiva === 'mis-pacientes' ? (
          <div>
            {/* Estadísticas */}
            <div className="row mb-4">
              <div className="col-md-4">
                <div className="card border-primary">
                  <div className="card-body text-center">
                    <h5 className="card-title">👥 Total Pacientes</h5>
                    <h2 className="text-primary">{estadisticas.totalPacientes}</h2>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card border-success">
                  <div className="card-body text-center">
                    <h5 className="card-title">📊 Total Consultas</h5>
                    <h2 className="text-success">{estadisticas.totalConsultas}</h2>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card border-info">
                  <div className="card-body text-center">
                    <h5 className="card-title">📅 Este Mes</h5>
                    <h2 className="text-info">{estadisticas.consultasEesteMes}</h2>
                  </div>
                </div>
              </div>
            </div>

            <div className="row">
              {/* Lista de Pacientes */}
              <div className="col-md-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5>👥 Mis Pacientes</h5>
                  <button 
                    className="btn btn-sm btn-outline-primary"
                    onClick={cargarPacientesDelMedico}
                    disabled={loading}
                  >
                    🔄 Recargar
                  </button>
                </div>
                
                {historialPacientes.length === 0 ? (
                  <div className="alert alert-info">
                    <i className="fas fa-info-circle"></i> 
                    <p className="mb-2">No hay pacientes registrados en el historial</p>
                  </div>
                ) : (
                  <div className="list-group" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                    {historialPacientes
                      .sort((a, b) => new Date(b.ultimoMovimiento) - new Date(a.ultimoMovimiento))
                      .map(paciente => (
                        <button
                          key={paciente.curp}
                          className={`list-group-item list-group-item-action ${pacienteSeleccionado === paciente.curp ? 'active' : ''}`}
                          onClick={() => handleSeleccionarPaciente(paciente.curp)}
                        >
                          <div className="d-flex w-100 justify-content-between">
                            <h6 className="mb-1">{paciente.nombre}</h6>
                            <small>{formatearFecha(paciente.ultimoMovimiento)}</small>
                          </div>
                          <div className="d-flex w-100 justify-content-between">
                            <small className="text-muted">CURP: {paciente.curp}</small>
                            <span className="badge badge-primary badge-pill">{paciente.totalConsultas}</span>
                          </div>
                        </button>
                      ))}
                  </div>
                )}
              </div>

              {/* Historial Detallado */}
              <div className="col-md-8">
                {pacienteSeleccionado ? (
                  <>
                    {/* Información del paciente si está disponible */}
                    {pacienteDatos && (
                      <div className="card mb-3 border-success">
                        <div className="card-header bg-success text-white">
                          <h6 className="mb-0">👤 Información del Paciente</h6>
                        </div>
                        <div className="card-body py-2">
                          <div className="row">
                            <div className="col-md-6">
                              <small><strong>Nombre:</strong> {pacienteDatos.pac_nombre} {pacienteDatos.pac_paterno} {pacienteDatos.pac_materno}</small><br/>
                              <small><strong>Edad:</strong> {pacienteDatos.pac_edad} años</small>
                            </div>
                            <div className="col-md-6">
                              <small><strong>Tipo de sangre:</strong> {pacienteDatos.tipo_sangre}</small><br/>
                              <small><strong>Alergias:</strong> {pacienteDatos.alergias}</small>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h5>📋 Historial Detallado</h5>
                      <div className="btn-group" role="group">
                        <button 
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => cargarHistorialDetallado(pacienteSeleccionado)}
                          disabled={loadingDetalle}
                        >
                          🔄 Actualizar
                        </button>
                      </div>
                    </div>

                    {/* Filtros */}
                    <div className="card mb-3">
                      <div className="card-body py-2">
                        <div className="row">
                          <div className="col-md-3">
                            <label className="form-label small">Fecha Inicio</label>
                            <input
                              type="date"
                              className="form-control form-control-sm"
                              value={filtros.fechaInicio}
                              onChange={(e) => setFiltros(prev => ({...prev, fechaInicio: e.target.value}))}
                            />
                          </div>
                          <div className="col-md-3">
                            <label className="form-label small">Fecha Fin</label>
                            <input
                              type="date"
                              className="form-control form-control-sm"
                              value={filtros.fechaFin}
                              onChange={(e) => setFiltros(prev => ({...prev, fechaFin: e.target.value}))}
                            />
                          </div>
                          <div className="col-md-3">
                            <label className="form-label small">Tipo</label>
                            <select
                              className="form-control form-control-sm"
                              value={filtros.tipoMovimiento}
                              onChange={(e) => setFiltros(prev => ({...prev, tipoMovimiento: e.target.value}))}
                            >
                              <option value="">Todos</option>
                              <option value="INSERT">Creaciones</option>
                              <option value="UPDATE">Actualizaciones</option>
                              <option value="DELETE">Eliminaciones</option>
                            </select>
                          </div>
                          <div className="col-md-3 d-flex align-items-end">
                            <div className="form-check">
                              <input
                                type="checkbox"
                                className="form-check-input"
                                checked={filtros.mostrarSoloMisPacientes}
                                onChange={(e) => setFiltros(prev => ({...prev, mostrarSoloMisPacientes: e.target.checked}))}
                              />
                              <label className="form-check-label small">Solo mis registros</label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {loadingDetalle ? (
                      <div className="text-center py-4">
                        <div className="spinner-border spinner-border-sm" role="status"></div>
                        <p className="mt-2 small">Cargando historial...</p>
                      </div>
                    ) : historialFiltrado.length === 0 ? (
                      <div className="alert alert-warning">
                        <i className="fas fa-exclamation-triangle"></i> No hay registros en el historial con los filtros seleccionados
                      </div>
                    ) : (
                      <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                        {historialFiltrado.map((item) => (
                          <div key={item.id_bitacora} className="card mb-3 border-start border-4" 
                               style={{ borderLeftColor: getColorTipoMovimiento(item.tipo_movimiento) === 'success' ? '#28a745' : 
                                                       getColorTipoMovimiento(item.tipo_movimiento) === 'warning' ? '#ffc107' : 
                                                       getColorTipoMovimiento(item.tipo_movimiento) === 'danger' ? '#dc3545' : '#17a2b8' }}>
                            <div className="card-body py-3">
                              <div className="d-flex align-items-center mb-2">
                                <span className="me-2" style={{ fontSize: '1.2em' }}>
                                  {getIconoTipoMovimiento(item.tipo_movimiento)}
                                </span>
                                <h6 className="mb-0 flex-grow-1">{item.descripcion}</h6>
                                <span className={`badge bg-${getColorTipoMovimiento(item.tipo_movimiento)} ms-2`}>
                                  {item.tipo_movimiento}
                                </span>
                              </div>
                              
                              <div className="row text-sm">
                                <div className="col-md-6">
                                  <strong>📅 Fecha:</strong> {formatearFecha(item.fecha_movimiento)}<br />
                                  <strong>👨‍⚕️ Médico:</strong> {item.medico_responsable || item.medico_nombre || 'No especificado'}<br />
                                  {item.especialidad && (
                                    <><strong>🏥 Especialidad:</strong> {item.especialidad}<br /></>
                                  )}
                                </div>
                                <div className="col-md-6">
                                  {item.consultorio && (
                                    <><strong>🏢 Consultorio:</strong> {item.consultorio}<br /></>
                                  )}
                                  {item.folio_cita && (
                                    <><strong>📋 Folio Cita:</strong> {item.folio_cita}<br /></>
                                  )}
                                  {item.id_receta && (
                                    <><strong>💊 ID Receta:</strong> {item.id_receta}<br /></>
                                  )}
                                </div>
                              </div>
                              
                              {item.diagnostico && (
                                <div className="mt-2">
                                  <strong>🩺 Diagnóstico:</strong>
                                  <div className="alert alert-light mt-1 mb-0 py-2">
                                    {item.diagnostico}
                                  </div>
                                </div>
                              )}
                              
                              {item.detalles_adicionales && (
                                <div className="mt-2">
                                  <strong>📝 Detalles:</strong>
                                  <div className="text-muted small">
                                    {item.detalles_adicionales}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-5">
                    <i className="fas fa-user-md fa-3x text-muted mb-3"></i>
                    <h5 className="text-muted">Selecciona un paciente</h5>
                    <p className="text-muted">Elige un paciente de la lista para ver su historial médico completo</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div>
            {/* Buscador de paciente */}
            <div className="card mb-4">
              <div className="card-body">
                <div className="row">
                  <div className="col-md-8">
                    <label className="form-label">CURP del Paciente:</label>
                    <input
                      type="text"
                      value={busquedaCurp}
                      onChange={(e) => setBusquedaCurp(e.target.value.toUpperCase())}
                      placeholder="AAAA######HHHHHH##"
                      className="form-control"
                      maxLength="18"
                      style={{ fontFamily: 'monospace' }}
                    />
                  </div>
                  <div className="col-md-4 d-flex align-items-end gap-2">
                    <button 
                      onClick={buscarPacientePorCurp} 
                      className="btn btn-primary" 
                      disabled={loading}
                    >
                      {loading ? 'Buscando...' : '🔍 Buscar'}
                    </button>
                    <button onClick={limpiarBusqueda} className="btn btn-outline-secondary">
                      🗑️ Limpiar
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Mostrar información del paciente buscado */}
            {pacienteDatos && (
              <div className="card mb-4 border-success">
                <div className="card-header bg-success text-white">
                  <h5 className="mb-0">👤 Información del Paciente</h5>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-6">
                      <p><strong>Nombre:</strong> {pacienteDatos.pac_nombre} {pacienteDatos.pac_paterno} {pacienteDatos.pac_materno}</p>
                      <p><strong>CURP:</strong> {pacienteDatos.CURP}</p>
                      <p><strong>Edad:</strong> {pacienteDatos.pac_edad} años</p>
                    </div>
                    <div className="col-md-6">
                      <p><strong>Teléfono:</strong> {pacienteDatos.pac_tel || 'No registrado'}</p>
                      <p><strong>Tipo de sangre:</strong> {pacienteDatos.tipo_sangre}</p>
                      <p><strong>Alergias:</strong> {pacienteDatos.alergias}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Historial del paciente buscado */}
            {pacienteSeleccionado && (
              <div className="card">
                <div className="card-header">
                  <h5 className="mb-0">📋 Historial Médico</h5>
                </div>
                <div className="card-body">
                  {historialDetallado.length === 0 ? (
                    <div className="text-center py-5">
                      <h4 className="text-muted">📋 Sin historial médico</h4>
                      <p className="text-muted">Este paciente no tiene registros médicos previos.</p>
                    </div>
                  ) : (
                    <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                      {historialDetallado.map((registro) => (
                        <div key={registro.id_bitacora} className="card mb-3">
                          <div className="card-header d-flex justify-content-between">
                            <span className="font-weight-bold">
                              {formatearFecha(registro.fecha_movimiento)}
                            </span>
                            <small className="text-muted">{registro.medico_responsable || registro.medico_nombre}</small>
                          </div>
                          <div className="card-body">
                            <div className="mb-2">
                              <strong>📝 Descripción:</strong> {registro.descripcion}
                            </div>
                            {registro.diagnostico && (
                              <div className="mb-2">
                                <strong>🩺 Diagnóstico:</strong> {registro.diagnostico}
                              </div>
                            )}
                            {registro.detalles_adicionales && (
                              <div className="mb-2">
                                <strong>📋 Detalles:</strong> {registro.detalles_adicionales}
                              </div>
                            )}
                            <div className="d-flex gap-2 mt-2">
                              <span className={`badge badge-${getColorTipoMovimiento(registro.tipo_movimiento)}`}>
                                {getIconoTipoMovimiento(registro.tipo_movimiento)} {registro.tipo_movimiento}
                              </span>
                              {registro.especialidad && (
                                <span className="badge badge-info">🏥 {registro.especialidad}</span>
                              )}
                              {registro.folio_cita && (
                                <span className="badge badge-secondary">📋 {registro.folio_cita}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HistorialMedico;