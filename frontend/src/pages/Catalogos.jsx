import { useEffect, useState } from 'react'
import { getClientes, getSedes, getEquipos, getTecnicos, deleteSede, deleteEquipo, createCliente } from '../api/catalogos'

const TABS = [
  { id: 'clientes', label: 'Clientes' },
  { id: 'sedes', label: 'Sedes' },
  { id: 'equipos', label: 'Equipos' },
  { id: 'tecnicos', label: 'Técnicos' }
]

export default function Catalogos() {
  const [tab, setTab] = useState('clientes')
  const [clientes, setClientes] = useState([])
  const [sedes, setSedes] = useState([])
  const [equipos, setEquipos] = useState([])
  const [tecnicos, setTecnicos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sedeSel, setSedeSel] = useState('')
  const [formCliente, setFormCliente] = useState({ nombre: '', nit: '' })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const [clienteSel, setClienteSel] = useState(null)
  const [sedesCliente, setSedesCliente] = useState([])
  const [loadingFicha, setLoadingFicha] = useState(false)
  const [equiposPorSede, setEquiposPorSede] = useState({})
  const [sedeExpandida, setSedeExpandida] = useState(null)

  async function load() {
    setError('')
    try {
      const [cli, tec] = await Promise.all([getClientes(), getTecnicos()])
      setClientes(cli)
      setTecnicos(tec)
      const sedesRes = sedeSel ? await getSedes(Number(sedeSel)) : []
      setSedes(sedesRes)
      const eq = sedeSel ? await getEquipos(Number(sedeSel)) : []
      setEquipos(eq)
    } catch (err) {
      setError(err.message || 'No se pudieron cargar los catálogos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [sedeSel])

  async function abrirFicha(cliente) {
    setClienteSel(cliente)
    setSedeExpandida(null)
    setEquiposPorSede({})
    setLoadingFicha(true)
    try {
      const sedesRes = await getSedes(cliente.id)
      setSedesCliente(sedesRes)
    } catch (err) {
      setError(err.message || 'Error al cargar sedes del cliente')
    } finally {
      setLoadingFicha(false)
    }
  }

  function cerrarFicha() {
    setClienteSel(null)
    setSedesCliente([])
    setEquiposPorSede({})
    setSedeExpandida(null)
  }

  async function toggleSede(sede) {
    if (sedeExpandida === sede.id) {
      setSedeExpandida(null)
      return
    }
    setSedeExpandida(sede.id)
    if (!equiposPorSede[sede.id]) {
      try {
        const eq = await getEquipos(sede.id)
        setEquiposPorSede((prev) => ({ ...prev, [sede.id]: eq }))
      } catch (err) {
        setError(err.message || 'Error al cargar equipos de la sede')
      }
    }
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="mono kicker">ADMIN · CATÁLOGOS · ELECTROSERVICE SRL</div>
          <h1 className="page-title">
            {clienteSel ? `Ficha de Cliente` : 'Catálogos'}
          </h1>
        </div>
        <div className="head-actions">
          {clienteSel && (
            <button className="btn btn-outline" onClick={cerrarFicha}>
              ← Volver a clientes
            </button>
          )}
          <button className="btn btn-outline" disabled={loading} onClick={load}>
            Recargar
          </button>
        </div>
      </div>

      <div className="tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`tab ${tab === t.id ? 'active' : ''}`}
            style={{
              fontFamily: 'var(--font-mono)',
              opacity: clienteSel && t.id !== 'clientes' ? 0.4 : 1,
              pointerEvents: clienteSel && t.id !== 'clientes' ? 'none' : 'auto'
            }}
            onClick={() => { if (!clienteSel) setTab(t.id) }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && <div className="error-box" style={{ marginBottom: 14 }}>{error}</div>}

      {tab === 'clientes' && !clienteSel && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>CUIT / DNI</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {clientes.length === 0 && (
                <tr><td colSpan={3} className="muted">Sin clientes cargados.</td></tr>
              )}
              {clientes.map((c) => (
                <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => abrirFicha(c)}>
                  <td>{c.nombre}</td>
                  <td className="mono">{c.nit}</td>
                  <td>
                    <span className="muted" style={{ fontSize: 13 }}>Ver ficha →</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'clientes' && clienteSel && (
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div className="mono kicker" style={{ marginBottom: 4 }}>INFORMACIÓN DEL CLIENTE</div>
                <h2 style={{ margin: '4px 0' }}>{clienteSel.nombre}</h2>
                <div className="mono muted" style={{ fontSize: 13 }}>CUIT / DNI: {clienteSel.nit}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="mono kicker" style={{ marginBottom: 4 }}>SEDES</div>
                <div style={{ fontSize: 24, fontWeight: 700 }}>{sedesCliente.length}</div>
              </div>
            </div>
          </div>

          {loadingFicha && <div className="muted">Cargando sedes…</div>}

          {!loadingFicha && sedesCliente.length === 0 && (
            <div className="card">
              <div className="muted">Este cliente no tiene sedes registradas.</div>
            </div>
          )}

          {sedesCliente.map((s) => (
            <div key={s.id} className="card" style={{ marginBottom: 12 }}>
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                onClick={() => toggleSede(s)}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>{s.nombre}</div>
                  <div className="muted" style={{ fontSize: 13 }}>
                    {s.direccion}{s.ciudad ? `, ${s.ciudad}` : ''}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="mono muted" style={{ fontSize: 13 }}>
                    {sedeExpandida === s.id ? '▲' : '▼'}
                  </span>
                </div>
              </div>

              {sedeExpandida === s.id && (
                <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                  {!equiposPorSede[s.id] && (
                    <div className="muted" style={{ fontSize: 13 }}>Cargando equipos…</div>
                  )}
                  {equiposPorSede[s.id] && equiposPorSede[s.id].length === 0 && (
                    <div className="muted" style={{ fontSize: 13 }}>Sin equipos en esta sede.</div>
                  )}
                  {equiposPorSede[s.id] && equiposPorSede[s.id].length > 0 && (
                    <table style={{ width: '100%' }}>
                      <thead>
                        <tr>
                          <th>Equipo</th>
                          <th>N/S</th>
                          <th>Tipo</th>
                          <th>Últ. mantenimiento</th>
                        </tr>
                      </thead>
                      <tbody>
                        {equiposPorSede[s.id].map((eq) => (
                          <tr key={eq.id}>
                            <td>{eq.nombre}</td>
                            <td className="mono">{eq.codigo}</td>
                            <td>{eq.tipo}</td>
                            <td className="muted">{eq.ultimoMantenimiento || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'sedes' && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Sede</th>
                <th>Dirección</th>
                <th>Ciudad</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sedes.length === 0 && (
                <tr><td colSpan={4} className="muted">Sin sedes cargadas.</td></tr>
              )}
              {sedes.map((s) => (
                <tr key={s.id}>
                  <td>{s.nombre}</td>
                  <td className="muted">{s.direccion}</td>
                  <td className="muted">{s.ciudad}</td>
                  <td>
                    <button className="btn-link danger" onClick={() => deleteSede(s.id).then(load)}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'equipos' && (
        <div>
          <label className="form-row">
            Sede
            <select value={sedeSel} onChange={(e) => setSedeSel(e.target.value)}>
              <option value="">Todas las sedes</option>
              {sedes.map((s) => (
                <option key={s.id} value={s.id}>{s.nombre}</option>
              ))}
            </select>
          </label>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Equipo</th>
                  <th>N/S</th>
                  <th>Tipo</th>
                  <th>Últ. mantenimiento</th>
                </tr>
              </thead>
              <tbody>
                {equipos.length === 0 && (
                  <tr><td colSpan={4} className="muted">Sin equipos cargados.</td></tr>
                )}
                {equipos.map((e) => (
                  <tr key={e.id}>
                    <td>{e.nombre}</td>
                    <td className="mono">{e.codigo}</td>
                    <td>{e.tipo}</td>
                    <td className="muted">{e.ultimoMantenimiento || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'tecnicos' && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Técnico</th>
                <th>Especialidades</th>
                <th>Disponible</th>
              </tr>
            </thead>
            <tbody>
              {tecnicos.length === 0 && (
                <tr><td colSpan={3} className="muted">Sin técnicos cargados.</td></tr>
              )}
              {tecnicos.map((t) => (
                <tr key={t.id}>
                  <td>{t.nombre}</td>
                  <td>{(t.especialidades || []).join(', ') || '—'}</td>
                  <td>
                    {t.disponible
                      ? <span className="badge ok">Disponible</span>
                      : <span className="badge">Ocupado</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
