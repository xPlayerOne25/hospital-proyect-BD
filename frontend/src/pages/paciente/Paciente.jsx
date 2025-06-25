import React, { useState, useEffect } from 'react';
import api from '../../utils/axiosInstance';

const PacientePerfil = () => {
  const [perfil, setPerfil] = useState(null);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPerfil = async () => {
      try {
        const response = await api.get('/pacientes/perfil');
        setPerfil(response.data);
        setError(null);
      } catch (err) {
        console.error('Error al cargar el perfil:', err);
        setError('Error al cargar los datos.');
      }
    };

    fetchPerfil();
  }, []);

  const handleChange = (e) => {
    setPerfil({
      ...perfil,
      [e.target.name]: e.target.value,
    });
  };

  const handleGuardar = async () => {
    try {
      await api.put('/pacientes/perfil', perfil);
      setModoEdicion(false);
      alert('✅ Perfil actualizado correctamente');
    } catch (error) {
      console.error('Error al guardar perfil:', error);
      alert('❌ Error al guardar los cambios');
    }
  };

  if (!perfil) {
    return <div className="p-6 text-center">Cargando...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto bg-white shadow-md p-6 rounded-lg mt-8">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <span className="text-blue-600 text-3xl">👤</span> Mi Perfil
      </h2>

      {error && (
        <div className="bg-blue-100 text-red-600 px-4 py-2 rounded mb-4 font-semibold">
          ❌ {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        <Field
          label="Nombre de usuario"
          name="usuario_nombre"
          value={perfil.usuario_nombre}
          editable={modoEdicion}
          onChange={handleChange}
        />
        
        <Field label="CURP" value={perfil.CURP} readOnly />

        <Field
          label="Correo electrónico"
          name="usuario_correo"
          value={perfil.usuario_correo}
          editable={modoEdicion}
          onChange={handleChange}
        />


        <Field
          label="Nombre"
          name="pac_nombre"
          value={perfil.pac_nombre}
          editable={modoEdicion}
          onChange={handleChange}
        />

        <Field
          label="Apellido Paterno"
          name="pac_paterno"
          value={perfil.pac_paterno}
          editable={modoEdicion}
          onChange={handleChange}
        />

        <Field
          label="Apellido Materno"
          name="pac_materno"
          value={perfil.pac_materno}
          editable={modoEdicion}
          onChange={handleChange}
        />

        <Field
          label="Teléfono"
          name="pac_tel"
          value={perfil.pac_tel}
          editable={modoEdicion}
          onChange={handleChange}
        />

        <Field
          label="Fecha de nacimiento"
          name="pac_fechaNacimiento"
          type="date"
          value={perfil.pac_fechaNacimiento?.split('T')[0]}
          editable={modoEdicion}
          onChange={handleChange}
        />
      </div>

      <div className="mt-6 text-right">
        {modoEdicion ? (
          <button
            onClick={handleGuardar}
            className="btn btn-outline btn-primary"
          >
            💾 Guardar
          </button>
        ) : (
          <button
            onClick={() => setModoEdicion(true)}
            className="btn btn-outline  btn-secondary"
          >
            ✏️ Editar
          </button>
        )}
      </div>
    </div>
  );
};

const Field = ({ label, value, name, editable = false, onChange, readOnly = false, type = 'text' }) => (
  <div>
    <label className="font-bold block mb-1">{label}</label>
    {editable ? (
      <input
        type={type}
        name={name}
        value={value || ''}
        onChange={onChange}
        className="w-full border px-3 py-2 rounded-md"
      />
    ) : (
      <input
        type={type}
        name={name}
        value={value || ''}
        readOnly
        disabled={readOnly}
        className="w-full bg-gray-100 border px-3 py-2 rounded-md text-gray-700"
      />
    )}
  </div>
);

export default PacientePerfil;
