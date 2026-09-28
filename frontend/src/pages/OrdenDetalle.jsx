import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import SignatureCanvas from 'react-signature-canvas'
import {
  getOrden, updateEstado, asignarTecnico, agendar, registrarEvidencia,
  guardarConformidad, getTrazabilidad, TRANSICIONES,
} from '../api/ordenes'
import { getTecnicos } from '../api/catalogos'
import { mutar, isNetworkError } from '../api/offline'
import { EstadoBadge } from './Ordenes'
import FotoUpload from './FotoUpload'

function safeUser() {
  try {
    const raw = localStorage.getItem('ff_user')
    if (!raw || raw === 'undefined' || raw === 'null') return {}
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

function stamp() {
  return new Date().toISOString().slice(0, 16).replace('T', ' ')
}

export default function OrdenDetalle() {
  const { id } = useParams()
  const user = safeUser()
  const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN'
  const [ot, setOt] = useState(null)
  const [traza, setTraza] = useState([])
  const [tecnicos, setTecnicos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  const [checklist, setChecklist] = useState([])
  const [notas, setNotas] = useState('')
  const [notaNueva, setNotaNueva] = useState('')
  const [fotos, setFotos] = useState([])
  const [notasFinales, setNotasFinales] = useState('')
  const sigRef = useRef(null)

  const load = useCallback(async () => {
    setError('')
    setLoading(true)
    try {
      const [orden, traz] = await Promise.all([getOrden(id), getTrazabilidad(id)])
      setOt(orden)
      setTraza(Array.isArray(traz) ? traz : [])
      setChecklist(orden.checklist || [])
      setNotas(orden.notas || '')
      setFotos(orden.fotos || [])
      if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
        try {
          setTecnicos(await getTecnicos())
        } catch {
          setTecnicos([])
        }
      }
    } catch (err) {
      setError(isNetworkError(err) ? 'Sin conexion: no se pudo cargar la OT' : (err.message || 'No se pudo cargar la OT'))
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  async function run(fn, okMsg) {
    setError('')
    setMsg('')
    setBusy(true)
    try {
      await fn()
      setMsg(okMsg)
      await load()
    } catch (err) {
      setError(err.message || 'Operacion fallida')
    } finally {
      setBusy(false)
    }
  }

  function cambiarEstado(nuevo) {
    runMut('PUT', `/api/ordenes/${id}/estado`, { estado: nuevo }, `Estado cambiado a ${nuevo}`)
  }

  async function runMut(method, path, bodyObj, okMsg) {
    setError('')
    setMsg('')
    setBusy(true)
    try {
      const res = await mutar(method, path, bodyObj, `${method} ${path}`)
      if (res && res._queued) {
        setMsg('Sin conexion: cambio encolado, se sincroniza solo')
      } else {
        setMsg(okMsg)
        await load()
      }
    } catch (err) {
      setError(err.message || 'Operacion fallida')
    } finally {
      setBusy(false)
    }
  }

  function cambiarTecnico(tecnicoId) {
    run(
      () => asignarTecnico(id, tecnicoId === '' ? null : Number(tecnicoId)),
      tecnicoId === '' ? 'Tecnico desasignado' : 'Tecnico asignado'
    )
  }

  function guardarChecklist() {
    runMut('PUT', `/api/ordenes/${id}/evidencia`, { notas, checklist, fotos }, 'Checklist guardado')
  }

  function guardarNotasFotos() {
    runMut('PUT', `/api/ordenes/${id}/evidencia`, { notas, checklist, fotos }, 'Evidencia guardada')
  }

  function agregarNota() {
    const t = notaNueva.trim()
    if (!t) return
    setNotas((n) => (n ? `${n}\n[${stamp()}] ${t}` : `[${stamp()}] ${t}`))
    setNotaNueva('')
  }

  function firmar() {
    if (!sigRef.current || sigRef.current.isEmpty()) {
      setError('Dibuja la firma del cliente antes de guardar')
      return
    }
    if (!notasFinales.trim()) {
      setError('Escribe las notas finales de conformidad')
      return
    }
    const firma = sigRef.current.toDataURL('image/png')
    if (firma.length > 48000) {
      setError('Firma muy pesada: haz un trazo mas simple e intenta de nuevo')
      return
    }
    runMut('POST', `/api/ordenes/${id}/conformidad`,
      { notas: notasFinales.trim(), firma },
      'OT finalizada con conformidad')
  }

  if (loading) return <div className="muted">Cargando OT…</div>
  if (!ot) return <div className="error-box">{error || 'OT no encontrada'}</div>

  const siguientes = TRANSICIONES[ot.estado] || []
  const puedeConformidad = ot.estado === 'pendienteConformidad'

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="mono kicker">ORDEN · {ot.codigo}</div>
          <h1 className="page-title">{ot.tipoServicio}</h1>
        </div>
        <div className="head-actions">
          <Link to="/ordenes/nueva" className="btn btn-outline">
            + Crear orden
          </Link>
          <EstadoBadge estado={ot.estado} />
        </div>
      </div>

      {error && <div className="error-box" style={{ marginBottom: 14 }}>{error}</div>}
      {msg && <div className="ok-box" style={{ marginBottom: 14 }}>{msg}</div>}

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="mono kicker" style={{ marginBottom: 10 }}>Ficha</div>
        <div className="info-grid">
          <div><div className="muted">Cliente</div><strong>{ot.cliente}</strong></div>
          <div><div className="muted">Sede</div><strong>{ot.sede}</strong></div>
          <div><div className="muted">Equipo</div><strong>{ot.equipo}{isAdmin && ot.equipoId != null && <> · <Link to={`/equipos/${ot.equipoId}`}>ver ficha</Link></>}</strong></div>
          <div>
            <div className="muted">Tecnico</div>
            {isAdmin ? (
              <select
                value={(tecnicos.find((t) => t.nombre === ot.tecnico) || {}).id || ''}
                onChange={(e) => cambiarTecnico(e.target.value)}
                disabled={busy}
                style={{ marginTop: 4 }}
              >
                <option value="">Sin asignar</option>
                {tecnicos.map((t) => (
                  <option key={t.id} value={t.id}>{t.nombre}{t.disponible ? '' : ' (ocupado)'}</option>
                ))}
              </select>
            ) : (
              <strong>{ot.tecnico || 'Sin asignar'}</strong>
            )}
          </div>
          <div><div className="muted">Programada</div><strong className="mono">{ot.fechaProgramada}</strong></div>
          <div><div className="muted">Prioridad</div><strong>{ot.prioridad}{ot.duracionEstimadaMin ? ` · ${ot.duracionEstimadaMin} min` : ''}</strong></div>
        </div>
        {isAdmin && (
          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <label className="form-row" style={{ marginBottom: 0 }}>
              Reprogramar fecha
              <input
                type="date"
                min={new Date().toISOString().slice(0, 10)}
                defaultValue={ot.fechaProgramada}
                id="reprog-fecha"
              />
            </label>
            <button
              className="btn btn-outline"
              disabled={busy}
              onClick={() => {
                const v = document.getElementById('reprog-fecha').value
                if (!v) { setError('Elige una fecha'); return }
                run(() => agendar(id, v), `OT reprogramada para ${v}`)
              }}
            >
              Agendar
            </button>
          </div>
        )}
        <p style={{ marginTop: 10 }}>{ot.descripcion}</p>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="mono kicker" style={{ marginBottom: 10 }}>Estado de la intervencion</div>
        {siguientes.length === 0 ? (
          <div className="muted">Estado final: no hay mas transiciones.</div>
        ) : (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {siguientes.map((e) => (
              <button key={e} className="btn btn-outline" disabled={busy} onClick={() => cambiarEstado(e)}>
                → {e}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="mono kicker" style={{ marginBottom: 10 }}>Checklist tecnico</div>
        {(checklist || []).length === 0 && <div className="muted">Sin items.</div>}
        {(checklist || []).map((c, i) => (
          <label key={i} className="check-row">
            <input
              type="checkbox"
              style={{ width: 'auto' }}
              checked={!!c.hecho}
              onChange={() => setChecklist((list) => list.map((x, j) => (j === i ? { ...x, hecho: !x.hecho } : x)))}
            />
            <span style={{ flex: 1, textDecoration: c.hecho ? 'line-through' : 'none' }}>{c.texto}</span>
          </label>
        ))}
        <button className="btn btn-outline" disabled={busy} onClick={guardarChecklist} style={{ marginTop: 8 }}>
          Guardar checklist
        </button>
        <Link to={`/ejecucion?ot=${ot.id}`} className="btn btn-outline" style={{ marginTop: 8, marginLeft: 8 }}>
          Abrir en Ejecucion
        </Link>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="mono kicker" style={{ marginBottom: 10 }}>Notas tecnicas (bitacora)</div>
        {notas ? (
          <div className="notas-log">
            {notas.split('\n').filter((l) => l.trim()).map((l, i) => (
              <div key={i} className="nota-linea">{l}</div>
            ))}
          </div>
        ) : (
          <div className="muted" style={{ marginBottom: 8 }}>Sin notas registradas.</div>
        )}
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <input
            value={notaNueva}
            onChange={(e) => setNotaNueva(e.target.value)}
            placeholder="Agregar nota con fecha y hora…"
            style={{ flex: 1 }}
            onKeyDown={(e) => { if (e.key === 'Enter') agregarNota() }}
          />
          <button type="button" className="btn btn-outline" onClick={agregarNota}>
            Agregar
          </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="mono kicker" style={{ marginBottom: 10 }}>Evidencia fotografica</div>
        <FotoUpload fotos={fotos} onChange={setFotos} onError={setError} />
        <button className="btn btn-outline" disabled={busy} onClick={guardarNotasFotos} style={{ marginTop: 10 }}>
          Guardar evidencia
        </button>
        <div className="muted" style={{ marginTop: 6, fontSize: 12 }}>
          Las fotos se comprimen en tu dispositivo antes de subirse.
        </div>
      </div>

      {puedeConformidad && (
        <div className="card" style={{ marginBottom: 14, borderTop: '3px solid var(--green)' }}>
          <div className="mono kicker" style={{ marginBottom: 10 }}>Conformidad del cliente</div>
          <label className="form-row">
            Notas finales *
            <textarea rows={3} value={notasFinales} onChange={(e) => setNotasFinales(e.target.value)} placeholder="Trabajo recibido a satisfaccion, pendientes, etc." />
          </label>
          <div className="muted" style={{ marginBottom: 6 }}>Firma del cliente *</div>
          <SignatureCanvas
            ref={sigRef}
            canvasProps={{ width: 300, height: 150, className: 'sig-canvas' }}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button type="button" className="btn btn-outline" onClick={() => sigRef.current && sigRef.current.clear()}>
              Limpiar
            </button>
            <button type="button" className="btn btn-primary" disabled={busy} onClick={firmar}>
              Guardar conformidad y finalizar
            </button>
          </div>
        </div>
      )}

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="mono kicker" style={{ marginBottom: 10 }}>Historial de la OT</div>
        {(ot.historial || []).map((h, i) => (
          <div key={i} className="mono" style={{ fontSize: 12, padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
            {h}
          </div>
        ))}
      </div>

      <div className="card">
        <div className="mono kicker" style={{ marginBottom: 10 }}>Trazabilidad del equipo</div>
        {traza.length === 0 && <div className="muted">Sin otras OTs para este equipo.</div>}
        {traza.map((t) => (
          <div key={t.id} className="traza-row">
            <span className="mono">{t.codigo}</span>
            <span className="muted">{t.fechaProgramada}</span>
            <EstadoBadge estado={t.estado} />
          </div>
        ))}
      </div>
    </div>
  )
}
