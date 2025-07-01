import React from 'react';
import '../../styles/components.css';

const EstadisticasMedico = ({ estadisticas, loading }) => {
  if (loading) {
    return (
      <div className="card">
        <div className="card-body text-center">
          <div className="spinner-border" role="status">
            <span className="sr-only">Cargando...</span>
          </div>
          <p className="mt-3">Cargando estadísticas...</p>
        </div>
      </div>
    );
  }

  if (!estadisticas) {
    return (
      <div className="card">
        <div className="card-body text-center">
          <h4 className="text-warning">⚠️ Sin datos</h4>
          <p>No se pudieron cargar las estadísticas</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            🔄 Recargar
          </button>
        </div>
      </div>
    );
  }

const totalCitas = Number(estadisticas?.total_citas ?? 0);
const atendidas = Number(estadisticas?.citas_atendidas ?? 0);
const pendientes = Number(estadisticas?.citas_pendientes ?? 0);
const canceladas = Number(estadisticas?.citas_canceladas ?? 0);
const hoy = Number(estadisticas?.citas_hoy ?? 0);
const recetas = Number(estadisticas?.total_recetas ?? 0);


  const porcentajeAtendidas = totalCitas > 0 ? Math.round((atendidas / totalCitas) * 100) : 0;
  const porcentajePendientes = totalCitas > 0 ? Math.round((pendientes / totalCitas) * 100) : 0;

  return (
    <div className="card shadow-sm">
      <div className="card-header bg-primary text-white">
        <h4 className="mb-0">📊 Panel de Estadísticas</h4>
        <small>Resumen de tu actividad médica</small>
      </div>

      <div className="card-body">
        <div className="row mb-4">
          <div className="col-lg-4 mb-3">
            <div className="card border-primary text-center">
              <div className="card-body">
                <h3 className="text-primary display-4">{totalCitas}</h3>
                <h5 className="card-title">📅 Total de Citas</h5>
                <p className="text-muted">Todas las citas asignadas</p>
              </div>
            </div>
          </div>

          <div className="col-lg-4 mb-3">
            <div className="card border-success text-center">
              <div className="card-body">
                <h3 className="text-success display-4">{atendidas}</h3>
                <h5 className="card-title">✅ Citas Atendidas</h5>
                <p className="text-muted">{porcentajeAtendidas}% del total</p>
                <div className="progress" style={{ height: '8px' }}>
                  <div
                    className="progress-bar bg-success"
                    style={{ width: `${porcentajeAtendidas}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-4 mb-3">
            <div className="card border-warning text-center">
              <div className="card-body">
                <h3 className="text-warning display-4">{pendientes}</h3>
                <h5 className="card-title">⏳ Citas Pendientes</h5>
                <p className="text-muted">{porcentajePendientes}% del total</p>
                <div className="progress" style={{ height: '8px' }}>
                  <div
                    className="progress-bar bg-warning"
                    style={{ width: `${porcentajePendientes}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Estadísticas secundarias */}
        <div className="row mb-4">
          <div className="col-md-4 mb-3">
            <div className="card bg-light border">
              <div className="card-body d-flex align-items-center">
                <div className="text-primary me-3" style={{ fontSize: '2rem' }}>🗓️</div>
                <div>
                  <h4 className="mb-0">{hoy}</h4>
                  <small className="text-muted">Citas Hoy</small>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-4 mb-3">
            <div className="card bg-light border">
              <div className="card-body d-flex align-items-center">
                <div className="text-success me-3" style={{ fontSize: '2rem' }}>💊</div>
                <div>
                  <h4 className="mb-0">{recetas}</h4>
                  <small className="text-muted">Recetas Emitidas</small>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-4 mb-3">
            <div className="card bg-light border">
              <div className="card-body d-flex align-items-center">
                <div className="text-danger me-3" style={{ fontSize: '2rem' }}>❌</div>
                <div>
                  <h4 className="mb-0">{canceladas}</h4>
                  <small className="text-muted">Citas Canceladas</small>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Alertas inteligentes */}
        <div className="row">
          <div className="col-12">
            {hoy > 0 && (
              <div className="alert alert-info">
                <strong>🔔 ¡Tienes {hoy} cita{hoy > 1 ? 's' : ''} programada{hoy > 1 ? 's' : ''} para hoy!</strong>
              </div>
            )}

            {pendientes > 5 && (
              <div className="alert alert-warning">
                ⚠️ Tienes <strong>{pendientes} citas pendientes</strong>. Revisa tu agenda.
              </div>
            )}

            {porcentajeAtendidas >= 80 && totalCitas > 10 && (
              <div className="alert alert-success">
                🎉 ¡Excelente! Has atendido el <strong>{porcentajeAtendidas}%</strong> de tus citas.
              </div>
            )}

            {totalCitas === 0 && (
              <div className="alert alert-secondary">
                📅 Aún no tienes citas registradas. Las estadísticas aparecerán pronto.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EstadisticasMedico;
