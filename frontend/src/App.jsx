import { Outlet, Link, useNavigate } from 'react-router-dom'
import OfflineBanner from './pages/OfflineBanner'
import { getUser } from './auth'

export default function App() {
  const navigate = useNavigate()
  const user = getUser()

  function logout() {
    localStorage.removeItem('ff_token')
    localStorage.removeItem('ff_user')
    navigate('/login')
  }

  const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN'
  const isSuperAdmin = user.role === 'SUPER_ADMIN'
  const isTecnico = user.role === 'TECNICO'

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand-row">
          <img src="/logo-FF.jpg" alt="FieldFlow logo" className="brand-logo" />
          <div>
            <div className="brand-sub">PWA v0.9</div>
          </div>
        </div>
        <div className="nav-group">
          <div className="nav-label">Operacion</div>
          {isTecnico ? (
            <>
              <Link to="/en-camino" className="nav-item">
                <span className="nav-num">01</span> En camino
              </Link>
              <Link to="/ejecucion" className="nav-item">
                <span className="nav-num">02</span> Ejecucion
              </Link>
              <Link to="/mis-ordenes" className="nav-item">
                <span className="nav-num">03</span> Mis ordenes
              </Link>
              <Link to="/agenda" className="nav-item">
                <span className="nav-num">04</span> Agenda
              </Link>
            </>
          ) : (
            <>
              <Link to="/" className="nav-item">
                <span className="nav-num">01</span> Dashboard
              </Link>
              <Link to="/ordenes" className="nav-item">
                <span className="nav-num">02</span> Ordenes
              </Link>
              <Link to="/ordenes/nueva" className="nav-item">
                <span className="nav-num">03</span> Crear orden
              </Link>
              <Link to="/agenda" className="nav-item">
                <span className="nav-num">04</span> Agenda
              </Link>
              <Link to="/catalogos" className="nav-item">
                <span className="nav-num">05</span> Catalogos
              </Link>
            </>
          )}
        </div>
        <div className="sidebar-foot">
          <div style={{ marginBottom: 10, wordBreak: 'break-word' }}>
            {user.username} - {user.role}
            {user.tecnicoId != null && <div className="mono">tec #{user.tecnicoId}</div>}
          </div>
          <button className="link-btn" onClick={logout}>Cerrar sesion</button>
        </div>
      </aside>
      <main className="main">
        <div className="content">
          <OfflineBanner />
          <Outlet />
        </div>
      </main>
    </div>
  )
}