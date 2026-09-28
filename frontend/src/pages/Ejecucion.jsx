import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getAgenda, getOrden } from '../api/ordenes'
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

function pickActiva(agenda) {
  const enCurso = (agenda || []).filter((o) =>
    ['pendiente', 'asignada', 'enCamino', 'enEjecucion'].includes(o.estado)
  )
  enCurso.sort((a, b) => String(a.fechaProgramada).localeCompare(String(b.fechaProgramada)))
  return enCurso[0] || null
}

export default function Ejecucion() {
  const user = safeUser()
  const [searchParams] = useSearchParams()
  const otParam = searchParams.get('ot')
  const [ot, setOt] = useState(null)
  const [checklist, setChecklist] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const [nuevoTexto, setNuevoTexto] = useState('')
  const [nuevaUnidad, setNuevaUnidad] = useState('')

  async function load() {
    setError('')
    if (user.tecnicoId == null) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      // ?ot=:id permite ejecutar una OT puntual (deep-link desde detalle/agenda)
      if (otParam) {
        const orden = await getOrden(otParam)
        setOt(orden)
        setChecklist(orden.checklist || [])
      } else {
        const a = await getAgenda(user.tecnicoId)
        const activa = pickActiva(Array.isArray(a) ? a : [])
        setOt(activa)
        setChecklist(activa ? activa.checklist || [] : [])
      }
    } catch (err) {
      setError(err.message || 'No se pudo cargar la OT en ejecucion')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const completados = useMemo(
    () => checklist.filter((c) => c.hecho).length,
    [checklist]
  )

  function setItem(i, patch) {
    setChecklist((list) => list.map((x, j) => (j === i ? { ...x, ...patch } : x)))
  }

  function agregarMedicion() {
    const t = nuevoTexto.trim()
    if (!t) return
    setChecklist((list) => [
      ...list,
      { texto: t, hecho: false, unidad: nuevaUnidad.trim() || null, valor: null },
    ])
    setNuevoTexto('')
    setNuevaUnidad('')
  }

  async function guardar() {
    if (!ot) return
    setError('')
    setMsg('')
    setBusy(true)
    try {
      const res = await mutar('PUT', `/api/ordenes/${ot.id}/evidencia`, { checklist }, 'PUT evidencia')
      if (res && res._queued) {
        setMsg('Sin conexion: avance encolado, se sincroniza solo')
      } else {
        setMsg(`Checklist guardado (${completados}/${checklist.length})`)
      }
    } catch (err) {
      setError(isNetworkError(err) ? 'Sin conexion a internet' : (err.message || 'No se pudo guardar'))
    } finally {
      setBusy(false)
    }
  }

  if (user.tecnicoId == null) {
    return (
      <div className="mobile-wrap">
        <div className="mono kicker">TECNICO · EJECUCION</div>
        <h1 className="page-title">Ejecucion</h1>
        <div className="error-box">Tu usuario no tiene tecnico vinculado.</div>
      </div>
    )
  }

  return (
    <div className="mobile-wrap">
      <div className="mono kicker">TECNICO · {user.username}</div>
      <h1 className="page-title">Ejecucion</h1>

      {error && <div className="error-box" style={{ marginBottom: 14 }}>{error}</div>}
      {msg && <div className="ok-box" style={{ marginBottom: 14 }}>{msg}</div>}
      {loading && <div className="muted">Cargando checklist…</div>}

      {!loading && !ot && !error && (
        <div className="card" style={{ textAlign: 'center', padding: '28px 16px' }}>
          <div className="muted">Sin OTs en curso.</div>
          <Link to="/en-camino" className="btn btn-outline" style={{ marginTop: 12 }}>
            Ir a En camino
          </Link>
        </div>
      )}

      {!loading && ot && (
        <>
          <div className="card" style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <strong className="mono">{ot.codigo} — {ot.equipo}</strong>
              <EstadoBadge estado={ot.estado} />
            </div>
            <div className="muted" style={{ marginTop: 4 }}>
              {completados}/{checklist.length} items completados
            </div>
            <div className="progreso">
              <div
                className="progreso-bar"
                style={{ width: checklist.length ? `${Math.round((completados / checklist.length) * 100)}%` : '0%' }}
              />
            </div>
          </div>

          <div className="card" style={{ marginBottom: 14 }}>
            <div className="mono kicker" style={{ marginBottom: 10 }}>Checklist + mediciones</div>
            {checklist.length === 0 && (
              <div className="muted" style={{ marginBottom: 8 }}>Sin items: agrega mediciones abajo.</div>
            )}
            {checklist.map((c, i) => (
              <div key={i} className="medicion-row">
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flex: 1 }}>
                  <input
                    type="checkbox"
                    style={{ width: 22, height: 22, marginTop: 2 }}
                    checked={!!c.hecho}
                    onChange={() => setItem(i, { hecho: !c.hecho })}
                  />
                  <span style={{ flex: 1 }}>
                    <span style={{ textDecoration: c.hecho ? 'line-through' : 'none' }}>{c.texto}</span>
                    {c.unidad && <span className="mono muted"> · {c.unidad}</span>}
                  </span>
                </label>
                {c.unidad && (
                  <input
                    className="medicion-valor"
                    value={c.valor || ''}
                    onChange={(e) => setItem(i, { valor: e.target.value })}
                    placeholder={`Valor (${c.unidad})`}
                    inputMode="decimal"
                  />
                )}
              </div>
            ))}
            <div className="mono kicker" style={{ margin: '14px 0 8px' }}>Agregar medicion</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input
                value={nuevoTexto}
                onChange={(e) => setNuevoTexto(e.target.value)}
                placeholder="Que se midio…"
                style={{ flex: '2 1 160px' }}
              />
              <input
                value={nuevaUnidad}
                onChange={(e) => setNuevaUnidad(e.target.value)}
                placeholder="Unidad (psi, °C…)"
                style={{ flex: '1 1 110px' }}
              />
              <button type="button" className="btn btn-outline" onClick={agregarMedicion}>
                +
              </button>
            </div>
          </div>

          <div className="action-bar">
            <button className="btn btn-primary btn-big" disabled={busy} onClick={guardar}>
              {busy ? 'Guardando…' : `Guardar avance (${completados}/${checklist.length})`}
            </button>
            <Link to={`/ordenes/${ot.id}`} className="btn btn-outline btn-block">
              Ir al detalle (fotos, notas, firma)
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
