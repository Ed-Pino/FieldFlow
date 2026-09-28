import { useState } from 'react'
import { useOnline, syncPending } from '../api/offline'

export default function OfflineBanner() {
  const { online, pending } = useOnline()
  const [syncing, setSyncing] = useState(false)
  const [last, setLast] = useState('')

  async function sincronizar() {
    setSyncing(true)
    try {
      const r = await syncPending()
      setLast(r.pending === 0 ? `Sincronizado (${r.ok})` : `${r.pending} pendiente(s)`)
    } catch {
      setLast('Sin conexion')
    } finally {
      setSyncing(false)
    }
  }

  if (online && pending === 0 && !last) return null

  return (
    <div className={`net-banner ${online ? '' : 'off'}`}>
      <span>
        {!online && 'Sin conexion — los cambios se encolan y se sincronizan solos. '}
        {online && pending > 0 && `${pending} cambio(s) pendiente(s) de sincronizar. `}
        {online && pending === 0 && last && `${last}. `}
      </span>
      {online && pending > 0 && (
        <button className="btn btn-outline" disabled={syncing} onClick={sincronizar} style={{ padding: '6px 12px' }}>
          {syncing ? 'Sincronizando…' : 'Sincronizar ahora'}
        </button>
      )}
    </div>
  )
}
