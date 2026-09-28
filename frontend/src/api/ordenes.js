import { api } from './client'
import { getChecklists } from './catalogos'

export const ESTADOS = [
  'pendiente',
  'asignada',
  'enCamino',
  'enEjecucion',
  'pendienteConformidad',
  'finalizada',
  'reprogramada',
]

export const PRIORIDADES = ['baja', 'media', 'alta', 'urgente']

// Transiciones válidas (espejo de OrdenService.TRANSICIONES_VALIDAS)
export const TRANSICIONES = {
  pendiente: ['asignada'],
  asignada: ['enCamino', 'reprogramada'],
  enCamino: ['enEjecucion', 'reprogramada'],
  enEjecucion: ['pendienteConformidad', 'reprogramada'],
  pendienteConformidad: ['finalizada', 'reprogramada'],
  finalizada: [],
  reprogramada: ['pendiente'],
}

export function getOrdenes() {
  return api.get('/api/ordenes')
}

export function getOrden(id) {
  return api.get(`/api/ordenes/${id}`)
}

export const getOrdenById = getOrden

export function createOrden(payload) {
  return api.post('/api/ordenes', payload)
}

export function updateEstado(id, estado) {
  return api.put(`/api/ordenes/${id}/estado`, { estado })
}

export function asignarTecnico(id, tecnicoId) {
  return api.put(`/api/ordenes/${id}/tecnico`, { tecnicoId })
}

export function agendar(id, fechaProgramada) {
  return api.put(`/api/ordenes/${id}/agenda`, { fechaProgramada })
}

export function registrarEvidencia(id, { notas, checklist, fotos }) {
  return api.put(`/api/ordenes/${id}/evidencia`, { notas, checklist, fotos })
}

export function guardarConformidad(id, { notas, firma }) {
  return api.post(`/api/ordenes/${id}/conformidad`, { notas, firma })
}

export function getTrazabilidad(id) {
  return api.get(`/api/ordenes/${id}/trazabilidad`)
}

export function getAgenda(tecnicoId) {
  return api.get(`/api/ordenes/agenda/${tecnicoId}`)
}

export { getChecklists }
