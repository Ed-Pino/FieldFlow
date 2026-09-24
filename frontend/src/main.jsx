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
import './styles.css'

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('ff_token')
  return token ? children : <Navigate to="/login" replace />
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <App />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="catalogos" element={<Catalogos />} />
          <Route path="ordenes" element={<Ordenes />} />
          <Route path="ordenes/nueva" element={<NuevaOrden />} />
          <Route path="ordenes/:id" element={<DetalleOrden />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)