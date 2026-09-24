import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getClientes, getSedes, getEquipos, getTecnicos } from '../api/catalogos'
import { createOrden } from '../api/ordenes'

const TIPOS_SERVICIO = ['Correctivo', 'Preventivo', 'Instalación', 'Diagnóstico']
const PRIORIDADES = ['baja', 'media', 'alta', 'urgente']

export default function NuevaOrden() {
  const navigate = useNavigate()

  const [clientes, setClientes] = useState([])
  const [sedes, setSedes] = useState([])
  const [equipos, setEquipos] = useState([])
  const [tecnicos, setTecnicos] = useState([])

  const [clienteId, setClienteId] = useState('')
  const [sedeId, setSedeId] = useState('')
  const [equipoId, setEquipoId] = useState('')
  const [tecnicoId, setTecnicoId] = useState('')
  const [tipoServicio, setTipoServicio] = useState('')
  const [prioridad, setPrioridad] = useState('media')
  const [duracionEstimadaMin, setDuracionEstimadaMin] = useState('')
  const [fechaProgramada, setFechaProgramada] = useState('')
  const [descripcion, setDescripcion] = useState('')

  const [loadingInit, setLoadingInit] = useState(true)
  const [loadingSedes, setLoadingSedes] = useState(false)
  const [loadingEquipos, setLoadingEquipos] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([getClientes(), getTecnicos()])
      .then(([cli, tec]) => { setClientes(cli); setTecnicos(tec) })
      .catch(() => setError('Error al cargar datos iniciales'))
      .finally(() => setLoadingInit(false))
  }, [])

  useEffect(() => {
    if (!clienteId) { setSedes([]); setSedeId(''); return }
    setLoadingSedes(true)
    setSedeId('')
    setEquipos([])
    setEquipoId('')
    getSedes(Number(clienteId))
      .then(setSedes)
      .catch(() => setError('Error al cargar sedes'))
      .finally(() => setLoadingSedes(false))
  }, [clienteId])

  useEffect(() => {
    if (!sedeId) { setEquipos([]); setEquipoId(''); return }
    setLoadingEquipos(true)
    setEquipoId('')
    getEquipos(Number(sedeId))
      .then(setEquipos)
      .catch(() => setError('Error al cargar equipos'))
      .finally(() => setLoadingEquipos(false))
  }, [sedeId])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      await createOrden({
        clienteId: Number(clienteId),
        sedeId: Number(sedeId),
        equipoId: Number(equipoId),
        tecnicoId: tecnicoId ? Number(tecnicoId) : null,
        tipoServicio,
        descripcion,
        prioridad,
        duracionEstimadaMin: duracionEstimadaMin ? Number(duracionEstimadaMin) : null,
        fechaProgramada
      })
      navigate('/ordenes', { replace: true })
    } catch (err) {
      setError(err.message || 'Error al crear la orden')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="mono kicker">ADMIN · ÓRDENES DE TRABAJO</div>
          <h1 className="page-title">Nueva Orden de Trabajo</h1>
        </div>
        <div className="head-actions">
          <button className="btn btn-outline" onClick={() => navigate('/ordenes')}>
            ← Volver
          </button>
        </div>
      </div>

      {error && <div className="error-box" style={{ marginBottom: 14 }}>{error}</div>}

      {loadingInit ? (
        <div className="muted">Cargando datos…</div>
      ) : (
        <form onSubmit={handleSubmit} style={{ maxWidth: 600 }}>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="mono kicker" style={{ marginBottom: 12 }}>UBICACIÓN</div>

            <label className="form-row">
              Cliente *
              <select value={clienteId} onChange={(e) => setClienteId(e.target.value)} required>
                <option value="">Seleccionar cliente…</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </label>

            <label className="form-row">
              Sede *
              <select
                value={sedeId}
                onChange={(e) => setSedeId(e.target.value)}
                required
                disabled={!clienteId || loadingSedes}
              >
                <option value="">
                  {loadingSedes ? 'Cargando sedes…' : 'Seleccionar sede…'}
                </option>
                {sedes.map((s) => (
                  <option key={s.id} value={s.id}>{s.nombre}</option>
                ))}
              </select>
            </label>

            <label className="form-row">
              Equipo *
              <select
                value={equipoId}
                onChange={(e) => setEquipoId(e.target.value)}
                required
                disabled={!sedeId || loadingEquipos}
              >
                <option value="">
                  {loadingEquipos ? 'Cargando equipos…' : 'Seleccionar equipo…'}
                </option>
                {equipos.map((eq) => (
                  <option key={eq.id} value={eq.id}>{eq.nombre} ({eq.codigo})</option>
                ))}
              </select>
            </label>
          </div>

          <div className="card" style={{ marginBottom: 16 }}>
            <div className="mono kicker" style={{ marginBottom: 12 }}>DETALLE DEL SERVICIO</div>

            <label className="form-row">
              Tipo de servicio *
              <select value={tipoServicio} onChange={(e) => setTipoServicio(e.target.value)} required>
                <option value="">Seleccionar…</option>
                {TIPOS_SERVICIO.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </label>

            <label className="form-row">
              Prioridad
              <select value={prioridad} onChange={(e) => setPrioridad(e.target.value)}>
                {PRIORIDADES.map((p) => (
                  <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                ))}
              </select>
            </label>

            <label className="form-row">
              Fecha programada *
              <input
                type="date"
                value={fechaProgramada}
                onChange={(e) => setFechaProgramada(e.target.value)}
                required
              />
            </label>

            <label className="form-row">
              Duración estimada (minutos)
              <input
                type="number"
                min="0"
                value={duracionEstimadaMin}
                onChange={(e) => setDuracionEstimadaMin(e.target.value)}
                placeholder="Ej: 120"
              />
            </label>

            <label className="form-row">
              Descripción *
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                required
                rows={4}
                placeholder="Describe el trabajo a realizar…"
                style={{ resize: 'vertical' }}
              />
            </label>
          </div>

          <div className="card" style={{ marginBottom: 16 }}>
            <div className="mono kicker" style={{ marginBottom: 12 }}>ASIGNACIÓN</div>

            <label className="form-row">
              Técnico (opcional)
              <select value={tecnicoId} onChange={(e) => setTecnicoId(e.target.value)}>
                <option value="">Sin asignar</option>
                {tecnicos.map((t) => (
                  <option key={t.id} value={t.id}>{t.nombre}</option>
                ))}
              </select>
            </label>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Creando…' : 'Crear Orden de Trabajo'}
            </button>
            <button type="button" className="btn btn-outline" onClick={() => navigate('/ordenes')}>
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
