import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getOrdenes } from '../api/ordenes'

const ESTADOS = [
  { value: '', label: 'Todas' },
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'asignada', label: 'Asignada' },
  { value: 'enCamino', label: 'En camino' },
  { value: 'enEjecucion', label: 'En ejecución' },
  { value: 'pendienteConformidad', label: 'Pend. conformidad' },
  { value: 'finalizada', label: 'Finalizada' },
  { value: 'reprogramada', label: 'Reprogramada' }
]

const ESTADO_COLORS = {
  pendiente: { bg: '#fef3c7', text: '#92400e' },
  asignada: { bg: '#dbeafe', text: '#1e40af' },
  enCamino: { bg: '#e0e7ff', text: '#3730a3' },
  enEjecucion: { bg: '#d1fae5', text: '#065f46' },
  pendienteConformidad: { bg: '#fce7f3', text: '#9d174d' },
  finalizada: { bg: '#e5e7eb', text: '#374151' },
  reprogramada: { bg: '#fed7aa', text: '#9a3412' }
}

const PRIORIDAD_COLORS = {
  baja: '#64748b',
  media: '#1b4f9c',
  alta: '#c2410c',
  urgente: '#b91c1c'
}

function estadoLabel(estado) {
  const map = {
    pendiente: 'Pendiente',
    asignada: 'Asignada',
    enCamino: 'En camino',
    enEjecucion: 'En ejecución',
    pendienteConformidad: 'Pend. conformidad',
    finalizada: 'Finalizada',
    reprogramada: 'Reprogramada'
  }
  return map[estado] || estado
}

export default function Ordenes() {
  const navigate = useNavigate()
  const [ordenes, setOrdenes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')

  async function load() {
    setError('')
    try {
      const data = await getOrdenes()
      setOrdenes(data)
    } catch (err) {
      setError(err.message || 'Error al cargar órdenes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtradas = filtroEstado
    ? ordenes.filter((o) => o.estado === filtroEstado)
    : ordenes

  const counts = ordenes.reduce((acc, o) => {
    acc[o.estado] = (acc[o.estado] || 0) + 1
    return acc
  }, {})

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="mono kicker">ADMIN · OPERACIÓN</div>
          <h1 className="page-title">Órdenes de Trabajo</h1>
        </div>
        <div className="head-actions">
          <Link to="/ordenes/nueva" className="btn btn-primary">
            + Nueva OT
          </Link>
          <button className="btn btn-outline" disabled={loading} onClick={load}>
            Recargar
          </button>
        </div>
      </div>

      {error && <div className="error-box" style={{ marginBottom: 14 }}>{error}</div>}

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        {ESTADOS.map((e) => (
          <button
            key={e.value}
            onClick={() => setFiltroEstado(e.value)}
            style={{
              padding: '6px 12px',
              borderRadius: 20,
              border: 'none',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              background: filtroEstado === e.value ? 'var(--navy)' : '#e5e7eb',
              color: filtroEstado === e.value ? '#fff' : '#374151',
              fontFamily: 'var(--font-mono)'
            }}
          >
            {e.label}
            {e.value && counts[e.value] ? ` (${counts[e.value]})` : ''}
            {!e.value && ` (${ordenes.length})`}
          </button>
        ))}
      </div>

      <div className="kpi-grid" style={{ marginBottom: 16 }}>
        <div className="kpi">
          <div className="kpi-label">Total</div>
          <div className="kpi-value">{ordenes.length}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Pendientes</div>
          <div className="kpi-value">{counts.pendiente || 0}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">En ejecución</div>
          <div className="kpi-value">{counts.enEjecucion || 0}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Finalizadas</div>
          <div className="kpi-value">{counts.finalizada || 0}</div>
        </div>
      </div>

      {loading && <div className="muted">Cargando órdenes…</div>}

      {!loading && filtradas.length === 0 && (
        <div className="card">
          <div className="muted">
            {filtroEstado ? 'No hay órdenes con ese estado.' : 'No hay órdenes registradas.'}
          </div>
        </div>
      )}

      {!loading && filtradas.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Cliente</th>
                <th>Equipo</th>
                <th>Técnico</th>
                <th>Fecha prog.</th>
                <th>Prioridad</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map((o) => (
                <tr
                  key={o.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/ordenes/${o.id}`)}
                >
                  <td className="mono" style={{ fontWeight: 600 }}>{o.codigo}</td>
                  <td>{o.cliente || '—'}</td>
                  <td>{o.equipo || '—'}</td>
                  <td>{o.tecnico || 'Sin asignar'}</td>
                  <td className="muted">{o.fechaProgramada || '—'}</td>
                  <td>
                    <span style={{
                      color: PRIORIDAD_COLORS[o.prioridad] || '#64748b',
                      fontWeight: 600,
                      fontSize: 12
                    }}>
                      {o.prioridad || '—'}
                    </span>
                  </td>
                  <td>
                    <span style={{
                      display: 'inline-block',
                      padding: '3px 10px',
                      borderRadius: 20,
                      fontSize: 11,
                      fontWeight: 600,
                      background: ESTADO_COLORS[o.estado]?.bg || '#e5e7eb',
                      color: ESTADO_COLORS[o.estado]?.text || '#374151'
                    }}>
                      {estadoLabel(o.estado)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
