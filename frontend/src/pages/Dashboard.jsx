import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getOrdenes } from '../api/ordenes'
import { getTecnicosDisponibles } from '../api/catalogos'
import { getEquipos } from '../api/catalogos'
import { EstadoBadge } from './Ordenes'

function safeUser() {
  try {
    const raw = localStorage.getItem('ff_user')
    if (!raw || raw === 'undefined' || raw === 'null') return {}
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

function addDaysISO(days) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export default function Dashboard() {
  const user = safeUser()
  const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN'
  const [ordenes, setOrdenes] = useState([])
  const [disponibles, setDisponibles] = useState([])
  const [equipos, setEquipos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const [ots, tecs, eqs] = await Promise.all([
          getOrdenes(),
          getTecnicosDisponibles(),
          getEquipos(),
        ])
        setOrdenes(Array.isArray(ots) ? ots : [])
        setDisponibles(tecs || [])
        setEquipos(eqs || [])
      } catch (err) {
        setError(err.message || 'No se pudo cargar el panel')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const stats = useMemo(() => {
    const activas = ordenes.filter((o) => o.estado !== 'finalizada')
    const limite = addDaysISO(7)
    const alertas = ordenes.filter(
      (o) => o.estado !== 'finalizada' && o.fechaProgramada && o.fechaProgramada <= limite
    )
    const porEstado = {}
    for (const o of ordenes) porEstado[o.estado] = (porEstado[o.estado] || 0) + 1
    const recientes = [...ordenes]
      .sort((a, b) => String(b.fechaProgramada).localeCompare(String(a.fechaProgramada)))
      .slice(0, 8)
    return { activas: activas.length, alertas: alertas.length, porEstado, recientes }
  }, [ordenes])

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="mono kicker">OPERACION - ELECTROSERVICE SRL - 2026</div>
          <h1 className="page-title">Panel de operacion</h1>
        </div>
        {isAdmin && (
          <div className="head-actions">
            <Link to="/ordenes/nueva" className="btn btn-primary">
              + Crear orden
            </Link>
            <Link to="/agenda" className="btn btn-outline">
              Ver agenda
            </Link>
          </div>
        )}
      </div>

      {error && <div className="error-box" style={{ marginBottom: 14 }}>{error}</div>}

      <div className="kpi-grid">
        <div className="kpi">
          <div className="kpi-label">OTs activas</div>
          <div className="kpi-value">{loading ? '…' : stats.activas}</div>
          <div className="kpi-hint">pendientes + asignadas + en curso</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Tecnicos disponibles</div>
          <div className="kpi-value">{loading ? '…' : disponibles.length}</div>
          <div className="kpi-hint">para asignar</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Equipos bajo servicio</div>
          <div className="kpi-value">{loading ? '…' : equipos.length}</div>
          <div className="kpi-hint">en catalogo</div>
        </div>
        <div className="kpi" style={{ borderTop: '3px solid #c2410c' }}>
          <div className="kpi-label">Alertas preventivas</div>
          <div className="kpi-value">{loading ? '…' : stats.alertas}</div>
          <div className="kpi-hint">programadas en los proximos 7 dias</div>
        </div>
      </div>

      <div className="card">
        <div className="mono kicker" style={{ marginBottom: 8 }}>
          OTs RECIENTES
        </div>
        {stats.recientes.length === 0 && !loading && (
          <div className="muted">Sin ordenes registradas.</div>
        )}
        {stats.recientes.map((o) => (
          <div key={o.id} className="traza-row">
            <span className="mono"><Link to={`/ordenes/${o.id}`}>{o.codigo}</Link></span>
            <span className="muted">{o.cliente} · {o.equipo}</span>
            <span className="mono muted">{o.fechaProgramada}</span>
            <EstadoBadge estado={o.estado} />
          </div>
        ))}
      </div>
    </div>
  )
}
