import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import App from './App'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Catalogos from './pages/Catalogos'
import Ordenes from './pages/Ordenes'
import NuevaOrden from './pages/NuevaOrden'
import DetalleOrden from './pages/DetalleOrden'
import OrdenNueva from './pages/OrdenNueva'
import OrdenDetalle from './pages/OrdenDetalle'
import Agenda from './pages/Agenda'
import MisOrdenes from './pages/MisOrdenes'
import EnCamino from './pages/EnCamino'
import Ejecucion from './pages/Ejecucion'
import EquipoDetalle from './pages/EquipoDetalle'
import { ProtectedRoute, RequireRole, GuestOnly, ROLES, isTecnico } from './auth'
import './styles.css'

const ADMIN = [ROLES.ADMIN, ROLES.SUPER_ADMIN]
const TECNICO = [ROLES.TECNICO, ROLES.ADMIN, ROLES.SUPER_ADMIN]

function IndexRoute() {
  if (isTecnico()) return <Navigate to="/en-camino" replace />
  return <Dashboard />
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <App />
            </ProtectedRoute>
          }
        >
          <Route index element={<IndexRoute />} />
          <Route path="ordenes" element={<RequireRole roles={ADMIN}><Ordenes /></RequireRole>} />
          <Route path="ordenes/nueva" element={<RequireRole roles={ADMIN}><OrdenNueva /></RequireRole>} />
          <Route path="ordenes/:id" element={<OrdenDetalle />} />
          <Route path="agenda" element={<Agenda />} />
          <Route path="mis-ordenes" element={<RequireRole roles={TECNICO} fallback="/"><MisOrdenes /></RequireRole>} />
          <Route path="equipos/:id" element={<RequireRole roles={ADMIN}><EquipoDetalle /></RequireRole>} />
          <Route path="en-camino" element={<RequireRole roles={TECNICO} fallback="/"><EnCamino /></RequireRole>} />
          <Route path="ejecucion" element={<RequireRole roles={TECNICO} fallback="/"><Ejecucion /></RequireRole>} />
          <Route path="catalogos" element={<RequireRole roles={ADMIN}><Catalogos /></RequireRole>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)
