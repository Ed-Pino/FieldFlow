import { Outlet, Link, useNavigate } from 'react-router-dom'

export default function App() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('ff_user') || '{}')

  function logout() {
    localStorage.removeItem('ff_token')
    localStorage.removeItem('ff_user')
    navigate('/login')
  }

  return (
    <div className="shell">
      <header className="topbar">
        <span className="brand">FieldFlow</span>
        <nav className="nav">
          <Link to="/">Dashboard</Link>
          {user.role === 'ADMIN' && <Link to="/catalogos">Catálogos</Link>}
          <button className="btn-link" onClick={logout}>
            Salir ({user.username || ''})
          </button>
        </nav>
      </header>
      <main className="content">
        <Outlet />
      </main>
    </div>
  )
}