import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getOrdenById, getTrazabilidad, updateEstado } from '../api/ordenes'

const ESTADO_COLORS = {
  pendiente: { bg: '#fef3c7', text: '#92400e' },
  asignada: { bg: '#dbeafe', text: '#1e40af' },
  enCamino: { bg: '#e0e7ff', text: '#3730a3' },
  enEjecucion: { bg: '#d1fae5', text: '#065f46' },
  pendienteConformidad: { bg: '#fce7f3', text: '#9d174d' },
  finalizada: { bg: '#e5e7eb', text: '#374151' },
  reprogramada: { bg: '#fed7aa', text: '#9a3412' }
}

const ESTADO_LABEL = {
  pendiente: 'Pendiente',
  asignada: 'Asignada',
  enCamino: 'En camino',
  enEjecucion: 'En ejecución',
  pendienteConformidad: 'Pend. conformidad',
  finalizada: 'Finalizada',
  reprogramada: 'Reprogramada'
}

const TRANSICIONES = {
  pendiente: ['asignada'],
  asignada: ['enCamino', 'reprogramada'],
  enCamino: ['enEjecucion', 'reprogramada'],
  enEjecucion: ['pendienteConformidad', 'reprogramada'],
  pendienteConformidad: ['finalizada', 'reprogramada'],
  reprogramada: ['pendiente'],
  finalizada: []
}

