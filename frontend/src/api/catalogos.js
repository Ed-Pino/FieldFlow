import { request } from './client'

export function getClientes() {
  return request('/api/clientes')
}

export function createCliente(payload) {
  return request('/api/clientes', { method: 'POST', body: JSON.stringify(payload) })
}

export function getSedes(clienteId) {
  const q = clienteId ? `?clienteId=${clienteId}` : ''
  return request(`/api/sedes${q}`)
}

export function createSede(payload) {
  return request('/api/sedes', { method: 'POST', body: JSON.stringify(payload) })
}

export function getEquipos(sedeId) {
  const q = sedeId ? `?sedeId=${sedeId}` : ''
  return request(`/api/equipos${q}`)
}

export function createEquipo(payload) {
  return request('/api/equipos', { method: 'POST', body: JSON.stringify(payload) })
}

export function getEquipo(id) {
  return request(`/api/equipos/${id}`)
}

export function getProductos() {
  return request('/api/productos')
}

export function getTecnicos() {
  return request('/api/tecnicos')
}

export function getTecnicosDisponibles() {
  return request('/api/tecnicos/disponibles')
}

export function getChecklists() {
  return request('/api/checklists')
}

export function deleteCliente(id) {
  return request(`/api/clientes/${id}`, { method: 'DELETE' })
}

export function deleteSede(id) {
  return request(`/api/sedes/${id}`, { method: 'DELETE' })
}

export function deleteEquipo(id) {
  return request(`/api/equipos/${id}`, { method: 'DELETE' })
}

export function deleteTecnico(id) {
  return request(`/api/tecnicos/${id}`, { method: 'DELETE' })
}
