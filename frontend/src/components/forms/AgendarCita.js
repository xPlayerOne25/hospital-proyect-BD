import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { citasService } from '../../services/citasService';

const AgendarCita = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [step, setStep] = useState(1);

  // Data states
  const [especialidades, setEspecialidades] = useState([]);
  const [medicos, setMedicos] = useState([]);
  
  // Form states
  const [formData, setFormData] = useState({
    especialidad_id: '',
    medico_cedula: '',
    fecha: '',
    hora: '',
  });

  const [citaGenerada, setCitaGenerada] = useState(null);

  useEffect(() => {
    loadEspecialidades();
  }, []);

// En la función loadEspecialidades
const loadEspecialidades = async () => {
  try {
    console.log('🔄 Cargando especialidades...');
    
    // Llamada directa sin axios para evitar problemas del interceptor
    const response = await fetch('http://localhost:5001/api/citas/especialidades');
    const data = await response.json();
    
    console.log('📊 Respuesta directa:', data);
    
    if (data.success && data.data) {
      console.log('✅ Especialidades cargadas:', data.data);
      setEspecialidades(data.data);
      setError(''); // Limpiar error
    } else {
      console.log('❌ Error en respuesta:', data);
      setError('Error: La API no devolvió datos válidos');
    }
  } catch (error) {
    console.error('❌ Error en loadEspecialidades:', error);
    setError('Error de conexión: ' + error.message);
  }
};

