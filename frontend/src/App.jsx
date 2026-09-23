import { Outlet, Link, useNavigate } from 'react-router-dom'

export default function App() {
  const navigate = useNavigate()
  const raw = localStorage.getItem('ff_user')
  const user = raw && raw !== 'undefined' ? JSON.parse(raw) : {}

  function logout() {
    localStorage.removeItem('ff_token')
    localStorage.removeItem('ff_user')
    navigate('/login')
  }

  const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN'

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand-row">
          <div className="brand-logo">F</div>
          <div>
            <div className="brand-name">FieldFlow</div>
            <div className="brand-sub">PWA · v0.9 PROTOTIPO</div>
          </div>
        </div>

        <div className="nav-group">
          <div className="nav-label">Operación</div>
          <Link to="/" className="nav-item">
            <span className="nav-num">01</span> Dashboard
          </Link>
          {isAdmin && (
            <Link to="/catalogos" className="nav-item">
              <span className="nav-num">02</span> Catálogos
            </Link>
          )}
        </div>

        <div className="sidebar-foot">
          <div style={{ marginBottom: 10, wordBreak: 'break-word' }}>
            {user.username} · {user.role}
          </div>
          <button className="btn-link" onClick={logout}>Cerrar sesión</button>
        </div>
      </aside>

      <main className="main">
        <div className="content">
          <Outlet />
        </div>
      </main>
    </div>
  )
}