//File: frontend/src/components/recepcionista/CitasRecepcionista.jsx

import React, { useEffect, useState } from 'react';
import { authService } from '../../services/authService';
import ModalCancelacionCita from '../common/ModalCancelacionCita';
import '../../styles/components.css';
import styles from './PacientesRecepcionista.module.css';

const CitasRecepcionista = () => {
  const [citas, setCitas] = useState([]);
  const [estatusCitas, setEstatusCitas] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstatus, setFiltroEstatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [citaSeleccionada, setCitaSeleccionada] = useState(null);
  const [nuevoEstatus, setNuevoEstatus] = useState('');
  const [motivoCambio, setMotivoCambio] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [citaParaCancelar, setCitaParaCancelar] = useState(null);
  const [showModalCancelacion, setShowModalCancelacion] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      await Promise.all([
        obtenerCitas(),
        cargarEstatusCitas()
      ]);
    } catch (error) {
      console.error('❌ Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const obtenerCitas = async () => {
    try {
      const response = await authService.obtenerCitas();
      console.log('✅ Respuesta del backend:', response);

      const lista = response.success && Array.isArray(response.data)
        ? response.data
        : response.data?.data || [];

      // 🔍 DEBUG: Ver estructura de las citas
      console.log('🔍 DEBUG - Lista de citas:', lista);
      console.log('🔍 DEBUG - Tipo de lista:', typeof lista, 'Es array:', Array.isArray(lista));
      console.log('🔍 DEBUG - Cantidad de citas:', lista.length);
      console.log('🔍 DEBUG - Primera cita:', lista[0]);
      
      if (lista[0]) {
        console.log('🔍 DEBUG - Campos de estatus disponibles:', 
          Object.keys(lista[0]).filter(key => key.toLowerCase().includes('estatus'))
        );
        console.log('🔍 DEBUG - Todos los campos de la primera cita:', Object.keys(lista[0]));
      }

      setCitas(lista);
    } catch (error) {
      console.error('❌ Error al obtener citas:', error);
      setCitas([]);
    }
  };

  const cargarEstatusCitas = async () => {
    try {
      console.log('🔍 DEBUG - Intentando cargar estatus de citas...');
      const response = await authService.obtenerEstatusCita();
      console.log('🔍 DEBUG - Respuesta estatus:', response);
      
      if (response.success) {
        console.log('🔍 DEBUG - Estatus cargados:', response.data);
        setEstatusCitas(response.data || []);
      } else {
        console.warn('⚠️ No se pudieron cargar los estatus:', response);
        setEstatusCitas([]);
      }
    } catch (error) {
      console.error('❌ Error cargando estatus:', error);
      // Si hay error, establecer estatus por defecto
      const estatusDefault = [
        { id_citaEstatus: 1, estatusCita: 'Agendada', color_badge: 'primary' },
        { id_citaEstatus: 2, estatusCita: 'Pagada', color_badge: 'success' },
        { id_citaEstatus: 3, estatusCita: 'Cancelada Falta Pago', color_badge: 'warning' },
        { id_citaEstatus: 4, estatusCita: 'Cancelada Paciente', color_badge: 'danger' },
        { id_citaEstatus: 5, estatusCita: 'Cancelada Doctor', color_badge: 'secondary' },
        { id_citaEstatus: 6, estatusCita: 'Atendida', color_badge: 'info' },
        { id_citaEstatus: 7, estatusCita: 'No Acudió', color_badge: 'dark' }
      ];
      console.log('🔧 Usando estatus por defecto:', estatusDefault);
      setEstatusCitas(estatusDefault);
    }
  };

  const procesarCitasPasadas = async () => {
    if (!window.confirm('¿Deseas marcar todas las citas pasadas como "No Acudió"?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await authService.procesarCitasPasadas();
      if (response.success) {
        alert(`✅ ${response.data.citas_procesadas} citas procesadas correctamente`);
        await obtenerCitas();
      }
    } catch (error) {
      console.error('❌ Error procesando citas:', error);
      alert('❌ Error al procesar citas pasadas');
    } finally {
      setLoading(false);
    }
  };

  const abrirModalCancelacion = (cita) => {
    setCitaParaCancelar(cita);
    setShowModalCancelacion(true);
  };

  const cerrarModalCancelacion = () => {
    setCitaParaCancelar(null);
    setShowModalCancelacion(false);
  };

  const onCancelacionExitosa = async () => {
    await obtenerCitas();
    cerrarModalCancelacion();
  };

  const cancelarCita = async (folio) => {
    // Esta función ya no se usa directamente, ahora usamos el modal
    const cita = citas.find(c => c.folio_cita === folio);
    if (cita) {
      abrirModalCancelacion(cita);
    }
  };

  const abrirModalCambioEstatus = (cita) => {
    setCitaSeleccionada(cita);
    setNuevoEstatus('');
    setMotivoCambio('');
    setShowModal(true);
  };

  const actualizarEstatus = async () => {
    if (!nuevoEstatus) {
      alert('Selecciona un nuevo estatus');
      return;
    }

    // Validar el cambio usando las funciones helper del authService
    const estatusActualId = citaSeleccionada.fk_id_citaEstatus || citaSeleccionada.id_citaEstatus;
    const validacion = authService.puedeActualizarEstatus(
      estatusActualId,
      parseInt(nuevoEstatus),
      citaSeleccionada.cita_fechahora
    );

    if (!validacion.valido) {
      alert(`❌ ${validacion.mensaje}`);
      return;
    }

    try {
      setLoading(true);
      const response = await authService.actualizarEstatusCita(citaSeleccionada.folio_cita, {
        nuevo_estatus: parseInt(nuevoEstatus),
        motivo_cambio: motivoCambio,
        usuario_responsable: 'Recepcionista'
      });

      if (response.success) {
        alert('✅ Estatus actualizado correctamente');
        setShowModal(false);
        await obtenerCitas();
      }
    } catch (error) {
      console.error('❌ Error actualizando estatus:', error);
      const mensaje = error.response?.data?.message || 'Error al actualizar estatus';
      alert(`❌ ${mensaje}`);
    } finally {
      setLoading(false);
    }
  };

  const obtenerBadgeEstatus = (cita) => {
    // 🔍 Validar que la cita existe
    if (!cita || typeof cita !== 'object') {
      console.warn('⚠️ Cita undefined o inválida:', cita);
      return { nombre: 'Error', color: 'danger' };
    }

    // 🔍 DEBUG: Ver qué campo de estatus tiene la cita
    console.log('🔍 DEBUG - Cita completa:', cita);
    console.log('🔍 DEBUG - Campos de estatus:', {
      fk_id_citaEstatus: cita.fk_id_citaEstatus,
      id_citaEstatus: cita.id_citaEstatus,
      estatus: cita.estatus,
      estatusCita: cita.estatusCita,
      estatus_descripcion: cita.estatus_descripcion
    });

    // Intentar encontrar el ID del estatus de diferentes formas
    let estatusId = cita.fk_id_citaEstatus || cita.id_citaEstatus;
    
    // Si no encontramos ID numérico, buscar por nombre
    if (!estatusId && (cita.estatus || cita.estatusCita)) {
      const nombreEstatus = cita.estatus || cita.estatusCita;
      const estatusEncontrado = estatusCitas.find(e => 
        e.estatusCita?.toLowerCase() === nombreEstatus?.toLowerCase()
      );
      estatusId = estatusEncontrado?.id_citaEstatus;
    }

    console.log('🔍 DEBUG - Estatus ID encontrado:', estatusId);

    const estatus = estatusCitas.find(e => e.id_citaEstatus === estatusId);
    
    const resultado = estatus ? {
      nombre: estatus.estatusCita,
      color: estatus.color_badge
    } : { 
      nombre: cita.estatus || cita.estatusCita || 'Desconocido', 
      color: 'secondary' 
    };

    console.log('🔍 DEBUG - Badge resultado:', resultado);
    return resultado;
  };

  const getEstatusOptions = (citaActual) => {
    if (!citaActual) return estatusCitas;

    // Obtener el estatus actual de manera flexible
    const estatusActualId = citaActual.fk_id_citaEstatus || citaActual.id_citaEstatus;

    return estatusCitas.filter(estatus => {
      const validacion = authService.puedeActualizarEstatus(
        estatusActualId,
        estatus.id_citaEstatus,
        citaActual.cita_fechahora
      );
      return validacion.valido || estatus.id_citaEstatus === estatusActualId;
    });
  };

  const citasFiltradas = citas.filter((cita) => {
    // Validar que la cita existe
    if (!cita || typeof cita !== 'object') {
      console.warn('⚠️ Cita inválida en filtro:', cita);
      return false;
    }

    const texto = `${cita.nombre_paciente || ''} ${cita.folio_cita || ''}`.toLowerCase();
    const cumpleBusqueda = texto.includes(busqueda.toLowerCase());
    
    // Obtener el ID del estatus de manera flexible
    const estatusId = cita.fk_id_citaEstatus || cita.id_citaEstatus;
    const cumpleEstatus = !filtroEstatus || estatusId === parseInt(filtroEstatus);
    
    return cumpleBusqueda && cumpleEstatus;
  });

  return (
    <div className="card">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="text-center mb-0">📅 Citas Agendadas</h2>
        <div className="btn-group">
          <button 
            className="btn btn-outline-warning btn-sm"
            onClick={procesarCitasPasadas}
            disabled={loading}
            title="Marcar citas pasadas como 'No Acudió'"
          >
            ⏰ Procesar Pasadas
          </button>
          <button 
            className="btn btn-outline-primary btn-sm"
            onClick={cargarDatos}
            disabled={loading}
          >
            🔄 Actualizar
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="row mb-3">
        <div className="col-md-6">
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Buscar por paciente o folio..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{ marginBottom: '0', width: '100%' }}
          />
        </div>
        <div className="col-md-4">
          <select
            className="form-control"
            value={filtroEstatus}
            onChange={(e) => setFiltroEstatus(e.target.value)}
          >
            <option value="">Todos los estatus</option>
            {estatusCitas.map(estatus => (
              <option key={estatus.id_citaEstatus} value={estatus.id_citaEstatus}>
                {estatus.estatusCita}
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-2">
          <button 
            className="btn btn-outline-secondary w-100"
            onClick={() => {
              setBusqueda('');
              setFiltroEstatus('');
            }}
          >
            🗑️ Limpiar
          </button>
        </div>
      </div>

      {loading && (
        <div className="text-center py-3">
          <div className="spinner-border spinner-border-sm" role="status"></div>
          <span className="ms-2">Cargando...</span>
        </div>
      )}

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Folio</th>
              <th>Paciente</th>
              <th>Especialidad</th>
              <th>Doctor</th>
              <th>Fecha y Hora</th>
              <th>Estatus</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {citasFiltradas.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center">
                  {loading ? 'Cargando citas...' : 'No hay citas coincidentes.'}
                </td>
              </tr>
            ) : (
              citasFiltradas.map((cita) => {
                const badgeEstatus = obtenerBadgeEstatus(cita.fk_id_citaEstatus);
                return (
                  <tr key={cita.folio_cita}>
                    <td><strong>#{cita.folio_cita || '—'}</strong></td>
                    <td>{cita.nombre_paciente || '—'}</td>
                    <td>{cita.nombre_especialidad || '—'}</td>
                    <td>{cita.nombre_doctor || cita.nombre_empleado || cita.nombre_medico || '—'}</td>
                    <td>
                      <small>
                        {cita.cita_fechahora
                          ? new Date(cita.cita_fechahora).toLocaleString('es-MX', {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })
                          : '—'}
                      </small>
                    </td>
                    <td>
                      <span className={`badge badge-${obtenerBadgeEstatus(cita).color}`}>
                        {obtenerBadgeEstatus(cita).nombre}
                      </span>
                    </td>
                    <td>
                      <div className="btn-group btn-group-sm">
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => abrirModalCambioEstatus(cita)}
                          title="Cambiar estatus"
                          disabled={loading}
                        >
                          ✏️ Editar
                        </button>
                        {(cita.fk_id_citaEstatus === 1 || cita.fk_id_citaEstatus === 2) && (
                          <button
                            className="btn-cancelar"
                            onClick={() => cancelarCita(cita.folio_cita)}
                            disabled={loading}
                          >
                            ❌ Cancelar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal para cambiar estatus */}
      {showModal && citaSeleccionada && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  ✏️ Cambiar Estatus - Cita #{citaSeleccionada.folio_cita}
                </h5>
                <button 
                  type="button" 
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                  aria-label="Cerrar"
                >
                  ✕
                </button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <strong>📋 Información de la cita:</strong><br />
                  <strong>Paciente:</strong> {citaSeleccionada.nombre_paciente}<br />
                  <strong>Médico:</strong> {citaSeleccionada.nombre_doctor || citaSeleccionada.nombre_medico}<br />
                  <strong>Fecha:</strong> {new Date(citaSeleccionada.cita_fechahora).toLocaleString('es-MX')}<br />
                  <strong>Estatus actual:</strong> 
                  <span className={`badge badge-${obtenerBadgeEstatus(citaSeleccionada).color} ms-2`}>
                    {obtenerBadgeEstatus(citaSeleccionada).nombre}
                  </span>
                </div>

                <div className="mb-3">
                  <label className="form-label"><strong>Nuevo Estatus:</strong></label>
                  <select
                    className="form-control"
                    value={nuevoEstatus}
                    onChange={(e) => setNuevoEstatus(e.target.value)}
                  >
                    <option value="">Seleccionar estatus...</option>
                    {getEstatusOptions(citaSeleccionada).map(estatus => (
                      <option 
                        key={estatus.id_citaEstatus} 
                        value={estatus.id_citaEstatus}
                        disabled={estatus.id_citaEstatus === (citaSeleccionada.fk_id_citaEstatus || citaSeleccionada.id_citaEstatus)}
                      >
                        {estatus.estatusCita}
                        {estatus.id_citaEstatus === (citaSeleccionada.fk_id_citaEstatus || citaSeleccionada.id_citaEstatus) ? ' (Actual)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label"><strong>Motivo del cambio (opcional):</strong></label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={motivoCambio}
                    onChange={(e) => setMotivoCambio(e.target.value)}
                    placeholder="Describe el motivo del cambio de estatus..."
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={actualizarEstatus}
                  disabled={loading || !nuevoEstatus}
                >
                  {loading ? 'Actualizando...' : '✅ Actualizar Estatus'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para cancelación con política */}
      {showModalCancelacion && citaParaCancelar && (
        <ModalCancelacionCita
          folioCita={citaParaCancelar.folio_cita}
          nombrePaciente={citaParaCancelar.nombre_paciente}
          fechaCita={citaParaCancelar.cita_fechahora}
          isOpen={showModalCancelacion}
          onClose={cerrarModalCancelacion}
          onSuccess={onCancelacionExitosa}
        />
      )}
    </div>
  );
};

export default CitasRecepcionista;