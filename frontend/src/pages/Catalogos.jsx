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
  const [counts, setCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sedeSel, setSedeSel] = useState('')
  const [formCliente, setFormCliente] = useState({ nombre: '', nit: '' })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

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
      setCounts({ clientes: cli.length, tecnicos: tec.length })
    } catch (err) {
      setError(err.message || 'No se pudieron cargar los catálogos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [sedeSel])

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="mono kicker">ADMIN · CATÁLOGOS · ELECTROSERVICE SRL</div>
          <h1 className="page-title">Catálogos</h1>
        </div>
        <div className="head-actions">
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
            style={{ fontFamily: 'var(--font-mono)' }}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && <div className="error-box" style={{ marginBottom: 14 }}>{error}</div>}

      {tab === 'clientes' && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>CUIT / DNI</th>
                <th>Sedes</th>
                <th>Equipos</th>
              </tr>
            </thead>
            <tbody>
              {clientes.length === 0 && (
                <tr><td colSpan={4} className="muted">Sin clientes cargados.</td></tr>
              )}
              {clientes.map((c) => (
                <tr key={c.id} onClick={() => (setSedeSel(''), setTab('sedes'))}>
                  <td>{c.nombre}</td>
                  <td className="mono">{c.nit}</td>
                  <td className="muted">—</td>
                  <td className="muted">—</td>
                </tr>
              ))}
            </tbody>
          </table>
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
                <th>Equipos</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sedes.length === 0 && (
                <tr><td colSpan={5} className="muted">Sin sedes cargadas.</td></tr>
              )}
              {sedes.map((s) => (
                <tr key={s.id}>
                  <td>{s.nombre}</td>
                  <td className="muted">{s.direccion}</td>
                  <td className="muted">{s.ciudad}</td>
                  <td className="muted">—</td>
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
