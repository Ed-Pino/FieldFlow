import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  createCliente,
  createEquipo,
  createSede,
  deleteEquipo,
  deleteSede,
  getClientes,
  getEquipos,
  getSedes,
  getTecnicos,
} from '../api/catalogos'

const TABS = [
  { id: 'clientes', label: 'Clientes' },
  { id: 'sedes', label: 'Sedes' },
  { id: 'equipos', label: 'Equipos' },
  { id: 'tecnicos', label: 'Técnicos' },
]

function safeUser() {
  try {
    const user = JSON.parse(localStorage.getItem('ff_user') || '{}')
    return user && typeof user === 'object' ? user : {}
  } catch {
    return {}
  }
}

export default function Catalogos() {
  const isSuperAdmin = safeUser().role === 'SUPER_ADMIN'
  const [tab, setTab] = useState('clientes')
  const [clientes, setClientes] = useState([])
  const [sedes, setSedes] = useState([])
  const [equipos, setEquipos] = useState([])
  const [tecnicos, setTecnicos] = useState([])
  const [selectedClientId, setSelectedClientId] = useState('')
  const [selectedSiteId, setSelectedSiteId] = useState('')
  const [expandedSiteId, setExpandedSiteId] = useState(null)
  const [siteEquipment, setSiteEquipment] = useState({})
  const [showClientForm, setShowClientForm] = useState(false)
  const [showSiteForm, setShowSiteForm] = useState(false)
  const [showEquipmentForm, setShowEquipmentForm] = useState(false)
  const [clientForm, setClientForm] = useState({ nombre: '', nit: '' })
  const [siteForm, setSiteForm] = useState({ clienteId: '', nombre: '', direccion: '', ciudad: '' })
  const [equipmentForm, setEquipmentForm] = useState({
    sedeId: '',
    codigo: '',
    nombre: '',
    tipo: '',
    ultimoMantenimiento: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function load() {
    setError('')
    setLoading(true)
    try {
      const [clientRows, siteRows, technicianRows, equipmentRows] = await Promise.all([
        getClientes(),
        getSedes(),
        getTecnicos(),
        getEquipos(selectedSiteId ? Number(selectedSiteId) : undefined),
      ])
      setClientes(clientRows || [])
      setSedes(siteRows || [])
      setTecnicos(technicianRows || [])
      setEquipos(equipmentRows || [])
    } catch (err) {
      setError(err.message || 'No se pudieron cargar los catálogos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [selectedSiteId])

  async function guardarCliente(event) {
    event.preventDefault()
    setError('')
    setMessage('')
    if (!clientForm.nombre.trim() || !clientForm.nit.trim()) {
      setError('Completa nombre y NIT del cliente')
      return
    }
    setSaving(true)
    try {
      const creado = await createCliente({
        nombre: clientForm.nombre.trim(),
        nit: clientForm.nit.trim(),
      })
      setMessage(`Cliente ${creado.nombre} creado`)
      setClientForm({ nombre: '', nit: '' })
      setShowClientForm(false)
      await load()
    } catch (err) {
      setError(err.message || 'No se pudo crear el cliente')
    } finally {
      setSaving(false)
    }
  }

  async function guardarSede(event) {
    event.preventDefault()
    setError('')
    setMessage('')
    if (!siteForm.clienteId || !siteForm.nombre.trim() || !siteForm.direccion.trim() || !siteForm.ciudad.trim()) {
      setError('Completa cliente, nombre, dirección y ciudad de la sede')
      return
    }
    setSaving(true)
    try {
      const creada = await createSede({
        clienteId: Number(siteForm.clienteId),
        nombre: siteForm.nombre.trim(),
        direccion: siteForm.direccion.trim(),
        ciudad: siteForm.ciudad.trim(),
      })
      setMessage(`Sede ${creada.nombre} creada`)
      setSiteForm({ clienteId: '', nombre: '', direccion: '', ciudad: '' })
      setShowSiteForm(false)
      setSelectedClientId(String(creada.clienteId))
      await load()
    } catch (err) {
      setError(err.message || 'No se pudo crear la sede')
    } finally {
      setSaving(false)
    }
  }

  async function guardarEquipo(event) {
    event.preventDefault()
    setError('')
    setMessage('')
    if (!equipmentForm.sedeId || !equipmentForm.codigo.trim() || !equipmentForm.nombre.trim() || !equipmentForm.tipo.trim()) {
      setError('Completa sede, código, nombre y tipo del equipo')
      return
    }
    setSaving(true)
    try {
      const creado = await createEquipo({
        sedeId: Number(equipmentForm.sedeId),
        codigo: equipmentForm.codigo.trim(),
        nombre: equipmentForm.nombre.trim(),
        tipo: equipmentForm.tipo.trim(),
        ultimoMantenimiento: equipmentForm.ultimoMantenimiento || null,
      })
      setMessage(`Equipo ${creado.codigo} creado`)
      setEquipmentForm({ sedeId: '', codigo: '', nombre: '', tipo: '', ultimoMantenimiento: '' })
      setShowEquipmentForm(false)
      setSelectedSiteId(String(creado.sedeId))
      await load()
    } catch (err) {
      setError(err.message || 'No se pudo crear el equipo')
    } finally {
      setSaving(false)
    }
  }

  async function toggleSite(site) {
    if (expandedSiteId === site.id) {
      setExpandedSiteId(null)
      return
    }
    setExpandedSiteId(site.id)
    if (siteEquipment[site.id]) return
    try {
      const rows = await getEquipos(site.id)
      setSiteEquipment((current) => ({ ...current, [site.id]: rows || [] }))
    } catch (err) {
      setError(err.message || 'No se pudieron cargar los equipos de la sede')
    }
  }

  async function removeSite(id) {
    setError('')
    try {
      await deleteSede(id)
      setMessage('Sede eliminada')
      setSiteEquipment((current) => {
        const next = { ...current }
        delete next[id]
        return next
      })
      await load()
    } catch (err) {
      setError(err.message || 'No se pudo eliminar la sede')
    }
  }

  async function removeEquipment(id) {
    setError('')
    try {
      await deleteEquipo(id)
      setMessage('Equipo eliminado')
      await load()
      if (expandedSiteId) {
        const rows = await getEquipos(expandedSiteId)
        setSiteEquipment((current) => ({ ...current, [expandedSiteId]: rows || [] }))
      }
    } catch (err) {
      setError(err.message || 'No se pudo eliminar el equipo')
    }
  }

  const selectedClient = clientes.find((client) => String(client.id) === selectedClientId)
  const visibleSites = selectedClientId
    ? sedes.filter((site) => String(site.clienteId) === selectedClientId)
    : sedes

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="mono kicker">ADMIN · CATÁLOGOS · ELECTROSERVICE SRL</div>
          <h1 className="page-title">{selectedClient && tab === 'sedes' ? 'Ficha de cliente' : 'Catálogos'}</h1>
        </div>
        <div className="head-actions">
          <button className="btn btn-outline" disabled={loading} onClick={load}>Recargar</button>
        </div>
      </div>

      <div className="tabs">
        {TABS.map((item) => (
          <button
            key={item.id}
            className={`tab ${tab === item.id ? 'active' : ''}`}
            style={{ fontFamily: 'var(--font-mono)' }}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {error && <div className="error-box" style={{ marginBottom: 14 }}>{error}</div>}
      {message && <div className="ok-box" style={{ marginBottom: 14 }}>{message}</div>}
      {loading && <div className="muted" style={{ marginBottom: 12 }}>Cargando catálogos…</div>}

      {tab === 'clientes' && (
        <section>
          <button className="btn btn-outline" style={{ marginBottom: 12 }} onClick={() => setShowClientForm((show) => !show)}>
            {showClientForm ? 'Cancelar' : '+ Nuevo cliente'}
          </button>
          {showClientForm && (
            <form onSubmit={guardarCliente} className="card" style={{ marginBottom: 14 }}>
              <div className="form-grid">
                <label className="form-row">
                  Nombre *
                  <input value={clientForm.nombre} onChange={(event) => setClientForm({ ...clientForm, nombre: event.target.value })} required placeholder="Razón social" />
                </label>
                <label className="form-row">
                  NIT *
                  <input value={clientForm.nit} onChange={(event) => setClientForm({ ...clientForm, nit: event.target.value })} required placeholder="900123456" />
                </label>
              </div>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Guardando…' : 'Guardar cliente'}</button>
            </form>
          )}
          <div className="table-wrap">
            <table>
              <thead><tr><th>Cliente</th><th>NIT</th><th>Sedes</th><th></th></tr></thead>
              <tbody>
                {!clientes.length && <tr><td colSpan={4} className="muted">Sin clientes cargados.</td></tr>}
                {clientes.map((client) => (
                  <tr key={client.id}>
                    <td>{client.nombre}</td>
                    <td className="mono">{client.nit}</td>
                    <td>{sedes.filter((site) => site.clienteId === client.id).length}</td>
                    <td><button className="btn-link" onClick={() => { setSelectedClientId(String(client.id)); setTab('sedes') }}>Ver ficha →</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === 'sedes' && (
        <section>
          {selectedClient && (
            <div className="card" style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'flex-start' }}>
                <div>
                  <div className="mono kicker">INFORMACIÓN DEL CLIENTE</div>
                  <h2 style={{ margin: '5px 0' }}>{selectedClient.nombre}</h2>
                  <div className="mono muted">NIT: {selectedClient.nit}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="mono kicker">SEDES</div>
                  <strong style={{ fontSize: 24 }}>{visibleSites.length}</strong>
                </div>
              </div>
              <button className="btn-link" style={{ marginTop: 10 }} onClick={() => setSelectedClientId('')}>Ver todas las sedes</button>
            </div>
          )}
          <div className="filters" style={{ marginBottom: 12 }}>
            <label className="form-row">
              Filtrar por cliente
              <select value={selectedClientId} onChange={(event) => setSelectedClientId(event.target.value)}>
                <option value="">Todos los clientes</option>
                {clientes.map((client) => <option key={client.id} value={client.id}>{client.nombre}</option>)}
              </select>
            </label>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => {
                if (!showSiteForm && selectedClientId) setSiteForm((form) => ({ ...form, clienteId: selectedClientId }))
                setShowSiteForm((show) => !show)
              }}>{showSiteForm ? 'Cancelar' : '+ Nueva sede'}</button>
            </div>
          </div>
          {showSiteForm && (
            <form onSubmit={guardarSede} className="card" style={{ marginBottom: 14 }}>
              <div className="form-grid">
                <label className="form-row">Cliente *
                  <select value={siteForm.clienteId} onChange={(event) => setSiteForm({ ...siteForm, clienteId: event.target.value })} required>
                    <option value="">Seleccionar…</option>
                    {clientes.map((client) => <option key={client.id} value={client.id}>{client.nombre}</option>)}
                  </select>
                </label>
                <label className="form-row">Nombre sede *
                  <input value={siteForm.nombre} onChange={(event) => setSiteForm({ ...siteForm, nombre: event.target.value })} required placeholder="Planta principal" />
                </label>
                <label className="form-row">Dirección *
                  <input value={siteForm.direccion} onChange={(event) => setSiteForm({ ...siteForm, direccion: event.target.value })} required placeholder="Cra 7 # 72-64" />
                </label>
                <label className="form-row">Ciudad *
                  <input value={siteForm.ciudad} onChange={(event) => setSiteForm({ ...siteForm, ciudad: event.target.value })} required placeholder="Bogotá" />
                </label>
              </div>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Guardando…' : 'Guardar sede'}</button>
            </form>
          )}
          <div className="table-wrap">
            <table>
              <thead><tr><th>Sede</th><th>Dirección</th><th>Ciudad</th><th>Equipos</th><th></th></tr></thead>
              <tbody>
                {!visibleSites.length && <tr><td colSpan={5} className="muted">Sin sedes cargadas.</td></tr>}
                {visibleSites.map((site) => (
                  <FragmentSite
                    key={site.id}
                    site={site}
                    expanded={expandedSiteId === site.id}
                    equipment={siteEquipment[site.id]}
                    isSuperAdmin={isSuperAdmin}
                    onToggle={() => toggleSite(site)}
                    onDelete={() => removeSite(site.id)}
                    onDeleteEquipment={removeEquipment}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === 'equipos' && (
        <section>
          <div className="filters" style={{ marginBottom: 12 }}>
            <label className="form-row">Sede
              <select value={selectedSiteId} onChange={(event) => setSelectedSiteId(event.target.value)}>
                <option value="">Todas las sedes</option>
                {sedes.map((site) => <option key={site.id} value={site.id}>{site.nombre}</option>)}
              </select>
            </label>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => {
                if (!showEquipmentForm && selectedSiteId) setEquipmentForm((form) => ({ ...form, sedeId: selectedSiteId }))
                setShowEquipmentForm((show) => !show)
              }}>{showEquipmentForm ? 'Cancelar' : '+ Nuevo equipo'}</button>
            </div>
          </div>
          {showEquipmentForm && (
            <form onSubmit={guardarEquipo} className="card" style={{ marginBottom: 14 }}>
              <div className="form-grid">
                <label className="form-row">Sede *
                  <select value={equipmentForm.sedeId} onChange={(event) => setEquipmentForm({ ...equipmentForm, sedeId: event.target.value })} required>
                    <option value="">Seleccionar…</option>
                    {sedes.map((site) => <option key={site.id} value={site.id}>{site.nombre}</option>)}
                  </select>
                </label>
                <label className="form-row">Código (N/S) *
                  <input value={equipmentForm.codigo} onChange={(event) => setEquipmentForm({ ...equipmentForm, codigo: event.target.value })} required placeholder="CAL-002" />
                </label>
                <label className="form-row">Nombre *
                  <input value={equipmentForm.nombre} onChange={(event) => setEquipmentForm({ ...equipmentForm, nombre: event.target.value })} required placeholder="Caldera industrial" />
                </label>
                <label className="form-row">Tipo *
                  <input value={equipmentForm.tipo} onChange={(event) => setEquipmentForm({ ...equipmentForm, tipo: event.target.value })} required placeholder="Caldera" />
                </label>
                <label className="form-row">Último mantenimiento
                  <input type="date" value={equipmentForm.ultimoMantenimiento} onChange={(event) => setEquipmentForm({ ...equipmentForm, ultimoMantenimiento: event.target.value })} />
                </label>
              </div>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Guardando…' : 'Guardar equipo'}</button>
            </form>
          )}
          <div className="table-wrap">
            <table>
              <thead><tr><th>Equipo</th><th>N/S</th><th>Tipo</th><th>Últ. mantenimiento</th><th></th></tr></thead>
              <tbody>
                {!equipos.length && <tr><td colSpan={5} className="muted">Sin equipos cargados.</td></tr>}
                {equipos.map((equipment) => (
                  <tr key={equipment.id}>
                    <td><Link to={`/equipos/${equipment.id}`}>{equipment.nombre}</Link></td>
                    <td className="mono">{equipment.codigo}</td>
                    <td>{equipment.tipo}</td>
                    <td className="muted">{equipment.ultimoMantenimiento || '—'}</td>
                    <td>{isSuperAdmin && <button className="btn-link danger" onClick={() => removeEquipment(equipment.id)}>Eliminar</button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === 'tecnicos' && (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Técnico</th><th>Especialidades</th><th>Disponible</th></tr></thead>
            <tbody>
              {!tecnicos.length && <tr><td colSpan={3} className="muted">Sin técnicos cargados.</td></tr>}
              {tecnicos.map((technician) => (
                <tr key={technician.id}>
                  <td>{technician.nombre}</td>
                  <td>{(technician.especialidades || []).join(', ') || '—'}</td>
                  <td>{technician.disponible ? <span className="badge ok">Disponible</span> : <span className="badge">Ocupado</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function FragmentSite({ site, expanded, equipment, isSuperAdmin, onToggle, onDelete, onDeleteEquipment }) {
  return (
    <>
      <tr>
        <td><button className="btn-link" onClick={onToggle}>{site.nombre} {expanded ? '▲' : '▼'}</button></td>
        <td className="muted">{site.direccion}</td>
        <td className="muted">{site.ciudad}</td>
        <td>{equipment ? equipment.length : '—'}</td>
        <td>{isSuperAdmin && <button className="btn-link danger" onClick={onDelete}>Eliminar</button>}</td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={5}>
            {!equipment && <span className="muted">Cargando equipos…</span>}
            {equipment && !equipment.length && <span className="muted">Sin equipos en esta sede.</span>}
            {equipment && equipment.length > 0 && (
              <table>
                <thead><tr><th>Equipo</th><th>N/S</th><th>Tipo</th><th>Últ. mantenimiento</th><th></th></tr></thead>
                <tbody>
                  {equipment.map((item) => (
                    <tr key={item.id}>
                      <td><Link to={`/equipos/${item.id}`}>{item.nombre}</Link></td>
                      <td className="mono">{item.codigo}</td>
                      <td>{item.tipo}</td>
                      <td>{item.ultimoMantenimiento || '—'}</td>
                      <td>{isSuperAdmin && <button className="btn-link danger" onClick={() => onDeleteEquipment(item.id)}>Eliminar</button>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </td>
        </tr>
      )}
    </>
  )
}
