import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAgenda, TRANSICIONES } from '../api/ordenes'
import { mutar, isNetworkError } from '../api/offline'
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

// Primer estado "en curso" segun fecha programada (lo mas proximo primero)
function pickActiva(agenda) {
  const enCurso = (agenda || []).filter((o) =>
    ['pendiente', 'asignada', 'enCamino', 'enEjecucion'].includes(o.estado)
  )
  enCurso.sort((a, b) => String(a.fechaProgramada).localeCompare(String(b.fechaProgramada)))
  return enCurso[0] || null
}

const ACCION_LABEL = {
  enCamino: 'Estoy en camino',
  enEjecucion: 'Iniciar ejecucion',
  pendienteConformidad: 'Pedir conformidad',
  reprogramada: 'Reprogramar',
  asignada: 'Tomar OT',
  pendiente: 'Volver a pendiente',
  finalizada: 'Finalizar',
}

export default function EnCamino() {
  const user = safeUser()
  const [agenda, setAgenda] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  async function load() {
    setError('')
    if (user.tecnicoId == null) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const a = await getAgenda(user.tecnicoId)
      setAgenda(Array.isArray(a) ? a : [])
    } catch (err) {
      setError(err.message || 'No se pudo cargar tu agenda')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const activa = useMemo(() => pickActiva(agenda), [agenda])
  const siguientes = activa ? TRANSICIONES[activa.estado] || [] : []
  const proximas = useMemo(
    () => (agenda || []).filter((o) => o.estado !== 'finalizada' && (!activa || o.id !== activa.id)).slice(0, 3),
    [agenda, activa]
  )

  async function avanzar(nuevo) {
    if (!activa) return
    setError('')
    setMsg('')
    setBusy(true)
    try {
      const res = await mutar('PUT', `/api/ordenes/${activa.id}/estado`, { estado: nuevo }, `PUT estado ${nuevo}`)
      if (res && res._queued) {
        setMsg('Sin conexion: cambio encolado, se sincroniza solo')
      } else {
        setMsg(`OT ${activa.codigo}: ahora ${nuevo}`)
        await load()
      }
    } catch (err) {
      setError(isNetworkError(err) ? 'Sin conexion a internet' : (err.message || 'No se pudo cambiar el estado'))
    } finally {
      setBusy(false)
    }
  }

  if (user.tecnicoId == null) {
    return (
      <div className="mobile-wrap">
        <div className="mono kicker">TECNICO · EN CAMINO</div>
        <h1 className="page-title">En camino</h1>
        <div className="error-box">
          Tu usuario no tiene tecnico vinculado. Pide al administrador que vincule tu cuenta.
        </div>
      </div>
    )
  }

  return (
    <div className="mobile-wrap">
      <div className="mono kicker">TECNICO · {user.username}</div>
      <h1 className="page-title">En camino</h1>

      {error && <div className="error-box" style={{ marginBottom: 14 }}>{error}</div>}
      {msg && <div className="ok-box" style={{ marginBottom: 14 }}>{msg}</div>}
      {loading && <div className="muted">Buscando tu proxima OT…</div>}

      {!loading && !activa && !error && (
        <div className="card" style={{ textAlign: 'center', padding: '28px 16px' }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>✓</div>
          <div className="muted">Sin OTs en curso. Buen trabajo.</div>
          <Link to="/mis-ordenes" className="btn btn-outline" style={{ marginTop: 12 }}>
            Ver mis ordenes
          </Link>
        </div>
      )}

      {!loading && activa && (
        <>
          <div className="card ot-activa">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <strong className="mono" style={{ fontSize: 16 }}>{activa.codigo}</strong>
              <EstadoBadge estado={activa.estado} />
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, marginTop: 6 }}>{activa.tipoServicio}</div>
            <div className="destino">
              <div><span className="muted">Cliente · </span><strong>{activa.cliente}</strong></div>
              <div><span className="muted">Sede · </span><strong>{activa.sede}</strong></div>
              <div><span className="muted">Equipo · </span><strong>{activa.equipo}</strong></div>
              <div><span className="muted">Programada · </span><strong className="mono">{activa.fechaProgramada}</strong></div>
            </div>
            <Link to={`/ordenes/${activa.id}`} className="btn btn-outline btn-block">
              Ver detalle y checklist
            </Link>
            <Link to="/ejecucion" className="btn btn-primary btn-block" style={{ marginTop: 8 }}>
              ▶ Ejecutar checklist
            </Link>
          </div>

          <div className="action-bar">
            {siguientes.length === 0 && (
              <div className="muted" style={{ textAlign: 'center' }}>Sin mas acciones.</div>
            )}
            {siguientes.map((e) => (
              <button
                key={e}
                className={`btn btn-big ${e === 'reprogramada' ? 'btn-outline' : 'btn-primary'}`}
                disabled={busy}
                onClick={() => avanzar(e)}
              >
                {ACCION_LABEL[e] || e}
              </button>
            ))}
          </div>

          {proximas.length > 0 && (
            <div className="card" style={{ marginTop: 14 }}>
              <div className="mono kicker" style={{ marginBottom: 8 }}>SIGUIENTES</div>
              {proximas.map((o) => (
                <Link key={o.id} to={`/ordenes/${o.id}`} className="traza-row" style={{ textDecoration: 'none', color: 'inherit' }}>
                  <span className="mono">{o.codigo}</span>
                  <span className="muted">{o.fechaProgramada}</span>
                  <EstadoBadge estado={o.estado} />
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
