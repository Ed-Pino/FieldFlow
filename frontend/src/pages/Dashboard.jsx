import { Link } from 'react-router-dom'

export default function Dashboard() {
  const user = JSON.parse(localStorage.getItem('ff_user') || '{}')
  const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN'

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="mono kicker">OPERACIÓN · ELECTROSERVICE SRL · 2026</div>
          <h1 className="page-title">Panel de operación</h1>
        </div>
        {isAdmin && (
          <div className="head-actions">
            <Link to="/admin/ordenes/nueva" className="btn btn-primary">
              + Nueva OT
            </Link>
            <Link to="/admin/agenda" className="btn btn-outline">
              Ver agenda
            </Link>
          </div>
        )}
      </div>

      <div className="kpi-grid">
        <div className="kpi">
          <div className="kpi-label">OTs activas</div>
          <div className="kpi-value">—</div>
          <div className="kpi-hint">pendientes + asignadas</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Técnicos disponibles</div>
          <div className="kpi-value">—</div>
          <div className="kpi-hint">para asignar</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Equipos bajo servicio</div>
          <div className="kpi-value">—</div>
          <div className="kpi-hint">en catálogo</div>
        </div>
        <div className="kpi" style={{ borderTop: '3px solid #c2410c' }}>
          <div className="kpi-label">Alertas preventivas</div>
          <div className="kpi-value">—</div>
          <div className="kpi-hint">por vencer este mes</div>
        </div>
      </div>

      <div className="card">
        <div className="mono kicker" style={{ marginBottom: 8 }}>
          VISTA PROTOTIPO
        </div>
        <div className="muted">
          Conectá los catálogos base desde <b>Catálogos</b> y la pantalla de{' '}
          <b>Orden de trabajo</b> para registrar evidencia y conformidad.
        </div>
      </div>
    </div>
  )
}
