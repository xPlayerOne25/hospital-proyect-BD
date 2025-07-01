import React, { useEffect, useState } from 'react';
import { authService } from '../../services/authService';
import EditarPacienteModal from './modals/EditarPacienteModal';
import styles from './PacientesRecepcionista.module.css';

const PacientesRecepcionista = () => {
  const [pacientes, setPacientes] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState(null);

  const cargarPacientes = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await authService.obtenerPacientes();
      setPacientes(response.data || []);
    } catch (error) {
      console.error('Error:', error);
      setError('Error al cargar pacientes');
      setPacientes([]);
    } finally {
      setLoading(false);
    }
  };

  const pacientesFiltrados = pacientes.filter(pac => {
    const texto = busqueda.toLowerCase();
    return (
      `${pac.nombre} ${pac.apellido_paterno} ${pac.apellido_materno}`.toLowerCase().includes(texto) ||
      pac.CURP?.toLowerCase().includes(texto) ||
      pac.telefono?.includes(busqueda)
    );
  });

  const handleEditar = (paciente) => {
    setPacienteSeleccionado(paciente);
    setModalVisible(true);
  };

  const handleActualizar = (pacienteActualizado) => {
    setPacientes(pacientes.map(p => 
      p.CURP === pacienteActualizado.CURP ? pacienteActualizado : p
    ));
    setModalVisible(false);
  };

  useEffect(() => { cargarPacientes(); }, []);

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>👤 Gestión de Pacientes</h2>
      
      <input
        type="text"
        placeholder="Buscar por nombre, CURP o teléfono..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        className={styles.searchInput}
      />

      {loading ? (
        <p className={styles.message}>Cargando pacientes...</p>
      ) : error ? (
        <div className={styles.error}>
          <p>{error}</p>
          <button onClick={cargarPacientes} className={styles.retryButton}>Reintentar</button>
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nombre Completo</th>
                <th>CURP</th>
                <th>Teléfono</th>
                <th>Fecha Nacimiento</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pacientesFiltrados.length > 0 ? (
                pacientesFiltrados.map(pac => (
                  <tr key={pac.CURP}>
                    <td>{pac.nombre} {pac.apellido_paterno} {pac.apellido_materno}</td>
                    <td>{pac.CURP}</td>
                    <td>{pac.telefono || 'N/A'}</td>
                    <td>{pac.fecha_nacimiento ? pac.fecha_nacimiento.split('T')[0].split('-').reverse().join('/') : 'N/A'}</td>
                    <td>
                      <button 
                        className={styles.editButton}
                        onClick={() => handleEditar(pac)}
                      >
                        ✏️ Editar
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className={styles.message}>
                    {busqueda ? 'No se encontraron coincidencias' : 'No hay pacientes registrados'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <EditarPacienteModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        paciente={pacienteSeleccionado}
        onSuccess={handleActualizar}
      />
    </div>
  );
};

export default PacientesRecepcionista;
