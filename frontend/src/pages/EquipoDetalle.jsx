import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getEquipo, getSedes } from '../api/catalogos'
import { getOrdenes } from '../api/ordenes'
import { EstadoBadge } from './Ordenes'

export default function EquipoDetalle() {
  const { id } = useParams()
  const [equipo, setEquipo] = useState(null)
  const [sede, setSede] = useState(null)
  const [ots, setOts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setError('')
    setLoading(true)
    try {
      const eq = await getEquipo(id)
      setEquipo(eq)
      const [sedes, ordenes] = await Promise.all([getSedes(), getOrdenes()])
      setSede((sedes || []).find((s) => String(s.id) === String(eq.sedeId)) || null)
      setOts((Array.isArray(ordenes) ? ordenes : []).filter((o) => String(o.equipoId) === String(eq.id)))
    } catch (err) {
      setError(err.message || 'No se pudo cargar el equipo')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  if (loading) return <div className="muted">Cargando equipo…</div>
  if (!equipo) return <div className="error-box">{error || 'Equipo no encontrado'}</div>

  const finalizadas = ots.filter((o) => o.estado === 'finalizada').length

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="mono kicker">ADMIN · EQUIPO · {equipo.codigo}</div>
          <h1 className="page-title">{equipo.nombre}</h1>
        </div>
        <div className="head-actions">
          <Link to="/ordenes/nueva" className="btn btn-primary">
            + Crear orden
          </Link>
        </div>
      </div>

      {error && <div className="error-box" style={{ marginBottom: 14 }}>{error}</div>}

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="mono kicker" style={{ marginBottom: 10 }}>Ficha del equipo</div>
        <div className="info-grid">
          <div><div className="muted">Codigo</div><strong className="mono">{equipo.codigo}</strong></div>
          <div><div className="muted">Tipo</div><strong>{equipo.tipo}</strong></div>
          <div><div className="muted">Sede</div><strong>{sede ? `${sede.nombre} — ${sede.ciudad}` : '—'}</strong></div>
          <div><div className="muted">Ult. mantenimiento</div><strong className="mono">{equipo.ultimoMantenimiento || '—'}</strong></div>
          <div><div className="muted">OTs</div><strong>{ots.length} ({finalizadas} finalizadas)</strong></div>
        </div>
      </div>

      <div className="card">
        <div className="mono kicker" style={{ marginBottom: 10 }}>Historial del equipo (trazabilidad)</div>
        {ots.length === 0 && <div className="muted">Sin ordenes para este equipo.</div>}
        {[...ots]
          .sort((a, b) => String(b.fechaProgramada).localeCompare(String(a.fechaProgramada)))
          .map((o) => (
            <div key={o.id} className="traza-row">
              <span className="mono"><Link to={`/ordenes/${o.id}`}>{o.codigo}</Link></span>
              <span className="muted">{o.tipoServicio}</span>
              <span className="mono muted">{o.fechaProgramada}</span>
              <EstadoBadge estado={o.estado} />
            </div>
          ))}
      </div>
    </div>
  )
}
