// src/components/common/ModalCancelacionCita.jsx

import React, { useState, useEffect } from 'react';
import { authService } from '../../services/authService';

const ModalCancelacionCita = ({ 
  folioCita, 
  nombrePaciente,
  fechaCita,
  isOpen, 
  onClose, 
  onSuccess 
}) => {
  const [politica, setPolitica] = useState(null);
  const [loading, setLoading] = useState(false);
  const [motivoCancelacion, setMotivoCancelacion] = useState('');
  const [step, setStep] = useState('cargando'); // 'cargando', 'confirmar', 'procesando', 'resultado'
  const [resultadoCancelacion, setResultadoCancelacion] = useState(null);

  useEffect(() => {
    if (isOpen && folioCita) {
      cargarPoliticaCancelacion();
    }
  }, [isOpen, folioCita]);

  const cargarPoliticaCancelacion = async () => {
    try {
      setLoading(true);
      setStep('cargando');
      
      const response = await authService.obtenerPoliticaCancelacion(folioCita);
      
      if (response.success) {
        setPolitica(response.data);
        setStep('confirmar');
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('❌ Error cargando política:', error);
      alert('❌ Error al cargar información de la cita');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const confirmarCancelacion = async () => {
    try {
      setLoading(true);
      setStep('procesando');
      
      const response = await authService.cancelarCitaConPolitica(folioCita, motivoCancelacion);
      
      if (response.success) {
        setResultadoCancelacion(response.data);
        setStep('resultado');
        
        // Llamar callback de éxito después de un momento
        setTimeout(() => {
          onSuccess && onSuccess();
        }, 2000);
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('❌ Error cancelando cita:', error);
      alert('❌ ' + (error.response?.data?.message || error.message));
      setStep('confirmar');
    } finally {
      setLoading(false);
    }
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const obtenerColorPolitica = (porcentaje) => {
    if (porcentaje >= 100) return 'success';
    if (porcentaje >= 50) return 'warning';
    return 'danger';
  };

  const obtenerIconoPolitica = (porcentaje) => {
    if (porcentaje >= 100) return '✅';
    if (porcentaje >= 50) return '⚠️';
    return '❌';
  };

  if (!isOpen) return null;

  return (
    <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              {step === 'resultado' ? '✅ Cancelación Completada' : '❌ Cancelar Cita'}
            </h5>
            <button 
              type="button" 
              className="btn-close"
              onClick={onClose}
              disabled={loading}
              aria-label="Cerrar"
            >
              ✕
            </button>
          </div>

          <div className="modal-body">
            {step === 'cargando' && (
              <div className="text-center py-4">
                <div className="spinner-border" role="status"></div>
                <p className="mt-3">Cargando información de la cita...</p>
              </div>
            )}

            {step === 'confirmar' && politica && (
              <div>
                {/* Información de la cita */}
                <div className="card mb-4">
                  <div className="card-header bg-light">
                    <h6 className="mb-0">📋 Información de la Cita</h6>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-6">
                        <strong>Folio:</strong> #{folioCita}<br />
                        <strong>Paciente:</strong> {nombrePaciente}<br />
                        <strong>Fecha:</strong> {formatearFecha(fechaCita)}
                      </div>
                      <div className="col-md-6">
                        <strong>Monto pagado:</strong> ${politica.monto_pagado.toFixed(2)}<br />
                        <strong>Anticipación:</strong> {politica.horas_anticipacion} horas
                      </div>
                    </div>
                  </div>
                </div>

                {/* Política de devolución */}
                <div className={`card mb-4 border-${obtenerColorPolitica(politica.porcentaje_devolucion)}`}>
                  <div className={`card-header bg-${obtenerColorPolitica(politica.porcentaje_devolucion)} text-white`}>
                    <h6 className="mb-0">
                      {obtenerIconoPolitica(politica.porcentaje_devolucion)} Política de Devolución
                    </h6>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-8">
                        <h5 className={`text-${obtenerColorPolitica(politica.porcentaje_devolucion)}`}>
                          {politica.porcentaje_devolucion}% de Devolución
                        </h5>
                        <p className="mb-2">
                          <strong>Monto a devolver:</strong> 
                          <span className={`text-${obtenerColorPolitica(politica.porcentaje_devolucion)} fs-5 ms-2`}>
                            ${politica.monto_devolucion.toFixed(2)}
                          </span>
                        </p>
                      </div>
                      <div className="col-md-4 text-end">
                        <div className={`badge bg-${obtenerColorPolitica(politica.porcentaje_devolucion)} fs-6 p-2`}>
                          {politica.porcentaje_devolucion}%
                        </div>
                      </div>
                    </div>

                    <hr />

                    <div className="policy-rules">
                      <h6>📋 Reglas de Cancelación:</h6>
                      <ul className="list-unstyled">
                        <li className="mb-1">
                          <span className="badge bg-success me-2">100%</span>
                          48+ horas de anticipación
                        </li>
                        <li className="mb-1">
                          <span className="badge bg-warning me-2">50%</span>
                          24-48 horas de anticipación
                        </li>
                        <li className="mb-1">
                          <span className="badge bg-danger me-2">0%</span>
                          Menos de 24 horas
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Motivo de cancelación */}
                <div className="mb-3">
                  <label className="form-label">
                    <strong>Motivo de cancelación (opcional):</strong>
                  </label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={motivoCancelacion}
                    onChange={(e) => setMotivoCancelacion(e.target.value)}
                    placeholder="Describe el motivo de la cancelación..."
                    disabled={loading}
                  />
                </div>

                {!politica.puede_cancelar && (
                  <div className="alert alert-danger">
                    <strong>⚠️ No se puede cancelar:</strong> Esta cita ya pasó su fecha/hora programada.
                  </div>
                )}
              </div>
            )}

            {step === 'procesando' && (
              <div className="text-center py-4">
                <div className="spinner-border text-primary" role="status"></div>
                <p className="mt-3">Procesando cancelación...</p>
                <small className="text-muted">Por favor espera mientras procesamos tu solicitud</small>
              </div>
            )}

            {step === 'resultado' && resultadoCancelacion && (
              <div className="text-center">
                <div className="mb-4">
                  <div className="text-success mb-3" style={{ fontSize: '3rem' }}>✅</div>
                  <h4 className="text-success">Cita Cancelada Exitosamente</h4>
                </div>

                <div className="card">
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-6">
                        <h6>📋 Resumen de Cancelación</h6>
                        <p><strong>Folio:</strong> #{resultadoCancelacion.folio_cita}</p>
                        <p><strong>Fecha:</strong> {new Date().toLocaleString('es-MX')}</p>
                      </div>
                      <div className="col-md-6">
                        <h6>💰 Información de Devolución</h6>
                        <p><strong>Porcentaje:</strong> {resultadoCancelacion.politica_aplicada.porcentaje_devolucion}%</p>
                        <p><strong>Monto:</strong> ${resultadoCancelacion.politica_aplicada.monto_devolucion.toFixed(2)}</p>
                      </div>
                    </div>
                    
                    <hr />
                    
                    <div className="alert alert-info mb-0">
                      <strong>📝 Siguiente paso:</strong><br />
                      {resultadoCancelacion.siguiente_paso}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer">
            {step === 'confirmar' && (
              <>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={onClose}
                  disabled={loading}
                >
                  ❌ No Cancelar
                </button>
                <button 
                  type="button" 
                  className="btn btn-danger"
                  onClick={confirmarCancelacion}
                  disabled={loading || !politica?.puede_cancelar}
                >
                  {loading ? 'Cancelando...' : '✅ Confirmar Cancelación'}
                </button>
              </>
            )}

            {step === 'resultado' && (
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={onClose}
              >
                ✅ Entendido
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalCancelacionCita;