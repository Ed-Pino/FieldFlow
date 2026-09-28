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
      const data = await login({ username, password })
      const token = data.token
      const user = data.user || {
        username: data.username,
        role: data.role,
        tecnicoId: data.tecnicoId,
      }
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
    <div className="landing-page">
      <header className="landing-nav">
        <a className="landing-brand" href="#inicio" aria-label="FieldFlow, inicio">
          <img src="/logo-FF.jpg" alt="FieldFlow" />
          <span>GESTIÓN TÉCNICA EN CAMPO</span>
        </a>
        <nav className="landing-links" aria-label="Navegación principal">
          <a href="#plataforma">Plataforma</a>
          <a href="#flujo">Cómo funciona</a>
          <a className="landing-nav-cta" href="#acceso">Ingresar <span aria-hidden="true">→</span></a>
        </nav>
      </header>

      <main>
        <section className="landing-hero" id="inicio">
          <div className="landing-copy">
            <div className="landing-eyebrow"><span /> OPERACIÓN CONECTADA, EN TIEMPO REAL</div>
            <h1>
              Cada servicio,<br />
              <span>bajo control.</span>
            </h1>
            <p className="landing-intro">
              Coordina a tu equipo técnico, da seguimiento a cada orden y deja
              todo el trabajo documentado. Desde la planificación hasta la
              conformidad del cliente.
            </p>
            <div className="landing-actions">
              <a className="landing-button" href="#acceso">Entrar a FieldFlow <span aria-hidden="true">→</span></a>
              <a className="landing-text-link" href="#plataforma">Conocer la plataforma</a>
            </div>
            <div className="landing-proof">
              <div className="landing-proof-item"><span>01</span><div><strong>Orden</strong><small>Planifica cada servicio</small></div></div>
              <div className="landing-proof-item"><span>02</span><div><strong>Campo</strong><small>Coordina a tu equipo</small></div></div>
              <div className="landing-proof-item"><span>03</span><div><strong>Control</strong><small>Documenta el resultado</small></div></div>
            </div>
          </div>

          <div className="landing-art">
            <img src="/app-image.png" alt="Técnicos trabajando en campo con FieldFlow" />
            <div className="landing-art-caption">
              <span className="landing-status-dot" />
              <div><strong>Del taller al campo</strong><small>Todo el servicio, en un solo flujo.</small></div>
              <span className="landing-art-arrow" aria-hidden="true">↗</span>
            </div>
          </div>
        </section>

        <section className="landing-workflow" id="plataforma">
          <div className="landing-section-heading" id="flujo">
            <div>
              <div className="landing-eyebrow landing-eyebrow-dark">UNA OPERACIÓN, DE PRINCIPIO A FIN</div>
              <h2>El contexto siempre acompaña al servicio.</h2>
            </div>
            <p>Menos información dispersa. Más claridad para el equipo y para cada cliente.</p>
          </div>
          <div className="landing-feature-grid">
            <article className="landing-feature">
              <span className="landing-feature-number">01 / PLANIFICA</span>
              <h3>Órdenes organizadas</h3>
              <p>Relaciona clientes, sedes, equipos y agenda desde un mismo lugar.</p>
            </article>
            <article className="landing-feature">
              <span className="landing-feature-number">02 / EJECUTA</span>
              <h3>Equipo conectado</h3>
              <p>El técnico lleva su agenda, checklist y datos del equipo al trabajo.</p>
            </article>
            <article className="landing-feature">
              <span className="landing-feature-number">03 / DOCUMENTA</span>
              <h3>Servicio trazable</h3>
              <p>Registra avances, mediciones, notas y evidencia en cada intervención.</p>
            </article>
            <article className="landing-feature">
              <span className="landing-feature-number">04 / CIERRA</span>
              <h3>Conformidad clara</h3>
              <p>Finaliza con notas y firma, y conserva el historial del equipo.</p>
            </article>
          </div>
        </section>

        <section className="landing-access" id="acceso">
          <div className="landing-access-copy">
            <div className="landing-eyebrow"><span /> ACCESO A LA PLATAFORMA</div>
            <h2>Tu operación<br /><span>empieza aquí.</span></h2>
            <p>Ingresa a FieldFlow para consultar órdenes, coordinar servicios y mantener cada intervención al día.</p>
            <div className="landing-access-note"><span aria-hidden="true">↳</span> Disponible para administración y personal técnico.</div>
          </div>
          <form className="login-form" onSubmit={handleSubmit}>
            <div className="login-form-heading">
              <span className="login-form-mark">F</span>
              <div><span className="login-form-kicker">FIELDFLOW</span><h3>Iniciar sesión</h3></div>
            </div>
            <label>
              Usuario
              <input
                type="text"
                name="username"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </label>
            <label>
              Contraseña
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>
            {error && <div className="error-box" role="alert">{error}</div>}
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Ingresando…' : 'Ingresar a FieldFlow'}
              {!loading && <span aria-hidden="true">→</span>}
            </button>
            <div className="login-demo">
              <span>ENTORNO DE DEMOSTRACIÓN</span>
              <p>Admin: <code>admin / admin123</code></p>
              <p>Técnico: <code>tecnico1 / tecnico123</code></p>
            </div>
          </form>
        </section>
      </main>

      <footer className="landing-footer">
        <img src="/logo-FF.jpg" alt="" />
        <span>FieldFlow · Gestión técnica en campo</span>
        <a href="#inicio">Volver arriba ↑</a>
      </footer>
    </div>
  )
}
