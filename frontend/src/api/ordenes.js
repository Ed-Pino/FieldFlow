import { request } from './client'

export function getOrdenes() {
  return request('/api/ordenes')
}

export function getOrdenById(id) {
  return request(`/api/ordenes/${id}`)
}

export function updateEstado(id, estado) {
  return request(`/api/ordenes/${id}/estado`, {
    method: 'PUT',
    body: JSON.stringify({ estado })
  })
}