const loadMedicos = async (especialidadId) => {
  try {
    setLoading(true);
    console.log('🔄 Cargando médicos para especialidad:', especialidadId);
    
    // Llamada directa con fetch
    const response = await fetch(`http://localhost:5001/api/citas/medicos/${especialidadId}`);
    const data = await response.json();
    
    console.log('👨‍⚕️ Respuesta médicos:', data);
    
    if (data.success && data.data) {
      console.log('✅ Médicos cargados:', data.data);
      setMedicos(data.data);
      setError(''); // Limpiar error
    } else {
      console.log('❌ Error en respuesta médicos:', data);
      setError('Error: No se pudieron cargar los médicos');
    }
  } catch (error) {
    console.error('❌ Error en loadMedicos:', error);
    setError('Error de conexión al cargar médicos: ' + error.message);
  } finally {
    setLoading(false);
  }
};

  const handleEspecialidadChange = (e) => {
    const especialidadId = e.target.value;
    setFormData({
      ...formData,
      especialidad_id: especialidadId,
      medico_cedula: '',
      fecha: '',
      hora: ''
    });
    
    if (especialidadId) {
      loadMedicos(especialidadId);
      setStep(2);
    } else {
      setMedicos([]);
      setStep(1);
    }
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError('');
  setSuccess('');

  try {
    const citaData = {
      paciente_curp: user.CURP,
      medico_cedula: formData.medico_cedula,
      fecha: formData.fecha,
      hora: formData.hora,
      especialidad_id: parseInt(formData.especialidad_id)
    };

    console.log('📝 Enviando datos de cita:', citaData);

    // Llamada directa con fetch para generar cita
    const response = await fetch('http://localhost:5001/api/citas/generar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('hospital_token')}`
      },
      body: JSON.stringify(citaData)
    });

    const data = await response.json();
    console.log('🎉 Respuesta generar cita:', data);
    
    if (data.success) {
      setCitaGenerada(data.data);
      setSuccess('¡Cita agendada exitosamente!');
      setStep(5);
    } else {
      setError(data.message || 'Error al agendar la cita');
    }
  } catch (error) {
    console.error('❌ Error al generar cita:', error);
    setError('Error de conexión al agendar cita');
  } finally {
    setLoading(false);
  }
};

  const resetForm = () => {
    setFormData({
      especialidad_id: '',
      medico_cedula: '',
      fecha: '',
      hora: ''
    });
    setMedicos([]);
    setCitaGenerada(null);
    setStep(1);
    setError('');
    setSuccess('');
  };

  const getMinDate = () => {
    const today = new Date();
    today.setDate(today.getDate() + 2); // Mínimo 48 horas
    return today.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const today = new Date();
    today.setMonth(today.getMonth() + 3); // Máximo 3 meses
    return today.toISOString().split('T')[0];
  };

  const getSelectedEspecialidad = () => {
    return especialidades.find(e => e.id_especialidad == formData.especialidad_id);
  };

  const getSelectedMedico = () => {
    return medicos.find(m => m.cedula === formData.medico_cedula);
  };

  // Pantalla de éxito
  if (step === 5 && citaGenerada) {
    return (
      <div>
        <div className="card">
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h2>✅ ¡Cita Agendada Exitosamente!</h2>
            <div style={{ fontSize: '3rem', margin: '1rem 0' }}>📅</div>
            <p>Tu cita ha sido agendada correctamente</p>
          </div>

          {/* Comprobante de Cita */}
          <div style={{ background: '#f9fafb', padding: '1.5rem', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
            <h3 style={{ textAlign: 'center', marginBottom: '1rem' }}>📄 Comprobante de Cita</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <p><strong>Folio:</strong> #{citaGenerada.folio}</p>
                <p><strong>Paciente:</strong> {citaGenerada.nombre_paciente}</p>
                <p><strong>Especialidad:</strong> {citaGenerada.especialidad}</p>
                <p><strong>Médico:</strong> {citaGenerada.medico}</p>
              </div>
              <div>
                <p><strong>Fecha:</strong> {new Date(citaGenerada.fecha_hora).toLocaleDateString()}</p>
                <p><strong>Hora:</strong> {new Date(citaGenerada.fecha_hora).toLocaleTimeString()}</p>
                <p><strong>Consultorio:</strong> {citaGenerada.consultorio}</p>
                <p><strong>Costo:</strong> ${citaGenerada.costo}</p>
              </div>
            </div>
          </div>

          {/* Información Importante */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div className="alert alert-warning">
              <strong>⏰ Tiempo de Pago:</strong> Tienes 8 horas para confirmar tu pago
            </div>
            <div className="alert alert-info">
              <strong>📋 Política de Cancelación:</strong> Cancelación gratuita hasta 48hrs antes
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button onClick={resetForm} className="btn btn-primary">
              Agendar Otra Cita
            </button>
            <button onClick={() => window.print()} className="btn btn-outline">
              🖨️ Imprimir Comprobante
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="card">
        <h2>📝 Agendar Nueva Cita</h2>
        <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
          Sigue los pasos para agendar tu cita médica
        </p>

        {/* Progress Indicator */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            {[1, 2, 3, 4].map((num) => (
              <div
                key={num}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  backgroundColor: step >= num ? '#2563eb' : '#e5e7eb',
                  color: step >= num ? 'white' : '#6b7280'
                }}
              >
                {num}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#6b7280' }}>
            <span>Especialidad</span>
            <span>Médico</span>
            <span>Fecha</span>
            <span>Confirmar</span>
          </div>
        </div>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Paso 1: Especialidad */}
          <div className="form-group">
            <label className="form-label">
              1. Selecciona la Especialidad
            </label>
            <select
              value={formData.especialidad_id}
              onChange={handleEspecialidadChange}
              className="form-input"
              required
            >
              <option value="">-- Selecciona una especialidad --</option>
              {especialidades.map((esp) => (
                <option key={esp.id_especialidad} value={esp.id_especialidad}>
                  {esp.nombre_especialidad} - ${esp.costo_especialidad}
                </option>
              ))}
            </select>
          </div>

          {/* Paso 2: Médico */}
          {step >= 2 && (
            <div className="form-group">
              <label className="form-label">
                2. Selecciona el Médico
              </label>
              <select
                value={formData.medico_cedula}
                onChange={(e) => {
                  setFormData({ ...formData, medico_cedula: e.target.value });
                  if (e.target.value) setStep(3);
                }}
                className="form-input"
                required
                disabled={loading}
              >
                <option value="">-- Selecciona un médico --</option>
                {medicos.map((medico) => (
                  <option key={medico.cedula} value={medico.cedula}>
                    {medico.nombre_completo} - Consultorio {medico.consultorio_numero}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Paso 3: Fecha */}
          {step >= 3 && (
            <div className="form-group">
              <label className="form-label">
                3. Selecciona la Fecha
              </label>
              <input
                type="date"
                value={formData.fecha}
                onChange={(e) => {
                  setFormData({ ...formData, fecha: e.target.value });
                  if (e.target.value) setStep(4);
                }}
                min={getMinDate()}
                max={getMaxDate()}
                className="form-input"
                required
              />
              <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                Mínimo 48 horas de anticipación, máximo 3 meses
              </span>
            </div>
          )}

          {/* Paso 4: Hora */}
          {step >= 4 && (
            <div className="form-group">
              <label className="form-label">
                4. Selecciona la Hora
              </label>
              <select
                value={formData.hora}
                onChange={(e) => setFormData({ ...formData, hora: e.target.value })}
                className="form-input"
                required
              >
                <option value="">-- Selecciona una hora --</option>
                <option value="08:00">08:00 AM</option>
                <option value="09:00">09:00 AM</option>
                <option value="10:00">10:00 AM</option>
                <option value="11:00">11:00 AM</option>
                <option value="12:00">12:00 PM</option>
                <option value="14:00">02:00 PM</option>
                <option value="15:00">03:00 PM</option>
                <option value="16:00">04:00 PM</option>
                <option value="17:00">05:00 PM</option>
              </select>
            </div>
          )}

          {/* Resumen */}
          {step >= 4 && formData.hora && (
            <div style={{ background: '#f9fafb', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
              <h4 style={{ marginBottom: '0.5rem' }}>📋 Resumen de tu Cita:</h4>
              <div style={{ fontSize: '0.875rem' }}>
                <p><strong>Especialidad:</strong> {getSelectedEspecialidad()?.nombre_especialidad}</p>
                <p><strong>Médico:</strong> {getSelectedMedico()?.nombre_completo}</p>
                <p><strong>Fecha:</strong> {new Date(formData.fecha).toLocaleDateString()}</p>
                <p><strong>Hora:</strong> {formData.hora}</p>
                <p><strong>Costo:</strong> ${getSelectedEspecialidad()?.costo_especialidad}</p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          {step >= 4 && formData.hora && (
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: '100%' }}
              disabled={loading}
            >
              {loading ? 'Agendando...' : '✅ Confirmar Cita'}
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

export default AgendarCita;