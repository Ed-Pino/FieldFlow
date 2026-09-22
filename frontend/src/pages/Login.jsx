import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../api/auth'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { token, user } = await login({ username, password })
      localStorage.setItem('ff_token', token)
      localStorage.setItem('ff_user', JSON.stringify(user))
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message || 'Credenciales incorrectas')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-split">
      <div className="login-brand">
        <div className="brand-row">
          <div className="brand-logo">F</div>
          <div>
            <div className="brand-name">FieldFlow</div>
            <div className="brand-sub">SERVICIO TÉCNICO EN CAMPO Y TALLER</div>
          </div>
        </div>
        <h1 className="login-headline">
          Todo el ciclo de servicio técnico, en un solo lugar.
        </h1>
        <p className="mono login-lead">
          Cliente → Sede → Equipo → OT → Técnico → Intervención → Evidencia → Conformidad → Historial
        </p>
      </div>

      <div className="login-panel">
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="mono kicker">PWA · v0.9 PROTOTIPO</div>
          <h2 className="login-title">Ingresar</h2>
          <label>
            Usuario
            <input value={username} onChange={(e) => setUsername(e.target.value)} autoFocus />
          </label>
          <label>
            Contraseña
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {error && <div className="error-box">{error}</div>}
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Ingresando…' : 'Continuar'}
          </button>
          <div className="muted" style={{ textAlign: 'center', marginTop: 4 }}>
            Demo: admin / admin123 · tecnico1 / tecnico123
          </div>
        </form>
      </div>
    </div>
  )
}