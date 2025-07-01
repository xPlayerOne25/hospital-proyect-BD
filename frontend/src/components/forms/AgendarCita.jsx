import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const AgendarCita = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingHorarios, setLoadingHorarios] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [step, setStep] = useState(1);

  // Data states
  const [especialidades, setEspecialidades] = useState([]);
  const [medicos, setMedicos] = useState([]);
  const [fechasDisponibles, setFechasDisponibles] = useState([]);
  const [horariosDisponibles, setHorariosDisponibles] = useState([]);
  
  // Form states
  const [formData, setFormData] = useState({
    especialidad_id: '',
    medico_cedula: '',
    fecha: '',
    hora: '',
  });

  const [citaGenerada, setCitaGenerada] = useState(null);
  const [doctorSeleccionado, setDoctorSeleccionado] = useState(null);

  // 🔧 FIX: Función MEJORADA para formatear hora sin problemas de zona horaria
  const formatearHoraSinZonaHoraria = (horaString) => {
    if (!horaString) return '';
    
    console.log('🔍 Hora recibida:', horaString); // Debug
    
    // Caso especial: Si viene como "2013:30 PM" o "2025:30 PM" (año en lugar de hora)
    if (horaString.includes('20') && (horaString.includes('13') || horaString.includes('24') || horaString.includes('25'))) {
      console.log('⚠️ Hora con año detectada, intentando extraer solo la hora');
      // Buscar patrón de hora después del año: "2013:30" -> extraer "13:30"
      const timeMatch = horaString.match(/20(\d{2}):(\d{2})/);
      if (timeMatch) {
        const horas = parseInt(timeMatch[1]); // Las últimas 2 cifras del "año"
        const minutos = parseInt(timeMatch[2]);
        
        if (horas <= 23) { // Validar que sea una hora válida
          const periodo = horas >= 12 ? 'PM' : 'AM';
          const horasDisplay = horas > 12 ? horas - 12 : (horas === 0 ? 12 : horas);
          return `${horasDisplay}:${minutos.toString().padStart(2, '0')} ${periodo}`;
        }
      }
    }
    
    // Si la hora viene como "16:30:00" o "16:30"
    if (horaString.includes(':')) {
      const parts = horaString.split(':');
      const horas = parseInt(parts[0]);
      const minutos = parseInt(parts[1]) || 0;
      
      // Validar que sean horas válidas (0-23)
      if (horas >= 0 && horas <= 23) {
        const periodo = horas >= 12 ? 'PM' : 'AM';
        const horasDisplay = horas > 12 ? horas - 12 : (horas === 0 ? 12 : horas);
        
        return `${horasDisplay}:${minutos.toString().padStart(2, '0')} ${periodo}`;
      }
    }
    
    // Si viene como timestamp completo "2025-07-19T16:30:00.000Z"
    if (horaString.includes('T')) {
      const timePart = horaString.split('T')[1];
      if (timePart) {
        const timeOnly = timePart.split('.')[0]; // Quitar los milisegundos
        return formatearHoraSinZonaHoraria(timeOnly);
      }
    }
    
    // Si viene como "4:30 PM" ya formateado
    if (horaString.includes('AM') || horaString.includes('PM')) {
      return horaString;
    }
    
    console.log('⚠️ Formato de hora no reconocido:', horaString);
    return horaString; // Devolver tal como viene si no se puede formatear
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

  // 🔧 NUEVA función para extraer hora desde diferentes formatos
  const extraerHora = (citaData) => {
    // Intentar diferentes campos donde puede venir la hora
    const posiblesHoras = [
      citaData.hora,
      citaData.fecha_hora,
      citaData.hora_formateada,
      citaData.time
    ];
    
    for (const hora of posiblesHoras) {
      if (hora) {
        console.log('🔍 Intentando extraer hora de:', hora);
        const horaFormateada = formatearHoraSinZonaHoraria(hora);
        if (horaFormateada && !horaFormateada.includes('2013') && !horaFormateada.includes('2024')) {
          return horaFormateada;
        }
      }
    }
    
    // Si no se pudo extraer, intentar con formData.hora
    if (formData.hora) {
      return formatearHoraSinZonaHoraria(formData.hora);
    }
    
    return 'Hora no disponible';
  };

  useEffect(() => {
    loadEspecialidades();
    loadFechasDisponibles();
  }, []);

  // Debug: Log del estado actual
  useEffect(() => {
    console.log('🔍 Estado actual:', {
      step,
      formData,
      horariosDisponibles: horariosDisponibles.length,
      loadingHorarios
    });
  }, [step, formData, horariosDisponibles, loadingHorarios]);

  // Cargar especialidades
  const loadEspecialidades = async () => {
    try {
      console.log('🔄 Cargando especialidades...');
      const response = await fetch('http://localhost:5001/api/citas/especialidades');
      const data = await response.json();
      
      if (data.success && data.data) {
        console.log('✅ Especialidades cargadas:', data.data.length);
        setEspecialidades(data.data);
        setError('');
      } else {
        setError('Error: No se pudieron cargar las especialidades');
      }
    } catch (error) {
      console.error('❌ Error en loadEspecialidades:', error);
      setError('Error de conexión: ' + error.message);
    }
  };

  // Cargar médicos con información de horarios
  const loadMedicos = async (especialidadId) => {
    try {
      setLoading(true);
      console.log('🔄 Cargando médicos para especialidad:', especialidadId);
      
      const response = await fetch(`http://localhost:5001/api/citas/medicos/${especialidadId}`);
      const data = await response.json();
      
      if (data.success && data.data) {
        console.log('✅ Médicos cargados con horarios:', data.data);
        setMedicos(data.data);
        setError('');
      } else {
        setError('Error: No se pudieron cargar los médicos');
      }
    } catch (error) {
      console.error('❌ Error en loadMedicos:', error);
      setError('Error de conexión al cargar médicos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Cargar fechas disponibles
  const loadFechasDisponibles = async () => {
    try {
      console.log('🔄 Cargando fechas disponibles...');
      const response = await fetch('http://localhost:5001/api/citas/fechas-disponibles');
      const data = await response.json();
      
      if (data.success && data.data) {
        console.log('✅ Fechas disponibles cargadas:', data.data.length);
        setFechasDisponibles(data.data);
      }
    } catch (error) {
      console.error('❌ Error al cargar fechas:', error);
    }
  };

  // Cargar horarios disponibles para un doctor en una fecha específica
  const loadHorariosDisponibles = async (cedula, fecha) => {
    try {
      setLoadingHorarios(true);
      console.log(`🔄 Cargando horarios disponibles - Doctor: ${cedula}, Fecha: ${fecha}`);
      
      const response = await fetch(`http://localhost:5001/api/citas/doctor/${cedula}/horarios/${fecha}`);
      const data = await response.json();
      
      if (data.success && data.data && data.data.horarios_disponibles) {
        console.log('✅ Horarios disponibles raw:', data.data.horarios_disponibles);
        
        // 🔧 FIX: Formatear horarios correctamente
        const horariosFormateados = data.data.horarios_disponibles.map(horario => {
          // Extraer solo la hora de la fecha completa
          let horaInicio = '';
          let horaFin = '';
          
          if (horario.hora) {
            // Si viene como "1970-01-01T09:00:00.000Z"
            if (horario.hora.includes('T')) {
              const time = horario.hora.split('T')[1].split('.')[0]; // "09:00:00"
              horaInicio = time.substring(0, 5); // "09:00"
            } else {
              // Si viene como "09:00:00"
              horaInicio = horario.hora.substring(0, 5); // "09:00"
            }
            
            // Calcular hora fin (30 minutos después)
            const [horas, minutos] = horaInicio.split(':').map(Number);
            const totalMinutos = horas * 60 + minutos + 30;
            const horaFinHoras = Math.floor(totalMinutos / 60);
            const horaFinMinutos = totalMinutos % 60;
            horaFin = `${horaFinHoras.toString().padStart(2, '0')}:${horaFinMinutos.toString().padStart(2, '0')}`;
          }
          
          return {
            ...horario,
            hora: horaInicio, // Solo "09:00"
            hora_display: `${horaInicio} - ${horaFin}` // "09:00 - 09:30"
          };
        });
        
        console.log('✅ Horarios formateados:', horariosFormateados);
        setHorariosDisponibles(horariosFormateados);
        setError('');
        
        // 🔧 FIX: Cambiar al paso 4 DESPUÉS de cargar los horarios
        setStep(4);
      } else {
        setError('No hay horarios disponibles para esta fecha');
        setHorariosDisponibles([]);
      }
    } catch (error) {
      console.error('❌ Error al cargar horarios:', error);
      setError('Error al cargar horarios disponibles');
      setHorariosDisponibles([]);
    } finally {
      setLoadingHorarios(false);
    }
  };

  // Manejar cambio de especialidad
  const handleEspecialidadChange = (e) => {
    const especialidadId = e.target.value;
    console.log('🔄 Cambio de especialidad:', especialidadId);
    
    setFormData({
      ...formData,
      especialidad_id: especialidadId,
      medico_cedula: '',
      fecha: '',
      hora: ''
    });
    
    setMedicos([]);
    setHorariosDisponibles([]);
    setDoctorSeleccionado(null);
    
    if (especialidadId) {
      loadMedicos(especialidadId);
      setStep(2);
    } else {
      setStep(1);
    }
  };

  // Manejar cambio de médico
  const handleMedicoChange = (e) => {
    const cedula = e.target.value;
    console.log('🔄 Cambio de médico:', cedula);
    
    const medico = medicos.find(m => m.cedula === cedula);
    
    setFormData({
      ...formData,
      medico_cedula: cedula,
      fecha: '',
      hora: ''
    });
    
    setDoctorSeleccionado(medico);
    setHorariosDisponibles([]);
    
    if (cedula) {
      setStep(3);
    } else {
      setStep(2);
    }
  };

  // 🔧 FIX: Manejar cambio de fecha SIN problemas de zona horaria
  const handleFechaChange = (e) => {
    const fecha = e.target.value;
    console.log('🔄 Cambio de fecha:', fecha);
    
    setFormData({
      ...formData,
      fecha: fecha,
      hora: '' // Limpiar hora seleccionada
    });
    
    // Limpiar horarios anteriores
    setHorariosDisponibles([]);
    
    if (fecha && formData.medico_cedula) {
      // 🔧 FIX: No convertir a ISO, usar la fecha tal como viene
      console.log('📅 Cargando horarios para fecha:', fecha);
      loadHorariosDisponibles(formData.medico_cedula, fecha);
    } else {
      setStep(3);
    }
  };

  // 🔧 FIX: Manejar selección de horario
  const handleHorarioClick = (hora) => {
    console.log('🔄 Horario seleccionado:', hora);
    setFormData({
      ...formData,
      hora: hora
    });
  };

  // Enviar formulario
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
    setHorariosDisponibles([]);
    setDoctorSeleccionado(null);
    setCitaGenerada(null);
    setStep(1);
    setError('');
    setSuccess('');
  };

  const getSelectedEspecialidad = () => {
    return especialidades.find(e => e.id_especialidad == formData.especialidad_id);
  };

  const getSelectedMedico = () => {
    return medicos.find(m => m.cedula === formData.medico_cedula);
  };

  const getSelectedHorario = () => {
    return horariosDisponibles.find(h => h.hora === formData.hora);
  };

  // 🔧 FIX: Función para formatear fecha sin problemas de zona horaria
  const formatearFechaLocal = (fechaString) => {
    if (!fechaString) return '';
    
    // Dividir la fecha directamente sin crear objeto Date
    const [year, month, day] = fechaString.split('-');
    
    // Crear fecha local específica sin conversión de zona horaria
    const fecha = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    
    return fecha.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric'
    });
  };

  // 🔧 FIX: Pantalla de éxito CORREGIDA con mejor manejo de hora
  if (step === 5 && citaGenerada) {
    console.log('🔍 Datos de cita generada:', citaGenerada); // Debug
    
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '30px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h2 style={{ color: '#10b981', fontSize: '2rem', marginBottom: '10px' }}>✅ ¡Cita Agendada Exitosamente!</h2>
            <div style={{ fontSize: '4rem', margin: '20px 0' }}>📅</div>
            <p style={{ color: '#6b7280' }}>Tu cita ha sido agendada correctamente</p>
          </div>

          <div style={{ backgroundColor: '#f9fafb', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
            <h3 style={{ textAlign: 'center', marginBottom: '15px' }}>📄 Comprobante de Cita</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <p><strong>Folio:</strong> #{citaGenerada.folio}</p>
                <p><strong>Paciente:</strong> {citaGenerada.nombre_paciente}</p>
                <p><strong>Especialidad:</strong> {citaGenerada.especialidad}</p>
                <p><strong>Médico:</strong> {citaGenerada.medico}</p>
              </div>
              <div>
                <p><strong>Fecha:</strong> {formatearFechaSinZonaHoraria(citaGenerada.fecha || citaGenerada.fecha_hora)}</p>
                <p><strong>Hora:</strong> {extraerHora(citaGenerada)}</p>
                <p><strong>Consultorio:</strong> {citaGenerada.consultorio}</p>
                <p><strong>Costo:</strong> ${citaGenerada.costo}</p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button 
              onClick={resetForm} 
              style={{ backgroundColor: '#2563eb', color: 'white', padding: '12px 24px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
            >
              Agendar Otra Cita
            </button>
            <button 
              onClick={() => window.print()} 
              style={{ backgroundColor: 'white', color: '#374151', padding: '12px 24px', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer' }}
            >
              🖨️ Imprimir
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '30px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '10px' }}>📝 Agendar Nueva Cita</h2>
        <p style={{ color: '#6b7280', marginBottom: '30px' }}>
          Sigue los pasos para agendar tu cita médica con horarios disponibles
        </p>

        {/* Progress Indicator */}
        <div style={{ marginBottom: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
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
                  fontSize: '14px',
                  fontWeight: '600',
                  backgroundColor: step >= num ? '#2563eb' : '#e5e7eb',
                  color: step >= num ? 'white' : '#6b7280'
                }}
              >
                {num}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#6b7280' }}>
            <span>Especialidad</span>
            <span>Médico</span>
            <span>Fecha</span>
            <span>Horario</span>
          </div>
        </div>

        {error && (
          <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderLeft: '4px solid #ef4444', padding: '15px', marginBottom: '20px', borderRadius: '6px' }}>
            <p style={{ color: '#dc2626' }}>{error}</p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Paso 1: Especialidad */}
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
              1. Selecciona la Especialidad
            </label>
            <select
              value={formData.especialidad_id}
              onChange={handleEspecialidadChange}
              style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '16px' }}
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
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                2. Selecciona el Médico
              </label>
              <select
                value={formData.medico_cedula}
                onChange={handleMedicoChange}
                style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '16px' }}
                required
                disabled={loading}
              >
                <option value="">-- Selecciona un médico --</option>
                {medicos.map((medico) => (
                  <option key={medico.cedula} value={medico.cedula}>
                    Dr. {medico.nombre_completo} | Consultorio {medico.consultorio_numero} | {medico.horario_display}
                  </option>
                ))}
              </select>
              
              {doctorSeleccionado && (
                <div style={{ marginTop: '10px', padding: '12px', backgroundColor: '#eff6ff', borderRadius: '6px' }}>
                  <p style={{ fontSize: '14px', color: '#1e40af' }}>
                    <strong>Horario del Dr. {doctorSeleccionado.nombre_completo}:</strong> {doctorSeleccionado.horario_display} ({doctorSeleccionado.turno})
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Paso 3: Fecha */}
          {step >= 3 && (
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                3. Selecciona la Fecha
              </label>
              <select
                value={formData.fecha}
                onChange={handleFechaChange}
                style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '16px' }}
                required
              >
                <option value="">-- Selecciona una fecha --</option>
                {fechasDisponibles.map((fecha) => (
                  <option key={fecha.fecha} value={fecha.fecha}>
                    {fecha.fecha_completa}
                  </option>
                ))}
              </select>
              <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '5px' }}>
                Solo se muestran fechas disponibles (mínimo 48 horas, máximo 3 meses)
              </p>
            </div>
          )}

          {/* Paso 4: Horario */}
          {step >= 4 && (
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                4. Selecciona el Horario Disponible
              </label>
              
              {loadingHorarios ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
                  <div style={{ fontSize: '20px' }}>⏳</div>
                  <span style={{ marginLeft: '10px' }}>Cargando horarios disponibles...</span>
                </div>
              ) : horariosDisponibles.length > 0 ? (
                <div>
                  <p style={{ marginBottom: '10px', fontSize: '14px', color: '#6b7280' }}>
                    Horarios disponibles encontrados: {horariosDisponibles.length}
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
                    {horariosDisponibles.map((horario, index) => {
                      // Debug: mostrar qué contiene cada horario
                      console.log('🔍 Horario:', { index, horario });
                      
                      // Usar hora_display, o como fallback, hora + " - " + (hora + 30min)
                      const displayText = horario.hora_display || 
                                         horario.hora || 
                                         `Horario ${index + 1}`;
                      
                      return (
                        <button
                          key={horario.hora || index}
                          type="button"
                          onClick={() => handleHorarioClick(horario.hora)}
                          style={{
                            padding: '12px',
                            border: formData.hora === horario.hora ? '2px solid #2563eb' : '1px solid #d1d5db',
                            borderRadius: '6px',
                            backgroundColor: formData.hora === horario.hora ? '#2563eb' : 'white',
                            color: formData.hora === horario.hora ? 'white' : '#374151',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500',
                            transition: 'all 0.2s',
                            minHeight: '44px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          {displayText}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div style={{ padding: '20px', backgroundColor: '#fef3c7', borderRadius: '6px' }}>
                  <p style={{ color: '#92400e' }}>No hay horarios disponibles para esta fecha. Por favor selecciona otra fecha.</p>
                </div>
              )}
            </div>
          )}

          {/* Resumen */}
          {step >= 4 && formData.hora && (
            <div style={{ backgroundColor: '#f9fafb', padding: '20px', borderRadius: '6px' }}>
              <h4 style={{ fontWeight: '600', marginBottom: '15px' }}>📋 Resumen de tu Cita:</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '14px' }}>
                <p><strong>Especialidad:</strong> {getSelectedEspecialidad()?.nombre_especialidad}</p>
                <p><strong>Médico:</strong> {getSelectedMedico()?.nombre_completo}</p>
                <p><strong>Fecha:</strong> {formData.fecha ? formatearFechaLocal(formData.fecha) : ''}</p>
                <p><strong>Hora:</strong> {getSelectedHorario()?.hora_display}</p>
                <p><strong>Consultorio:</strong> {getSelectedMedico()?.consultorio_numero}</p>
                <p><strong>Costo:</strong> ${getSelectedEspecialidad()?.costo_especialidad}</p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          {step >= 4 && formData.hora && (
            <button
              onClick={handleSubmit}
              style={{
                width: '100%',
                backgroundColor: '#10b981',
                color: 'white',
                padding: '16px',
                border: 'none',
                borderRadius: '6px',
                fontSize: '18px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1
              }}
              disabled={loading}
            >
              {loading ? 'Agendando...' : '✅ Confirmar Cita'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgendarCita;