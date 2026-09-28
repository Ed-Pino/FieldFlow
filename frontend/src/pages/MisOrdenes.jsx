import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAgenda } from '../api/ordenes'
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

export default function MisOrdenes() {
  const user = safeUser()
  const [agenda, setAgenda] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user.tecnicoId == null) {
      setLoading(false)
      return
    }
    getAgenda(user.tecnicoId)
      .then((a) => setAgenda(Array.isArray(a) ? a : []))
      .catch((err) => setError(err.message || 'No se pudieron cargar tus ordenes'))
      .finally(() => setLoading(false))
  }, [])

  if (user.tecnicoId == null) {
    return (
      <div>
        <div className="mono kicker">TECNICO · MIS ORDENES</div>
        <h1 className="page-title">Mis ordenes</h1>
        <div className="error-box">
          Tu usuario no tiene tecnico vinculado. Pide al administrador que vincule tu cuenta en el backend.
        </div>
      </div>
    )
  }

  const activas = agenda.filter((o) => o.estado !== 'finalizada')

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="mono kicker">TECNICO · {user.username}</div>
          <h1 className="page-title">Mis ordenes ({activas.length} activas)</h1>
        </div>
        <div className="head-actions">
          <Link to="/agenda" className="btn btn-outline">
            Ver agenda
          </Link>
        </div>
      </div>

      {error && <div className="error-box" style={{ marginBottom: 14 }}>{error}</div>}
      {loading && <div className="muted">Cargando…</div>}

      {!loading && agenda.length === 0 && (
        <div className="card"><div className="muted">No tienes ordenes asignadas.</div></div>
      )}

      {agenda.map((o) => (
        <Link key={o.id} to={`/ordenes/${o.id}`} className="ot-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
            <strong className="mono">{o.codigo} — {o.tipoServicio}</strong>
            <EstadoBadge estado={o.estado} />
          </div>
          <div className="muted" style={{ marginTop: 4 }}>
            {o.cliente} · {o.sede} · {o.equipo}
          </div>
          <div className="muted">
            Prog: <span className="mono">{o.fechaProgramada}</span> · Prioridad: {o.prioridad}
          </div>
        </Link>
      ))}
    </div>
  )
}
