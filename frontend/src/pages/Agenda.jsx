import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAgenda } from '../api/ordenes'
import { getTecnicos } from '../api/catalogos'
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

export default function Agenda() {
  const user = safeUser()
  const soloPropia = user.role === 'TECNICO'
  const [tecnicos, setTecnicos] = useState([])
  const [tecnicoId, setTecnicoId] = useState(user.tecnicoId ? String(user.tecnicoId) : '')
  const [agenda, setAgenda] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fFecha, setFFecha] = useState('')

  useEffect(() => {
    // Tecnicos: el catalogo es solo ADMIN; el tecnico ve unicamente su agenda
    if (soloPropia) return
    getTecnicos().then((t) => setTecnicos(t || [])).catch(() => {})
  }, [])

  useEffect(() => {
    if (!tecnicoId) { setAgenda([]); return }
    setLoading(true)
    setError('')
    getAgenda(tecnicoId)
      .then((a) => setAgenda(Array.isArray(a) ? a : []))
      .catch((err) => setError(err.message || 'No se pudo cargar la agenda'))
      .finally(() => setLoading(false))
  }, [tecnicoId])

  const filtrada = fFecha ? agenda.filter((o) => o.fechaProgramada === fFecha) : agenda
  const tecSel = tecnicos.find((t) => String(t.id) === String(tecnicoId))

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="mono kicker">OPERACION · AGENDA</div>
          <h1 className="page-title">Agenda del tecnico</h1>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="filters">
          <label className="form-row">
            Tecnico
            <select
              value={tecnicoId}
              onChange={(e) => setTecnicoId(e.target.value)}
              disabled={soloPropia}
            >
              <option value="">Seleccionar…</option>
              {soloPropia && user.tecnicoId != null && (
                <option value={user.tecnicoId}>Mi agenda ({user.username})</option>
              )}
              {!soloPropia && tecnicos.map((t) => (
                <option key={t.id} value={t.id}>{t.nombre}</option>
              ))}
            </select>
          </label>
          <label className="form-row">
            Filtrar por fecha
            <input type="date" value={fFecha} onChange={(e) => setFFecha(e.target.value)} />
          </label>
        </div>
        {tecSel && (
          <div className="muted">
            {tecSel.nombre} · {(tecSel.especialidades || []).join(', ') || 'sin especialidades'} ·{' '}
            {tecSel.disponible ? 'disponible' : 'ocupado'} · {filtrada.length} OT(s)
          </div>
        )}
      </div>

      {error && <div className="error-box" style={{ marginBottom: 14 }}>{error}</div>}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Fecha prog.</th>
              <th>Codigo</th>
              <th>Servicio</th>
              <th>Cliente / Sede</th>
              <th>Prioridad</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={6} className="muted">Cargando…</td></tr>
            )}
            {!loading && !tecnicoId && (
              <tr><td colSpan={6} className="muted">Selecciona un tecnico.</td></tr>
            )}
            {!loading && tecnicoId && filtrada.length === 0 && (
              <tr><td colSpan={6} className="muted">Sin OTs asignadas.</td></tr>
            )}
            {filtrada.map((o) => (
              <tr key={o.id}>
                <td className="mono">{o.fechaProgramada}</td>
                <td className="mono"><Link to={`/ordenes/${o.id}`}>{o.codigo}</Link></td>
                <td>{o.tipoServicio}</td>
                <td className="muted">{o.cliente} · {o.sede}</td>
                <td>{o.prioridad}</td>
                <td><EstadoBadge estado={o.estado} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
