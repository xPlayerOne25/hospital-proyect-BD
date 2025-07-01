import React, { useEffect, useState } from 'react';
import { authService } from '../../services/authService';
import '../../styles/components.css';

const DoctoresRecepcionista = () => {
  const [doctores, setDoctores] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);
  const [consultorios, setConsultorios] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [doctorEditando, setDoctorEditando] = useState(null);
  const [guardando, setGuardando] = useState(false);

  // Estado del formulario
  const [formData, setFormData] = useState({
    cedula: '',
    empleado_nombre: '',
    empleado_paterno: '',
    empleado_materno: '',
    empleado_tel: '',
    empleado_correo: '',
    empleado_curp: '',
    especialidad_id: '',
    consultorio_id: '',
    horario_inicio: '08:00',
    horario_fin: '17:00',
    horario_turno: 'Matutino', // 🚨 NUEVO CAMPO
    sueldo: '15000',
    crear_usuario: true // Nueva opción para crear usuario
  });

  const [errores, setErrores] = useState({});

  // Cargar datos iniciales
  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      console.log('🔄 Cargando datos iniciales...');
      
      const [doctoresRes, especialidadesRes, consultoriosRes] = await Promise.all([
        authService.obtenerDoctores(),
        authService.obtenerEspecialidades(),
        authService.obtenerConsultorios()
      ]);

      // Verificar la estructura de las respuestas
      console.log('📋 Respuestas recibidas:', {
        doctores: doctoresRes,
        especialidades: especialidadesRes,
        consultorios: consultoriosRes
      });

      setDoctores(doctoresRes?.data || []);
      setEspecialidades(especialidadesRes?.data || []);
      setConsultorios(consultoriosRes?.data || []);
      
      console.log('✅ Datos cargados exitosamente:', {
        doctores: doctoresRes?.data?.length || 0,
        especialidades: especialidadesRes?.data?.length || 0,
        consultorios: consultoriosRes?.data?.length || 0
      });
    } catch (error) {
      console.error('❌ Error cargando datos:', error);
      alert('❌ Error al cargar los datos iniciales: ' + authService.handleError(error));
    } finally {
      setLoading(false);
    }
  };

  // Validaciones del formulario
  const validarFormulario = () => {
    const nuevosErrores = {};

    // Validaciones obligatorias
    if (!formData.cedula.trim()) {
      nuevosErrores.cedula = 'La cédula es obligatoria';
    } else if (formData.cedula.length < 8) {
      nuevosErrores.cedula = 'La cédula debe tener al menos 8 caracteres';
    }

    if (!formData.empleado_nombre.trim()) {
      nuevosErrores.empleado_nombre = 'El nombre es obligatorio';
    }

    if (!formData.empleado_paterno.trim()) {
      nuevosErrores.empleado_paterno = 'El apellido paterno es obligatorio';
    }

    if (!formData.empleado_correo.trim()) {
      nuevosErrores.empleado_correo = 'El correo es obligatorio';
    } else if (!/\S+@\S+\.\S+/.test(formData.empleado_correo)) {
      nuevosErrores.empleado_correo = 'El correo no tiene un formato válido';
    }

    if (!formData.especialidad_id) {
      nuevosErrores.especialidad_id = 'Debe seleccionar una especialidad';
    }

    if (!formData.empleado_tel.trim()) {
      nuevosErrores.empleado_tel = 'El teléfono es obligatorio';
    } else if (!/^\d{10}$/.test(formData.empleado_tel.replace(/\D/g, ''))) {
      nuevosErrores.empleado_tel = 'El teléfono debe tener 10 dígitos';
    }

    if (formData.empleado_curp.trim() && formData.empleado_curp.length !== 18) {
      nuevosErrores.empleado_curp = 'El CURP debe tener exactamente 18 caracteres';
    }

    if (formData.horario_inicio && formData.horario_fin) {
      if (formData.horario_inicio >= formData.horario_fin) {
        nuevosErrores.horario_fin = 'La hora de fin debe ser posterior a la de inicio';
      }
    }

    if (formData.sueldo && parseFloat(formData.sueldo) < 0) {
      nuevosErrores.sueldo = 'El sueldo no puede ser negativo';
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  // Manejar cambios en el formulario
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errores[name]) {
      setErrores(prev => ({ ...prev, [name]: '' }));
    }

    // Manejar checkbox para crear_usuario
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
      return;
    }

    // Formateo especial para algunos campos
    let valorFormateado = value;
    
    if (name === 'empleado_tel') {
      // Solo permitir números y formatear teléfono
      valorFormateado = value.replace(/\D/g, '').slice(0, 10);
    } else if (name === 'empleado_curp') {
      // CURP en mayúsculas
      valorFormateado = value.toUpperCase().slice(0, 18);
    } else if (name === 'cedula') {
      // Cédula en mayúsculas
      valorFormateado = value.toUpperCase();
    } else if (name === 'sueldo') {
      // Solo números y decimales para el sueldo
      valorFormateado = value.replace(/[^\d.]/g, '');
    }

    setFormData(prev => ({
      ...prev,
      [name]: valorFormateado
    }));
  };

  // Abrir modal para nuevo doctor
  const abrirModalNuevo = () => {
    setFormData({
      cedula: '',
      empleado_nombre: '',
      empleado_paterno: '',
      empleado_materno: '',
      empleado_tel: '',
      empleado_correo: '',
      empleado_curp: '',
      especialidad_id: '',
      consultorio_id: '',
      horario_inicio: '08:00',
      horario_fin: '17:00',
      horario_turno: 'Matutino', // 🚨 AGREGAR AQUÍ TAMBIÉN
      sueldo: '15000',
      crear_usuario: true
    });
    setErrores({});
    setDoctorEditando(null);
    setMostrarModal(true);
  };

  // Cerrar modal
  const cerrarModal = () => {
    setMostrarModal(false);
    setDoctorEditando(null);
    setFormData({});
    setErrores({});
  };

  // Guardar doctor
  const guardarDoctor = async (e) => {
    e.preventDefault();
    
    if (!validarFormulario()) {
      console.log('❌ Formulario con errores:', errores);
      return;
    }

    try {
      setGuardando(true);
      
      // Formatear datos usando la función del servicio
      const datosDoctor = authService.formatearDatosDoctor(formData);
      
      console.log('📤 Enviando datos del doctor:', datosDoctor);

      if (doctorEditando) {
        // Actualizar doctor existente (si implementas esta funcionalidad)
        alert('Funcionalidad de edición en desarrollo');
      } else {
        // Crear nuevo doctor
        const response = await authService.crearDoctor(datosDoctor);
        
        console.log('✅ Respuesta del servidor:', response);
        
        if (response.success) {
          // Mostrar información de creación si está disponible
          if (response.data && response.data.username && response.data.password_temporal) {
            alert(`✅ Doctor registrado correctamente\n\n` +
                  `👨‍⚕️ Doctor: ${response.data.nombre_completo || formData.empleado_nombre + ' ' + formData.empleado_paterno}\n` +
                  `🔐 Usuario: ${response.data.username}\n` +
                  `🔑 Contraseña temporal: ${response.data.password_temporal}\n\n` +
                  `⚠️ IMPORTANTE: El doctor debe cambiar la contraseña en el primer login`);
          } else {
            alert('✅ Doctor registrado correctamente');
          }
          
          // Recargar lista de doctores
          await cargarDatos();
          cerrarModal();
        } else {
          throw new Error(response.message || 'Error al crear doctor');
        }
      }
    } catch (error) {
      console.error('❌ Error al guardar doctor:', error);
      const errorMessage = authService.handleError(error);
      alert('❌ Error al guardar el doctor: ' + errorMessage);
    } finally {
      setGuardando(false);
    }
  };

  // Crear usuario para doctor existente
  const crearUsuarioParaDoctor = async (cedula, nombreDoctor) => {
    if (!window.confirm(`¿Crear usuario de acceso para ${nombreDoctor}?`)) {
      return;
    }

    try {
      const response = await authService.crearUsuarioDoctor(cedula);
      
      if (response.success && response.data) {
        alert(`✅ Usuario creado correctamente\n\n` +
              `👨‍⚕️ Doctor: ${response.data.nombre_doctor}\n` +
              `🔐 Usuario: ${response.data.username}\n` +
              `🔑 Contraseña temporal: ${response.data.password_temporal}\n\n` +
              `⚠️ IMPORTANTE: El doctor debe cambiar la contraseña en el primer login`);
        
        await cargarDatos(); // Recargar lista
      } else {
        alert('✅ Usuario creado correctamente');
        await cargarDatos();
      }
    } catch (error) {
      console.error('❌ Error al crear usuario:', error);
      alert('❌ Error al crear usuario: ' + authService.handleError(error));
    }
  };

  // Dar de baja doctor
  const darBajaDoctor = async (cedula, nombre) => {
    if (!window.confirm(`¿Estás seguro de dar de baja al Dr. ${nombre}?\n\nEsta acción no se puede deshacer.`)) {
      return;
    }

    try {
      await authService.darBajaDoctor(cedula);
      alert('✅ Doctor dado de baja correctamente');
      await cargarDatos(); // Recargar lista
    } catch (error) {
      console.error('❌ Error al dar de baja doctor:', error);
      alert('❌ Error al dar de baja al doctor: ' + authService.handleError(error));
    }
  };

  // Filtrar doctores
  const doctoresFiltrados = doctores.filter((doc) => {
    const nombreCompleto = `${doc.empleado_nombre} ${doc.empleado_paterno} ${doc.empleado_materno || ''}`.toLowerCase();
    const especialidad = doc.nombre_especialidad?.toLowerCase() || '';
    
    return (
      nombreCompleto.includes(busqueda.toLowerCase()) ||
      doc.cedula?.toLowerCase().includes(busqueda.toLowerCase()) ||
      especialidad.includes(busqueda.toLowerCase())
    );
  });

  if (loading) {
    return (
      <div className="card">
        <div className="card-body text-center">
          <div className="spinner-border" role="status">
            <span className="sr-only">Cargando...</span>
          </div>
          <p className="mt-3">Cargando información de doctores...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h2 className="mb-0">🩺 Gestión de Doctores</h2>
        <button 
          onClick={abrirModalNuevo}
          className="btn btn-primary"
        >
          ➕ Nuevo Doctor
        </button>
      </div>

      <div className="card-body">
        {/* Barra de búsqueda */}
        <div className="row mb-3">
          <div className="col-md-6">
            <input
              type="text"
              placeholder="🔍 Buscar por nombre, cédula o especialidad..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="form-control"
            />
          </div>
          <div className="col-md-6 text-end">
            <small className="text-muted">
              Total: {doctoresFiltrados.length} doctor{doctoresFiltrados.length !== 1 ? 'es' : ''}
            </small>
          </div>
        </div>

        {/* Tabla de doctores */}
        <div className="table-responsive">
          <table className="table table-hover">
            <thead className="table-dark">
              <tr>
                <th>👨‍⚕️ Doctor</th>
                <th>🆔 Cédula</th>
                <th>🏥 Especialidad</th>
                <th>🏢 Consultorio</th>
                <th>📞 Contacto</th>
                <th>🔐 Acceso</th>
                <th>⏰ Horario</th>
                <th>🔧 Acciones</th>
              </tr>
            </thead>
            <tbody>
              {doctoresFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-4">
                    {busqueda ? 
                      '🔍 No se encontraron doctores con esos criterios' : 
                      '👨‍⚕️ No hay doctores registrados'
                    }
                  </td>
                </tr>
              ) : (
                doctoresFiltrados.map((doc) => (
                  <tr key={doc.cedula}>
                    <td>
                      <div>
                        <strong>Dr. {doc.empleado_nombre} {doc.empleado_paterno}</strong>
                        {doc.empleado_materno && <div className="text-muted small">{doc.empleado_materno}</div>}
                      </div>
                    </td>
                    <td>
                      <code>{doc.cedula}</code>
                    </td>
                    <td>
                      <span className="badge bg-info">
                        {doc.nombre_especialidad || 'No asignada'}
                      </span>
                    </td>
                    <td>
                      <span className="badge bg-secondary">
                        {doc.consultorio_numero ? `Consultorio ${doc.consultorio_numero}` : 'Sin asignar'}
                      </span>
                    </td>
                    <td>
                      <div className="small">
                        📞 {doc.empleado_tel || 'No registrado'}
                        <br />
                        📧 {doc.empleado_correo || 'No registrado'}
                      </div>
                    </td>
                    <td>
                      <div className="small">
                        {doc.tiene_acceso_sistema === 'SÍ' ? (
                          <>
                            <span className="badge bg-success">✅ Activo</span>
                            <br />
                            <small>👤 {doc.username || 'N/A'}</small>
                          </>
                        ) : (
                          <button 
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => crearUsuarioParaDoctor(doc.cedula, `${doc.empleado_nombre} ${doc.empleado_paterno}`)}
                            title="Crear usuario de acceso"
                          >
                            🔐 Crear Usuario
                          </button>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="small">
                        {doc.horario_inicio && doc.horario_fin ? 
                          `${doc.horario_inicio} - ${doc.horario_fin}` : 
                          'No definido'
                        }
                      </div>
                    </td>
                    <td>
                      <div className="btn-group-vertical btn-group-sm">
                        <button 
                          className="btn btn-outline-info btn-sm"
                          title="Ver citas del doctor"
                        >
                          📅 Citas
                        </button>
                        <button 
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => darBajaDoctor(doc.cedula, `${doc.empleado_nombre} ${doc.empleado_paterno}`)}
                          title="Dar de baja al doctor"
                        >
                          🗑️ Baja
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal para crear/editar doctor */}
      {mostrarModal && (
        <div className="modal fade show d-block" tabIndex="-1" role="dialog">
          <div className="modal-dialog modal-lg" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {doctorEditando ? '✏️ Editar Doctor' : '➕ Nuevo Doctor'}
                </h5>
                <button type="button" className="btn-close" onClick={cerrarModal}></button>
              </div>

              <form onSubmit={guardarDoctor}>
                <div className="modal-body">
                  <div className="row">
                    {/* Información personal */}
                    <div className="col-12">
                      <h6 className="text-primary mb-3">👨‍⚕️ Información Personal</h6>
                    </div>
                    
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Cédula Profesional *</label>
                        <input
                          type="text"
                          name="cedula"
                          value={formData.cedula}
                          onChange={handleInputChange}
                          className={`form-control ${errores.cedula ? 'is-invalid' : ''}`}
                          placeholder="Ej: CED123456789"
                          disabled={doctorEditando} // No permitir editar cédula
                        />
                        {errores.cedula && <div className="invalid-feedback">{errores.cedula}</div>}
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">CURP</label>
                        <input
                          type="text"
                          name="empleado_curp"
                          value={formData.empleado_curp}
                          onChange={handleInputChange}
                          className={`form-control ${errores.empleado_curp ? 'is-invalid' : ''}`}
                          placeholder="18 caracteres"
                          maxLength="18"
                        />
                        {errores.empleado_curp && <div className="invalid-feedback">{errores.empleado_curp}</div>}
                      </div>
                    </div>

                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">Nombre *</label>
                        <input
                          type="text"
                          name="empleado_nombre"
                          value={formData.empleado_nombre}
                          onChange={handleInputChange}
                          className={`form-control ${errores.empleado_nombre ? 'is-invalid' : ''}`}
                          placeholder="Nombre"
                        />
                        {errores.empleado_nombre && <div className="invalid-feedback">{errores.empleado_nombre}</div>}
                      </div>
                    </div>

                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">Apellido Paterno *</label>
                        <input
                          type="text"
                          name="empleado_paterno"
                          value={formData.empleado_paterno}
                          onChange={handleInputChange}
                          className={`form-control ${errores.empleado_paterno ? 'is-invalid' : ''}`}
                          placeholder="Apellido paterno"
                        />
                        {errores.empleado_paterno && <div className="invalid-feedback">{errores.empleado_paterno}</div>}
                      </div>
                    </div>

                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">Apellido Materno</label>
                        <input
                          type="text"
                          name="empleado_materno"
                          value={formData.empleado_materno}
                          onChange={handleInputChange}
                          className="form-control"
                          placeholder="Apellido materno"
                        />
                      </div>
                    </div>

                    {/* Información de contacto */}
                    <div className="col-12">
                      <h6 className="text-primary mb-3 mt-3">📞 Información de Contacto</h6>
                    </div>

                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Teléfono *</label>
                        <input
                          type="tel"
                          name="empleado_tel"
                          value={formData.empleado_tel}
                          onChange={handleInputChange}
                          className={`form-control ${errores.empleado_tel ? 'is-invalid' : ''}`}
                          placeholder="10 dígitos"
                          maxLength="10"
                        />
                        {errores.empleado_tel && <div className="invalid-feedback">{errores.empleado_tel}</div>}
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Correo Electrónico *</label>
                        <input
                          type="email"
                          name="empleado_correo"
                          value={formData.empleado_correo}
                          onChange={handleInputChange}
                          className={`form-control ${errores.empleado_correo ? 'is-invalid' : ''}`}
                          placeholder="doctor@hospital.com"
                        />
                        {errores.empleado_correo && <div className="invalid-feedback">{errores.empleado_correo}</div>}
                      </div>
                    </div>

                    {/* Información profesional */}
                    <div className="col-12">
                      <h6 className="text-primary mb-3 mt-3">🏥 Información Profesional</h6>
                    </div>

                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Especialidad *</label>
                        <select
                          name="especialidad_id"
                          value={formData.especialidad_id}
                          onChange={handleInputChange}
                          className={`form-control ${errores.especialidad_id ? 'is-invalid' : ''}`}
                        >
                          <option value="">Seleccionar especialidad</option>
                          {especialidades.map((esp) => (
                            <option key={esp.id_especialidad} value={esp.id_especialidad}>
                              {esp.nombre_especialidad}
                            </option>
                          ))}
                        </select>
                        {errores.especialidad_id && <div className="invalid-feedback">{errores.especialidad_id}</div>}
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Consultorio</label>
                        <select
                          name="consultorio_id"
                          value={formData.consultorio_id}
                          onChange={handleInputChange}
                          className="form-control"
                        >
                          <option value="">Sin asignar</option>
                          {consultorios.map((cons) => (
                            <option key={cons.id_consultorio} value={cons.id_consultorio}>
                              Consultorio {cons.consultorio_numero}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">Horario Inicio</label>
                        <input
                          type="time"
                          name="horario_inicio"
                          value={formData.horario_inicio}
                          onChange={handleInputChange}
                          className="form-control"
                        />
                      </div>
                    </div>

                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">Horario Fin</label>
                        <input
                          type="time"
                          name="horario_fin"
                          value={formData.horario_fin}
                          onChange={handleInputChange}
                          className={`form-control ${errores.horario_fin ? 'is-invalid' : ''}`}
                        />
                        {errores.horario_fin && <div className="invalid-feedback">{errores.horario_fin}</div>}
                      </div>
                    </div>

                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">Turno</label>
                        <select
                          name="horario_turno"
                          value={formData.horario_turno}
                          onChange={handleInputChange}
                          className="form-control"
                        >
                          <option value="Matutino">🌅 Matutino</option>
                          <option value="Vespertino">🌇 Vespertino</option>
                        </select>
                        <small className="form-text text-muted">
                          Matutino: Mañana | Vespertino: Tarde
                        </small>
                      </div>
                    </div>

                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">Sueldo ($)</label>
                        <input
                          type="number"
                          name="sueldo"
                          value={formData.sueldo}
                          onChange={handleInputChange}
                          className={`form-control ${errores.sueldo ? 'is-invalid' : ''}`}
                          placeholder="15000.00"
                          step="0.01"
                          min="0"
                        />
                        {errores.sueldo && <div className="invalid-feedback">{errores.sueldo}</div>}
                      </div>
                    </div>

                    {/* Opciones de usuario */}
                    <div className="col-12">
                      <h6 className="text-primary mb-3 mt-3">🔐 Acceso al Sistema</h6>
                    </div>

                    <div className="col-12">
                      <div className="form-check">
                        <input
                          type="checkbox"
                          name="crear_usuario"
                          checked={formData.crear_usuario}
                          onChange={handleInputChange}
                          className="form-check-input"
                          id="crear_usuario"
                        />
                        <label className="form-check-label" htmlFor="crear_usuario">
                          🔐 Crear usuario de acceso al sistema
                        </label>
                        <small className="form-text text-muted d-block">
                          Si está marcado, se creará automáticamente un usuario y contraseña temporal para que el doctor pueda acceder al sistema.
                        </small>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" onClick={cerrarModal} className="btn btn-secondary">
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    disabled={guardando}
                    className="btn btn-primary"
                  >
                    {guardando ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Guardando...
                      </>
                    ) : (
                      doctorEditando ? '💾 Actualizar' : '💾 Registrar Doctor'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Backdrop del modal */}
      {mostrarModal && <div className="modal-backdrop fade show"></div>}
    </div>
  );
};

export default DoctoresRecepcionista;
