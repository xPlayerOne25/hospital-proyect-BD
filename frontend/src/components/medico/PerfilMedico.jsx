// src/components/medico/PerfilMedico.jsx
import React, { useState, useEffect } from 'react';
import { medicoService } from '../../services/medicoService';
import '../../styles/components.css'; // <-- CAMBIO: Usar tu archivo CSS existente

const PerfilMedico = ({ cedula }) => {
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(false);
  const [formData, setFormData] = useState({
    telefono: '',
    correo: ''
  });

  useEffect(() => {
    cargarPerfil();
  }, [cedula]);

  const cargarPerfil = async () => {
    try {
      setLoading(true);
      const response = await medicoService.obtenerPerfil(cedula);
      setPerfil(response.data);
      setFormData({
        telefono: response.data.empleado_tel || '',
        correo: response.data.empleado_correo || ''
      });
    } catch (error) {
      console.error('❌ Error al cargar perfil:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await medicoService.actualizarPerfil(cedula, formData);
      alert('✅ Perfil actualizado correctamente');
      setEditando(false);
      cargarPerfil();
    } catch (error) {
      console.error('❌ Error al actualizar perfil:', error);
      alert('❌ Error al actualizar el perfil');
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="card-body text-center">
          <div className="spinner-border" role="status">
            <span className="sr-only">Cargando...</span>
          </div>
          <p className="mt-3">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (!perfil) {
    return (
      <div className="card">
        <div className="card-body text-center">
          <h4 className="text-danger">⚠️ Error</h4>
          <p>No se pudo cargar la información del perfil.</p>
          <button onClick={cargarPerfil} className="btn btn-primary">
            🔄 Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h2 className="mb-0">👨‍⚕️ Mi Perfil Médico</h2>
        {!editando && (
          <button 
            onClick={() => setEditando(true)} 
            className="btn btn-outline-primary btn-sm"
          >
            ✏️ Editar
          </button>
        )}
      </div>

      <div className="card-body">
        {editando ? (
          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-md-6">
                <div className="form-group">
                  <label className="form-label">Teléfono:</label>
                  <input
                    type="tel"
                    value={formData.telefono}
                    onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                    className="form-control"
                    placeholder="Número de teléfono"
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-group">
                  <label className="form-label">Correo electrónico:</label>
                  <input
                    type="email"
                    value={formData.correo}
                    onChange={(e) => setFormData({...formData, correo: e.target.value})}
                    className="form-control"
                    placeholder="correo@ejemplo.com"
                  />
                </div>
              </div>
            </div>
            
            <div className="d-flex gap-2 mt-4">
              <button type="submit" className="btn btn-success">
                ✅ Guardar Cambios
              </button>
              <button 
                type="button" 
                onClick={() => {
                  setEditando(false);
                  setFormData({
                    telefono: perfil.empleado_tel || '',
                    correo: perfil.empleado_correo || ''
                  });
                }} 
                className="btn btn-secondary"
              >
                ❌ Cancelar
              </button>
            </div>
          </form>
        ) : (
          <div>
            {/* Información personal */}
            <div className="row mb-4">
              <div className="col-md-6">
                <h5 className="text-primary mb-3">👤 Información Personal</h5>
                <div className="list-group list-group-flush">
                  <div className="list-group-item d-flex justify-content-between">
                    <strong>Nombre:</strong>
                    <span>{perfil.empleado_nombre} {perfil.empleado_paterno} {perfil.empleado_materno}</span>
                  </div>
                  <div className="list-group-item d-flex justify-content-between">
                    <strong>CURP:</strong>
                    <span className="font-monospace">{perfil.empleado_CURP}</span>
                  </div>
                  <div className="list-group-item d-flex justify-content-between">
                    <strong>Teléfono:</strong>
                    <span>{perfil.empleado_tel || 'No registrado'}</span>
                  </div>
                  <div className="list-group-item d-flex justify-content-between">
                    <strong>Correo:</strong>
                    <span>{perfil.empleado_correo || 'No registrado'}</span>
                  </div>
                </div>
              </div>

              <div className="col-md-6">
                <h5 className="text-success mb-3">🏥 Información Profesional</h5>
                <div className="list-group list-group-flush">
                  <div className="list-group-item d-flex justify-content-between">
                    <strong>Cédula:</strong>
                    <span className="font-monospace">{perfil.cedula}</span>
                  </div>
                  <div className="list-group-item d-flex justify-content-between">
                    <strong>Especialidad:</strong>
                    <span>{perfil.nombre_especialidad}</span>
                  </div>
                  <div className="list-group-item d-flex justify-content-between">
                    <strong>Consultorio:</strong>
                    <span>{perfil.consultorio_numero || 'Sin asignar'}</span>
                  </div>
                  <div className="list-group-item d-flex justify-content-between">
                    <strong>Estado:</strong>
                    <span className="badge badge-success">{perfil.estatus}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Información adicional */}
            <div className="row">
              <div className="col-md-6">
                <div className="card border-info">
                  <div className="card-header bg-info text-white">
                    <h6 className="mb-0">🕐 Horario de Trabajo</h6>
                  </div>
                  <div className="card-body">
                    <div className="d-flex justify-content-between">
                      <span><strong>Inicio:</strong></span>
                      <span>{perfil.horario_inicio}</span>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span><strong>Fin:</strong></span>
                      <span>{perfil.horario_fin}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-md-6">
                <div className="card border-warning">
                  <div className="card-header bg-warning text-dark">
                    <h6 className="mb-0">📋 Especialidad</h6>
                  </div>
                  <div className="card-body">
                    <h6 className="card-title">{perfil.nombre_especialidad}</h6>
                    <p className="card-text text-muted">
                      {perfil.especialidad_descripcion || 'Sin descripción disponible'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Nota informativa */}
            <div className="alert alert-info mt-4" role="alert">
              <h6 className="alert-heading">ℹ️ Información importante</h6>
              <p className="mb-0">
                Solo puedes editar tu teléfono y correo electrónico. 
                Para cambios en otros datos (nombre, cédula, especialidad), 
                contacta al área de Recursos Humanos.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PerfilMedico;