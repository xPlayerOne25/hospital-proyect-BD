import React, { useEffect, useState } from 'react';

const BitacoraAdministrador = () => {
  const [movimientos, setMovimientos] = useState([]);
  const [estadisticas, setEstadisticas] = useState({});
  const [ultimosMovimientos, setUltimosMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    tipo_movimiento: '',
    tabla_afectada: '',
    fecha_inicio: '',
    fecha_fin: '',
    paciente_curp: '',
    medico_cedula: '',
    limit: 50,
    offset: 0
  });
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    cargarMovimientos();
  }, [filtros]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      console.log('📊 Cargando estadísticas de bitácora...');
      
      const response = await fetch('/api/bitacora/estadisticas');
      const data = await response.json();
      
      if (data.success) {
        setEstadisticas(data.estadisticas);
        setUltimosMovimientos(data.ultimos_movimientos);
        console.log('✅ Estadísticas cargadas:', data.estadisticas);
      }
    } catch (error) {
      console.error('❌ Error cargando estadísticas:', error);
      alert('Error al cargar las estadísticas de la bitácora');
    } finally {
      setLoading(false);
    }
  };

  const cargarMovimientos = async () => {
    try {
      console.log('📋 Cargando movimientos con filtros:', filtros);
      
      const params = new URLSearchParams();
      Object.keys(filtros).forEach(key => {
        if (filtros[key]) {
          params.append(key, filtros[key]);
        }
      });
      
      const response = await fetch(`/api/bitacora/completa?${params.toString()}`);
      const data = await response.json();
      
      if (data.success) {
        setMovimientos(data.data);
        console.log('✅ Movimientos cargados:', data.data.length);
      }
    } catch (error) {
      console.error('❌ Error cargando movimientos:', error);
      alert('Error al cargar los movimientos de la bitácora');
    }
  };

  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor,
      offset: 0 // Reset pagination
    }));
  };

  const limpiarFiltros = () => {
    setFiltros({
      tipo_movimiento: '',
      tabla_afectada: '',
      fecha_inicio: '',
      fecha_fin: '',
      paciente_curp: '',
      medico_cedula: '',
      limit: 50,
      offset: 0
    });
    setBusqueda('');
  };

  const exportarBitacora = async () => {
    try {
      console.log('📄 Exportando bitácora...');
      // Aquí podrías implementar la exportación a CSV/Excel
      alert('Funcionalidad de exportación en desarrollo');
    } catch (error) {
      console.error('❌ Error exportando:', error);
      alert('Error al exportar la bitácora');
    }
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleString('es-MX', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getIconoTipoMovimiento = (tipo) => {
    switch (tipo) {
      case 'INSERT': return '➕';
      case 'UPDATE': return '✏️';
      case 'DELETE': return '🗑️';
      default: return '📝';
    }
  };

  const getBadgeColor = (tipo) => {
    switch (tipo) {
      case 'INSERT': return 'success';
      case 'UPDATE': return 'warning';
      case 'DELETE': return 'danger';
      default: return 'info';
    }
  };

  const getTablaIcon = (tabla) => {
    switch (tabla) {
      case 'CITA': return '📅';
      case 'RECETA': return '💊';
      case 'MEDICO': return '👨‍⚕️';
      case 'PACIENTE': return '👤';
      default: return '📋';
    }
  };

  // Filtrar movimientos por búsqueda
  const movimientosFiltrados = movimientos.filter(mov => {
    if (!busqueda) return true;
    const busquedaLower = busqueda.toLowerCase();
    return (
      mov.descripcion?.toLowerCase().includes(busquedaLower) ||
      mov.paciente_nombre?.toLowerCase().includes(busquedaLower) ||
      mov.medico_nombre?.toLowerCase().includes(busquedaLower) ||
      mov.usuario_responsable?.toLowerCase().includes(busquedaLower)
    );
  });

  if (loading) {
    return (
      <div className="card">
        <div className="card-body text-center">
          <div className="spinner-border" role="status">
            <span className="sr-only">Cargando...</span>
          </div>
          <p className="mt-3">Cargando bitácora del sistema...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="row">
        {/* Estadísticas */}
        <div className="col-12 mb-4">
          <div className="card">
            <div className="card-header">
              <h3 className="mb-0">📊 Bitácora del Sistema - Panel de Administración</h3>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-2">
                  <div className="card bg-primary text-white">
                    <div className="card-body text-center">
                      <h4>{estadisticas.total_movimientos || 0}</h4>
                      <small>Total Movimientos</small>
                    </div>
                  </div>
                </div>
                <div className="col-md-2">
                  <div className="card bg-success text-white">
                    <div className="card-body text-center">
                      <h4>{estadisticas.total_inserts || 0}</h4>
                      <small>Creaciones</small>
                    </div>
                  </div>
                </div>
                <div className="col-md-2">
                  <div className="card bg-warning text-white">
                    <div className="card-body text-center">
                      <h4>{estadisticas.total_updates || 0}</h4>
                      <small>Actualizaciones</small>
                    </div>
                  </div>
                </div>
                <div className="col-md-2">
                  <div className="card bg-danger text-white">
                    <div className="card-body text-center">
                      <h4>{estadisticas.total_deletes || 0}</h4>
                      <small>Eliminaciones</small>
                    </div>
                  </div>
                </div>
                <div className="col-md-2">
                  <div className="card bg-info text-white">
                    <div className="card-body text-center">
                      <h4>{estadisticas.movimientos_hoy || 0}</h4>
                      <small>Hoy</small>
                    </div>
                  </div>
                </div>
                <div className="col-md-2">
                  <div className="card bg-secondary text-white">
                    <div className="card-body text-center">
                      <h4>{estadisticas.pacientes_afectados || 0}</h4>
                      <small>Pacientes</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="col-md-3">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">🔍 Filtros</h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label className="form-label">Búsqueda</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Buscar en descripciones..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Tipo de Movimiento</label>
                <select
                  className="form-control"
                  value={filtros.tipo_movimiento}
                  onChange={(e) => handleFiltroChange('tipo_movimiento', e.target.value)}
                >
                  <option value="">Todos</option>
                  <option value="INSERT">➕ Creaciones</option>
                  <option value="UPDATE">✏️ Actualizaciones</option>
                  <option value="DELETE">🗑️ Eliminaciones</option>
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label">Tabla Afectada</label>
                <select
                  className="form-control"
                  value={filtros.tabla_afectada}
                  onChange={(e) => handleFiltroChange('tabla_afectada', e.target.value)}
                >
                  <option value="">Todas</option>
                  <option value="CITA">📅 Citas</option>
                  <option value="RECETA">💊 Recetas</option>
                  <option value="MEDICO">👨‍⚕️ Médicos</option>
                  <option value="PACIENTE">👤 Pacientes</option>
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label">Fecha Inicio</label>
                <input
                  type="datetime-local"
                  className="form-control"
                  value={filtros.fecha_inicio}
                  onChange={(e) => handleFiltroChange('fecha_inicio', e.target.value)}
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Fecha Fin</label>
                <input
                  type="datetime-local"
                  className="form-control"
                  value={filtros.fecha_fin}
                  onChange={(e) => handleFiltroChange('fecha_fin', e.target.value)}
                />
              </div>

              <div className="mb-3">
                <label className="form-label">CURP Paciente</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="CURP del paciente"
                  value={filtros.paciente_curp}
                  onChange={(e) => handleFiltroChange('paciente_curp', e.target.value)}
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Cédula Médico</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Cédula del médico"
                  value={filtros.medico_cedula}
                  onChange={(e) => handleFiltroChange('medico_cedula', e.target.value)}
                />
              </div>

              <div className="d-grid gap-2">
                <button className="btn btn-secondary" onClick={limpiarFiltros}>
                  🔄 Limpiar Filtros
                </button>
                <button className="btn btn-success" onClick={exportarBitacora}>
                  📄 Exportar
                </button>
              </div>
            </div>
          </div>

          {/* Últimos Movimientos */}
          <div className="card mt-3">
            <div className="card-header">
              <h6 className="mb-0">⚡ Últimos Movimientos</h6>
            </div>
            <div className="card-body">
              {ultimosMovimientos.map((mov, index) => (
                <div key={index} className="border-bottom pb-2 mb-2">
                  <div className="d-flex align-items-center">
                    <span className="me-2">{getIconoTipoMovimiento(mov.tipo_movimiento)}</span>
                    <div className="flex-grow-1">
                      <div className="small">{mov.descripcion}</div>
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                        {formatearFecha(mov.fecha_movimiento)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Lista de Movimientos */}
        <div className="col-md-9">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">📋 Registro de Movimientos</h5>
              <div>
                <small className="text-muted">
                  Mostrando {movimientosFiltrados.length} de {movimientos.length} registros
                </small>
              </div>
            </div>
            <div className="card-body p-0">
              <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                {movimientosFiltrados.length === 0 ? (
                  <div className="text-center py-5">
                    <i className="fas fa-search fa-3x text-muted mb-3"></i>
                    <h5 className="text-muted">No se encontraron movimientos</h5>
                    <p className="text-muted">Ajusta los filtros para ver más resultados</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead className="table-dark sticky-top">
                        <tr>
                          <th width="120">Fecha/Hora</th>
                          <th width="80">Tipo</th>
                          <th width="80">Tabla</th>
                          <th>Descripción</th>
                          <th width="150">Usuario</th>
                          <th width="150">Paciente</th>
                          <th width="120">Médico</th>
                          <th width="80">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {movimientosFiltrados.map((mov) => (
                          <tr key={mov.id_bitacora}>
                            <td>
                              <small>{formatearFecha(mov.fecha_movimiento)}</small>
                            </td>
                            <td>
                              <span className={`badge bg-${getBadgeColor(mov.tipo_movimiento)} d-flex align-items-center`}>
                                {getIconoTipoMovimiento(mov.tipo_movimiento)}
                                <span className="ms-1">{mov.tipo_movimiento}</span>
                              </span>
                            </td>
                            <td>
                              <span className="badge bg-secondary d-flex align-items-center">
                                {getTablaIcon(mov.tabla_afectada)}
                                <span className="ms-1">{mov.tabla_afectada}</span>
                              </span>
                            </td>
                            <td>
                              <div>
                                {mov.descripcion}
                                {mov.diagnostico && (
                                  <div className="small text-muted">
                                    🩺 {mov.diagnostico}
                                  </div>
                                )}
                                {mov.folio_cita && (
                                  <div className="small text-info">
                                    📋 Folio: {mov.folio_cita}
                                  </div>
                                )}
                                {mov.id_receta && (
                                  <div className="small text-success">
                                    💊 Receta: {mov.id_receta}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td>
                              <small>{mov.usuario_responsable || 'Sistema'}</small>
                            </td>
                            <td>
                              {mov.paciente_nombre ? (
                                <div>
                                  <div className="small">{mov.paciente_nombre}</div>
                                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                                    {mov.paciente_id}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-muted">-</span>
                              )}
                            </td>
                            <td>
                              {mov.medico_nombre ? (
                                <div>
                                  <div className="small">{mov.medico_nombre}</div>
                                  {mov.especialidad && (
                                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                                      {mov.especialidad}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted">-</span>
                              )}
                            </td>
                            <td>
                              <button
                                className="btn btn-sm btn-outline-info"
                                onClick={() => {
                                  alert(`Detalles del movimiento:\n\n${JSON.stringify(mov, null, 2)}`);
                                }}
                                title="Ver detalles completos"
                              >
                                👁️
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
            
            {/* Paginación */}
            {movimientos.length >= filtros.limit && (
              <div className="card-footer">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <select
                      className="form-select form-select-sm"
                      style={{ width: 'auto' }}
                      value={filtros.limit}
                      onChange={(e) => handleFiltroChange('limit', parseInt(e.target.value))}
                    >
                      <option value={25}>25 por página</option>
                      <option value={50}>50 por página</option>
                      <option value={100}>100 por página</option>
                      <option value={200}>200 por página</option>
                    </select>
                  </div>
                  
                  <div className="btn-group">
                    <button
                      className="btn btn-outline-secondary btn-sm"
                      disabled={filtros.offset === 0}
                      onClick={() => handleFiltroChange('offset', Math.max(0, filtros.offset - filtros.limit))}
                    >
                      ⬅️ Anterior
                    </button>
                    <button
                      className="btn btn-outline-secondary btn-sm"
                      disabled={movimientos.length < filtros.limit}
                      onClick={() => handleFiltroChange('offset', filtros.offset + filtros.limit)}
                    >
                      Siguiente ➡️
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BitacoraAdministrador;