export default function DetalleOrden() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [orden, setOrden] = useState(null)
  const [trazabilidad, setTrazabilidad] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updating, setUpdating] = useState(false)

  async function load() {
    setError('')
    try {
      const [data, traz] = await Promise.all([
        getOrdenById(id),
        getTrazabilidad(id)
      ])
      setOrden(data)
      setTrazabilidad(traz.filter((t) => t.id !== data.id))
    } catch (err) {
      setError(err.message || 'Error al cargar la orden')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  async function handleCambiarEstado(nuevoEstado) {
    setUpdating(true)
    setError('')
    try {
      await updateEstado(id, nuevoEstado)
      await load()
    } catch (err) {
      setError(err.message || 'Error al cambiar estado')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) return <div className="muted">Cargando detalle…</div>
  if (error && !orden) return <div className="error-box">{error}</div>
  if (!orden) return <div className="muted">Orden no encontrada.</div>

  const ec = ESTADO_COLORS[orden.estado] || { bg: '#e5e7eb', text: '#374151' }
  const transiciones = TRANSICIONES[orden.estado] || []

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="mono kicker">DETALLE DE ORDEN</div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {orden.codigo}
            <span style={{
              display: 'inline-block', padding: '4px 14px', borderRadius: 20,
              fontSize: 13, fontWeight: 600, background: ec.bg, color: ec.text
            }}>
              {ESTADO_LABEL[orden.estado]}
            </span>
          </h1>
        </div>
        <div className="head-actions">
          <Link to="/ordenes" className="btn btn-outline">← Volver</Link>
        </div>
      </div>

      {error && <div className="error-box" style={{ marginBottom: 14 }}>{error}</div>}

      {/* Info principal */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div className="card">
          <div className="mono kicker" style={{ marginBottom: 8 }}>UBICACIÓN</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div>
              <div className="mono muted" style={{ fontSize: 11 }}>CLIENTE</div>
              <div style={{ fontWeight: 600 }}>{orden.cliente || '—'}</div>
            </div>
            <div>
              <div className="mono muted" style={{ fontSize: 11 }}>SEDE</div>
              <div style={{ fontWeight: 600 }}>{orden.sede || '—'}</div>
            </div>
            <div>
              <div className="mono muted" style={{ fontSize: 11 }}>EQUIPO</div>
              <div style={{ fontWeight: 600 }}>{orden.equipo || '—'}</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="mono kicker" style={{ marginBottom: 8 }}>SERVICIO</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div>
              <div className="mono muted" style={{ fontSize: 11 }}>TÉCNICO</div>
              <div style={{ fontWeight: 600 }}>{orden.tecnico || 'Sin asignar'}</div>
            </div>
            <div>
              <div className="mono muted" style={{ fontSize: 11 }}>TIPO DE SERVICIO</div>
              <div>{orden.tipoServicio}</div>
            </div>
            <div>
              <div className="mono muted" style={{ fontSize: 11 }}>PRIORIDAD</div>
              <div style={{ fontWeight: 600, textTransform: 'capitalize' }}>{orden.prioridad}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Fechas y duración */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="mono kicker" style={{ marginBottom: 8 }}>FECHAS</div>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <div>
            <div className="mono muted" style={{ fontSize: 11 }}>CREACIÓN</div>
            <div>{orden.fechaCreacion || '—'}</div>
          </div>
          <div>
            <div className="mono muted" style={{ fontSize: 11 }}>PROGRAMADA</div>
            <div style={{ fontWeight: 600 }}>{orden.fechaProgramada || '—'}</div>
          </div>
          <div>
            <div className="mono muted" style={{ fontSize: 11 }}>DURACIÓN EST.</div>
            <div>{orden.duracionEstimadaMin ? `${orden.duracionEstimadaMin} min` : '—'}</div>
          </div>
        </div>
      </div>

      {/* Descripción y notas */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="mono kicker" style={{ marginBottom: 8 }}>DESCRIPCIÓN</div>
        <div style={{ marginBottom: 12 }}>{orden.descripcion}</div>
        {orden.notas && (
          <>
            <div className="mono kicker" style={{ marginBottom: 8 }}>NOTAS TÉCNICAS</div>
            <div style={{ color: 'var(--muted)' }}>{orden.notas}</div>
          </>
        )}
      </div>

      {/* Checklist */}
      {orden.checklist && orden.checklist.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="mono kicker" style={{ marginBottom: 8 }}>
            CHECKLIST ({orden.checklist.filter((c) => c.hecho).length}/{orden.checklist.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {orden.checklist.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  width: 20, height: 20, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700,
                  background: item.hecho ? '#d1fae5' : '#e5e7eb',
                  color: item.hecho ? '#065f46' : '#6b7280'
                }}>
                  {item.hecho ? '✓' : '—'}
                </span>
                <span style={{ textDecoration: item.hecho ? 'line-through' : 'none', opacity: item.hecho ? 0.6 : 1 }}>
                  {item.texto}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Evidencia fotográfica */}
      {orden.fotos && orden.fotos.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="mono kicker" style={{ marginBottom: 8 }}>EVIDENCIA FOTOGRÁFICA</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {orden.fotos.map((url, i) => (
              <div key={i} style={{
                width: 120, height: 120, borderRadius: 8, overflow: 'hidden',
                border: '1px solid var(--border)', background: '#f3f4f6',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'var(--muted)'
              }}>
                {url.startsWith('http') ? (
                  <img src={url} alt={`Evidencia ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span>Foto {i + 1}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Conformidad / Firma */}
      {orden.firmaBase64 && (
        <div className="card" style={{ marginBottom: 16, borderLeft: '3px solid var(--green)' }}>
          <div className="mono kicker" style={{ marginBottom: 8 }}>CONFORMIDAD DEL CLIENTE</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              padding: '12px 16px', borderRadius: 8, background: '#f0fdf4',
              border: '1px solid #bbf7d0', fontWeight: 600, color: '#166534'
            }}>
              ✓ Firmado
            </div>
            {orden.firmaBase64.startsWith('data:') ? (
              <img src={orden.firmaBase64} alt="Firma" style={{ height: 60, borderRadius: 4 }} />
            ) : (
              <span className="muted" style={{ fontSize: 12 }}>Firma registrada</span>
            )}
          </div>
        </div>
      )}

      {/* Acciones de estado */}
      {transiciones.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="mono kicker" style={{ marginBottom: 8 }}>CAMBIAR ESTADO</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {transiciones.map((t) => (
              <button
                key={t}
                className="btn btn-outline"
                disabled={updating}
                onClick={() => handleCambiarEstado(t)}
              >
                {ESTADO_LABEL[t]}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Historial */}
      {orden.historial && orden.historial.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="mono kicker" style={{ marginBottom: 8 }}>HISTORIAL DE LA ORDEN</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {orden.historial.map((h, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13 }}>
                <span style={{ color: 'var(--blue)', fontWeight: 700, minWidth: 20 }}>→</span>
                <span style={{ color: 'var(--muted)' }}>{h}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trazabilidad del equipo (otras OTs del mismo equipo) */}
      {trazabilidad.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="mono kicker" style={{ marginBottom: 8 }}>
            HISTORIAL DEL EQUIPO ({trazabilidad.length} intervenciones anteriores)
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Tipo</th>
                  <th>Técnico</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {trazabilidad.map((t) => {
                  const tec = ESTADO_COLORS[t.estado] || { bg: '#e5e7eb', text: '#374151' }
                  return (
                    <tr key={t.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/ordenes/${t.id}`)}>
                      <td className="mono" style={{ fontWeight: 600 }}>{t.codigo}</td>
                      <td>{t.tipoServicio}</td>
                      <td>{t.tecnico || '—'}</td>
                      <td className="muted">{t.fechaProgramada || '—'}</td>
                      <td>
                        <span style={{
                          display: 'inline-block', padding: '2px 8px', borderRadius: 12,
                          fontSize: 11, fontWeight: 600, background: tec.bg, color: tec.text
                        }}>
                          {ESTADO_LABEL[t.estado]}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
