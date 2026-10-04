import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createOrden, PRIORIDADES } from '../api/ordenes'
import { getClientes, getSedes, getEquipos, getTecnicos, getTecnicosDisponibles, getChecklists } from '../api/catalogos'

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function norm(s) {
  return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

export default function OrdenNueva() {
  const navigate = useNavigate()
  const [clientes, setClientes] = useState([])
  const [sedes, setSedes] = useState([])
  const [equipos, setEquipos] = useState([])
  const [tecnicos, setTecnicos] = useState([])
  const [plantillas, setPlantillas] = useState([])
  const [soloDisponibles, setSoloDisponibles] = useState(true)
  const [loading, setLoading] = useState(true)
  const [loadingEquipos, setLoadingEquipos] = useState(false)
  const [errorEquipos, setErrorEquipos] = useState('')
  const [intentoCargaEquipos, setIntentoCargaEquipos] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [clienteId, setClienteId] = useState('')
  const [sedeId, setSedeId] = useState('')
  const [equipoId, setEquipoId] = useState('')
  const [tecnicoId, setTecnicoId] = useState('')
  const [tipoServicio, setTipoServicio] = useState('Mantenimiento Preventivo')
  const [descripcion, setDescripcion] = useState('')
  const [fechaProgramada, setFechaProgramada] = useState(todayISO())
  const [prioridad, setPrioridad] = useState('media')
  const [duracion, setDuracion] = useState('')
  const [plantillaId, setPlantillaId] = useState('')
  const [checklist, setChecklist] = useState([])
  const [nuevoItem, setNuevoItem] = useState('')

  useEffect(() => {
    async function init() {
      try {
        const [clis, pls] = await Promise.all([getClientes(), getChecklists()])
        setClientes(clis || [])
        setPlantillas(pls || [])
      } catch (err) {
        setError(err.message || 'No se pudo cargar el formulario')
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  useEffect(() => {
    if (!clienteId) { setSedes([]); setSedeId(''); return }
    getSedes(Number(clienteId)).then((s) => { setSedes(s || []); setSedeId('') }).catch(() => {})
  }, [clienteId])

  useEffect(() => {
    let activo = true
    setEquipos([])
    setEquipoId('')
    setErrorEquipos('')
    if (!sedeId) {
      setLoadingEquipos(false)
      return () => { activo = false }
    }

    setLoadingEquipos(true)
    getEquipos(Number(sedeId))
      .then((rows) => {
        if (!activo) return
        if (!Array.isArray(rows)) throw new Error('La respuesta de equipos no tiene un formato válido')
        setEquipos(rows)
      })
      .catch((err) => {
        if (activo) setErrorEquipos(err.message || 'No se pudieron cargar los equipos')
      })
      .finally(() => {
        if (activo) setLoadingEquipos(false)
      })

    return () => { activo = false }
  }, [sedeId, intentoCargaEquipos])

  useEffect(() => {
    const fn = soloDisponibles ? getTecnicosDisponibles : getTecnicos
    fn().then((t) => {
      setTecnicos(t || [])
      setTecnicoId((prev) => ((t || []).some((x) => String(x.id) === String(prev)) ? prev : ''))
    }).catch(() => {})
  }, [soloDisponibles])

  const equipoSel = useMemo(
    () => equipos.find((e) => String(e.id) === String(equipoId)),
    [equipos, equipoId]
  )

  const plantillasSugeridas = useMemo(() => {
    if (!equipoSel) return plantillas
    const eq = `${norm(equipoSel.nombre)} ${norm(equipoSel.tipo)}`
    const match = plantillas.filter((p) => eq.includes(norm(p.aplicaA)) || norm(p.aplicaA || '').split(' ').some((w) => w && eq.includes(w)))
    return match.length > 0 ? match : plantillas
  }, [plantillas, equipoSel])

  function aplicarPlantilla() {
    const p = plantillas.find((x) => String(x.id) === String(plantillaId))
    if (!p) return
    setChecklist((p.items || []).map((i) => ({ texto: i.texto, hecho: false })))
  }

  function agregarItem() {
    const t = nuevoItem.trim()
    if (!t) return
    setChecklist((c) => [...c, { texto: t, hecho: false }])
    setNuevoItem('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!clienteId || !sedeId || !equipoId) {
      setError('Selecciona cliente, sede y equipo')
      return
    }
    if (!tipoServicio.trim() || !descripcion.trim() || !fechaProgramada) {
      setError('Completa tipo de servicio, descripcion y fecha programada')
      return
    }
    setSaving(true)
    try {
      const payload = {
        tipoServicio: tipoServicio.trim(),
        descripcion: descripcion.trim(),
        clienteId: Number(clienteId),
        sedeId: Number(sedeId),
        equipoId: Number(equipoId),
        tecnicoId: tecnicoId ? Number(tecnicoId) : null,
        fechaProgramada,
        prioridad,
        duracionEstimadaMin: duracion ? Number(duracion) : null,
        checklist,
      }
      const creada = await createOrden(payload)
      navigate(`/ordenes/${creada.id}`)
    } catch (err) {
      setError(err.message || 'No se pudo crear la OT')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="muted">Cargando formulario…</div>

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="mono kicker">ADMIN · NUEVA ORDEN</div>
          <h1 className="page-title">Crear orden de trabajo</h1>
        </div>
      </div>

      {error && <div className="error-box" style={{ marginBottom: 14 }}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="card" style={{ marginBottom: 14 }}>
          <div className="mono kicker" style={{ marginBottom: 10 }}>Ubicacion y equipo</div>
          <div className="form-grid">
            <label className="form-row">
              Cliente *
              <select value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
                <option value="">Seleccionar…</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </label>
            <label className="form-row">
              Sede *
              <select value={sedeId} onChange={(e) => setSedeId(e.target.value)} disabled={!clienteId}>
                <option value="">Seleccionar…</option>
                {sedes.map((s) => (
                  <option key={s.id} value={s.id}>{s.nombre} — {s.ciudad}</option>
                ))}
              </select>
            </label>
            <div className="form-row">
              <label htmlFor="equipoId">Equipo *</label>
              <select id="equipoId" value={equipoId} onChange={(e) => setEquipoId(e.target.value)} disabled={!sedeId || loadingEquipos || !!errorEquipos}>
                <option value="">
                  {loadingEquipos
                    ? 'Cargando equipos…'
                    : errorEquipos
                      ? 'No se pudieron cargar los equipos'
                      : equipos.length
                        ? 'Seleccionar…'
                        : sedeId
                          ? 'No hay equipos en esta sede'
                          : 'Selecciona una sede primero'}
                </option>
                {equipos.map((eq) => (
                  <option key={eq.id} value={eq.id}>{eq.codigo} — {eq.nombre}</option>
                ))}
              </select>
              {errorEquipos && (
                <div className="error-box" role="alert">
                  {errorEquipos}{' '}
                  <button type="button" className="btn-link" onClick={() => setIntentoCargaEquipos((n) => n + 1)}>
                    Reintentar
                  </button>
                </div>
              )}
              {!loadingEquipos && !errorEquipos && sedeId && equipos.length === 0 && (
                <span className="muted">
                  Registra un equipo para esta sede en <Link to="/catalogos">Catálogos</Link>.
                </span>
              )}
            </div>
            <label className="form-row">
              Tecnico
              <select value={tecnicoId} onChange={(e) => setTecnicoId(e.target.value)}>
                <option value="">Sin asignar</option>
                {tecnicos.map((t) => (
                  <option key={t.id} value={t.id}>{t.nombre}{t.disponible ? '' : ' (ocupado)'}</option>
                ))}
              </select>
            </label>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            <input
              type="checkbox"
              style={{ width: 'auto' }}
              checked={soloDisponibles}
              onChange={(e) => setSoloDisponibles(e.target.checked)}
            />
            Solo tecnicos disponibles
          </label>
        </div>

        <div className="card" style={{ marginBottom: 14 }}>
          <div className="mono kicker" style={{ marginBottom: 10 }}>Servicio</div>
          <div className="form-grid">
            <label className="form-row">
              Tipo de servicio *
              <input value={tipoServicio} onChange={(e) => setTipoServicio(e.target.value)} />
            </label>
            <label className="form-row">
              Fecha programada * (hoy o futura)
              <input type="date" value={fechaProgramada} min={todayISO()} onChange={(e) => setFechaProgramada(e.target.value)} />
            </label>
            <label className="form-row">
              Prioridad
              <select value={prioridad} onChange={(e) => setPrioridad(e.target.value)}>
                {PRIORIDADES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </label>
            <label className="form-row">
              Duracion estimada (min)
              <input type="number" min="0" value={duracion} onChange={(e) => setDuracion(e.target.value)} />
            </label>
          </div>
          <label className="form-row">
            Descripcion *
            <textarea rows={3} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Que hay que hacer…" />
          </label>
        </div>

        <div className="card" style={{ marginBottom: 14 }}>
          <div className="mono kicker" style={{ marginBottom: 10 }}>Checklist inicial</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <select value={plantillaId} onChange={(e) => setPlantillaId(e.target.value)} style={{ flex: 1 }}>
              <option value="">Plantilla… {equipoSel ? `(sugeridas para ${equipoSel.tipo})` : ''}</option>
              {plantillasSugeridas.map((p) => (
                <option key={p.id} value={p.id}>{p.codigo} — {p.nombre}</option>
              ))}
            </select>
            <button type="button" className="btn btn-outline" disabled={!plantillaId} onClick={aplicarPlantilla}>
              Aplicar
            </button>
          </div>
          {(checklist || []).map((c, i) => (
            <div key={i} className="check-row">
              <span style={{ flex: 1 }}>{c.texto}</span>
              <button
                type="button"
                className="btn-link danger"
                onClick={() => setChecklist((list) => list.filter((_, j) => j !== i))}
              >
                Quitar
              </button>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <input
              value={nuevoItem}
              onChange={(e) => setNuevoItem(e.target.value)}
              placeholder="Agregar item manual…"
              style={{ flex: 1 }}
            />
            <button type="button" className="btn btn-outline" onClick={agregarItem}>
              Agregar
            </button>
          </div>
        </div>

        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Creando…' : 'Crear OT'}
        </button>
      </form>
    </div>
  )
}
