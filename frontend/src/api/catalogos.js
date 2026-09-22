import { request } from './client'

export function getClientes() {
  return request('/api/clientes')
}

export function getSedes(clienteId) {
  const q = clienteId ? `?clienteId=${clienteId}` : ''
  return request(`/api/sedes${q}`)
}

export function getEquipos(sedeId) {
  const q = sedeId ? `?sedeId=${sedeId}` : ''
  return request(`/api/equipos${q}`)
}

export function getTecnicos() {
  return request('/api/tecnicos')
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
