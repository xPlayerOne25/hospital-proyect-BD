import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, DatePicker, Button, message } from 'antd';
import moment from 'moment';
import { authService } from '../../../services/authService';

const EditarPacienteModal = ({ paciente, visible, onClose, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // Cargar los datos del paciente cuando se abre el modal
useEffect(() => {
  if (visible && paciente) {
    form.setFieldsValue({
      nombre: paciente.nombre || '',
      apellido_paterno: paciente.apellido_paterno || '',
      apellido_materno: paciente.apellido_materno || '',
      CURP: paciente.CURP || '',
      telefono: paciente.telefono || '',
      fecha_nacimiento: paciente.fecha_nacimiento 
        ? moment(paciente.fecha_nacimiento, 'YYYY-MM-DD').utcOffset(0, true) 
        : null

    });
  }
}, [visible, paciente, form]);



  // Manejar envío de formulario
const handleSubmit = async () => {
  try {
    setLoading(true);
    const values = await form.validateFields();

    const datosActualizados = {
      ...values,
      fecha_nacimiento: values.fecha_nacimiento?.format('YYYY-MM-DD') || null,
    };

    const response = await authService.actualizarPaciente(paciente.CURP, datosActualizados);

    if (response && response.success) {
      message.success('Paciente actualizado correctamente');

      // Actualiza el paciente en el frontend
      onSuccess({
        ...paciente,
        ...datosActualizados
      });

      onClose();
    } else {
      message.error(response?.message || 'No se pudo actualizar el paciente');
    }
  } catch (error) {
    console.error('❌ Error al actualizar paciente:', error);
    message.error(
      error.response?.data?.message ||
      error.message ||
      'Error inesperado al actualizar paciente'
    );
  } finally {
    setLoading(false);
  }
};



  return (
    <Modal
      title={`Editar Paciente: ${paciente?.nombre || ''}`}
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="cancelar" onClick={onClose}>
          Cancelar
        </Button>,
        <Button
          key="guardar"
          type="primary"
          loading={loading}
          onClick={handleSubmit}
        >
          Guardar Cambios
        </Button>
      ]}
      width={700}
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
          <Form.Item
            name="nombre"
            label="Nombre"
            rules={[{ required: true, message: 'Nombre obligatorio' }]}
            style={{ flex: 1 }}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="apellido_paterno"
            label="Apellido Paterno"
            rules={[{ required: true, message: 'Apellido paterno obligatorio' }]}
            style={{ flex: 1 }}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="apellido_materno"
            label="Apellido Materno"
            style={{ flex: 1 }}
          >
            <Input />
          </Form.Item>
        </div>

        <div style={{ display: 'flex', gap: 16 }}>
          <Form.Item
            name="CURP"
            label="CURP"
            style={{ flex: 1 }}
          >
            <Input disabled />
          </Form.Item>
          <Form.Item
            name="telefono"
            label="Teléfono"
            rules={[{
              required: false,
              pattern: /^[0-9]{10}$/,
              message: 'Teléfono debe tener 10 dígitos'
            }]}
            style={{ flex: 1 }}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="fecha_nacimiento"
            label="Fecha de Nacimiento"
            style={{ flex: 1 }}
          >
            <DatePicker
              format="YYYY-MM-DD"
              style={{ width: '100%' }}
              disabledDate={current => current && current > moment().endOf('day')}
            />
          </Form.Item>
        </div>
      </Form>
    </Modal>
  );
};

export default EditarPacienteModal;
