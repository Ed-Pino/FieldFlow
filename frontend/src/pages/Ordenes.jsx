import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getClientes, getTecnicos } from '../api/catalogos'
import { ESTADOS, getOrdenes } from '../api/ordenes'

const ESTADO_COLORS = {
  pendiente: '#64748b',
  asignada: '#c2410c',
  enCamino: '#2563eb',
  enEjecucion: '#7c3aed',
  pendienteConformidad: '#b45309',
  finalizada: '#15803d',
  reprogramada: '#dc2626',
}

const ESTADO_LABELS = {
  pendiente: 'Pendiente',
  asignada: 'Asignada',
  enCamino: 'En camino',
  enEjecucion: 'En ejecución',
  pendienteConformidad: 'Pend. conformidad',
  finalizada: 'Finalizada',
  reprogramada: 'Reprogramada',
}

export function EstadoBadge({ estado }) {
  const color = ESTADO_COLORS[estado] || '#64748b'
  return (
    <span className="badge" style={{ background: `${color}1a`, color }}>
      {ESTADO_LABELS[estado] || estado}
    </span>
  )
}

export default function Ordenes() {
  const [ordenes, setOrdenes] = useState([])
  const [tecnicos, setTecnicos] = useState([])
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState({ estado: '', tecnico: '', cliente: '', fecha: '' })

  async function load() {
    setError('')
    setLoading(true)
    try {
      const [orders, technicians, customers] = await Promise.all([
        getOrdenes(),
        getTecnicos(),
        getClientes(),
      ])
      setOrdenes(Array.isArray(orders) ? orders : [])
      setTecnicos(technicians || [])
      setClientes(customers || [])
    } catch (err) {
      setError(err.message || 'No se pudieron cargar las órdenes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const counts = useMemo(() => ordenes.reduce((result, order) => {
    result[order.estado] = (result[order.estado] || 0) + 1
    return result
  }, {}), [ordenes])

  const filteredOrders = useMemo(() => ordenes.filter((order) => (
    (!filter.estado || order.estado === filter.estado)
    && (!filter.tecnico || order.tecnico === filter.tecnico)
    && (!filter.cliente || order.cliente === filter.cliente)
    && (!filter.fecha || order.fechaProgramada === filter.fecha)
  )), [ordenes, filter])

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="mono kicker">ADMIN · OPERACIÓN</div>
          <h1 className="page-title">Órdenes de trabajo</h1>
        </div>
        <div className="head-actions">
          <button className="btn btn-outline" disabled={loading} onClick={load}>Recargar</button>
          <Link to="/ordenes/nueva" className="btn btn-primary">+ Crear orden</Link>
        </div>
      </div>

      {error && <div className="error-box" style={{ marginBottom: 14 }}>{error}</div>}

      <div className="kpi-grid" style={{ marginBottom: 16 }}>
        <div className="kpi"><div className="kpi-label">Total</div><div className="kpi-value">{ordenes.length}</div></div>
        <div className="kpi"><div className="kpi-label">Pendientes</div><div className="kpi-value">{counts.pendiente || 0}</div></div>
        <div className="kpi"><div className="kpi-label">En ejecución</div><div className="kpi-value">{counts.enEjecucion || 0}</div></div>
        <div className="kpi"><div className="kpi-label">Finalizadas</div><div className="kpi-value">{counts.finalizada || 0}</div></div>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
          <button className={`tab ${filter.estado === '' ? 'active' : ''}`} onClick={() => setFilter({ ...filter, estado: '' })}>
            Todas ({ordenes.length})
          </button>
          {ESTADOS.map((estado) => (
            <button
              key={estado}
              className={`tab ${filter.estado === estado ? 'active' : ''}`}
              onClick={() => setFilter({ ...filter, estado })}
            >
              {ESTADO_LABELS[estado] || estado}{counts[estado] ? ` (${counts[estado]})` : ''}
            </button>
          ))}
        </div>
        <div className="filters">
          <label className="form-row">Técnico
            <select value={filter.tecnico} onChange={(event) => setFilter({ ...filter, tecnico: event.target.value })}>
              <option value="">Todos</option>
              {tecnicos.map((technician) => <option key={technician.id} value={technician.nombre}>{technician.nombre}</option>)}
            </select>
          </label>
          <label className="form-row">Cliente
            <select value={filter.cliente} onChange={(event) => setFilter({ ...filter, cliente: event.target.value })}>
              <option value="">Todos</option>
              {clientes.map((customer) => <option key={customer.id} value={customer.nombre}>{customer.nombre}</option>)}
            </select>
          </label>
          <label className="form-row">Fecha programada
            <input type="date" value={filter.fecha} onChange={(event) => setFilter({ ...filter, fecha: event.target.value })} />
          </label>
        </div>
      </div>

      {loading && <div className="muted">Cargando órdenes…</div>}
      {!loading && filteredOrders.length === 0 && !error && (
        <div className="card muted">No hay órdenes para los filtros seleccionados.</div>
      )}
      {!loading && filteredOrders.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Código</th><th>Servicio</th><th>Cliente / Equipo</th><th>Técnico</th><th>Prog.</th><th>Prioridad</th><th>Estado</th></tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id}>
                  <td className="mono"><Link to={`/ordenes/${order.id}`}>{order.codigo}</Link></td>
                  <td>{order.tipoServicio}</td>
                  <td className="muted">{order.cliente} · {order.equipo}</td>
                  <td>{order.tecnico || '—'}</td>
                  <td className="mono">{order.fechaProgramada}</td>
                  <td>{order.prioridad || '—'}</td>
                  <td><EstadoBadge estado={order.estado} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
