import { Navigate } from 'react-router-dom'

export const ROLES = {
  ADMIN: 'ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN',
  TECNICO: 'TECNICO',
}

export function getUser() {
  try {
    const raw = localStorage.getItem('ff_user')
    if (raw && raw !== 'undefined' && raw !== 'null') {
      const u = JSON.parse(raw)
      if (u && u.role) return u
    }
    const token = localStorage.getItem('ff_token')
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]))
      const u = {
        username: payload.sub,
        role: payload.role,
        tecnicoId: payload.tecnicoId != null ? payload.tecnicoId : (payload.role === 'TECNICO' ? 1 : null)
      }
      localStorage.setItem('ff_user', JSON.stringify(u))
      return u
    }
  } catch {
    // ignorar error de parseo
  }
  return {}
}

export function getToken() {
  return localStorage.getItem('ff_token')
}

export function isAdmin(user = getUser()) {
  return user.role === ROLES.ADMIN || user.role === ROLES.SUPER_ADMIN
}

export function isTecnico(user = getUser()) {
  return user.role === ROLES.TECNICO
}

export function hasRole(roles, user = getUser()) {
  return roles.includes(user.role)
}

export function ProtectedRoute({ children }) {
  return getToken() ? children : <Navigate to="/login" replace />
}

export function RequireRole({ roles, children, fallback = '/' }) {
  if (!getToken()) return <Navigate to="/login" replace />
  return hasRole(roles) ? children : <Navigate to={fallback} replace />
}

export function GuestOnly({ children }) {
  return getToken() ? <Navigate to="/" replace /> : children
}
