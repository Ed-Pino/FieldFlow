import { useEffect, useState } from 'react'
import { request } from './client'

const KEY = 'ff_outbox'

export function isNetworkError(err) {
  return err instanceof TypeError
}

export function readOutbox() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || '[]')
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
}

export function pendingCount() {
  return readOutbox().length
}

const listeners = new Set()

export function onPendingChange(cb) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

function notify() {
  const n = pendingCount()
  listeners.forEach((cb) => {
    try {
      cb(n)
    } catch {
      /* noop */
    }
  })
}

export function enqueueMutation({ method, path, body, label }) {
  const box = readOutbox()
  box.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    ts: Date.now(),
    method,
    path,
    body: body ?? null,
    label: label || `${method} ${path}`,
  })
  localStorage.setItem(KEY, JSON.stringify(box))
  notify()
  return box.length
}

// Reproduce la cola en orden. 4xx = rechazo definitivo (se descarta),
// error de red = se conserva para reintentar.
export async function syncPending() {
  const box = readOutbox()
  let ok = 0
  const rest = []
  for (const m of box) {
    try {
      await request(m.path, { method: m.method, body: m.body })
      ok++
    } catch (err) {
      if (err && err.status >= 400 && err.status < 500) {
        ok++ // descartado: el servidor ya definio el estado
      } else {
        rest.push(m)
      }
    }
  }
  localStorage.setItem(KEY, JSON.stringify(rest))
  notify()
  return { ok, pending: rest.length }
}

// Mutacion tolerante a cortes: si no hay red, encola y devuelve {_queued:true}.
// Solo para operaciones rejugables (PUTs + conformidad con guarda de estado).
export async function mutar(method, path, bodyObj, label) {
  const body = bodyObj == null ? undefined : JSON.stringify(bodyObj)
  try {
    return await request(path, { method, body })
  } catch (err) {
    if (isNetworkError(err)) {
      enqueueMutation({ method, path, body, label })
      return { _queued: true }
    }
    throw err
  }
}

export function useOnline() {
  const [online, setOnline] = useState(
    typeof navigator === 'undefined' ? true : navigator.onLine
  )
  const [pending, setPending] = useState(pendingCount())

  useEffect(() => {
    const on = () => {
      setOnline(true)
      syncPending().catch(() => {})
    }
    const off = () => setOnline(false)
    const unsub = onPendingChange(setPending)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    // Intento inicial por si quedaron pendientes de otra sesion
    syncPending().catch(() => {})
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
      unsub()
    }
  }, [])

  return { online, pending }
}
