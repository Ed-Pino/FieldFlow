# FieldFlow — S8-6-Team-8

Plataforma full-stack centralizada para la gestión de servicios técnicos en campo: planificación y asignación de técnicos, seguimiento de órdenes de trabajo, registro de intervenciones con checklists, evidencia fotográfica, notas técnicas, firma de conformidad del cliente e historial completo de mantenimiento por equipo.

---

## Equipo — No Country S08-26-equipo 8

| Integrante | Rol |
|---|---|
| **Agustina Corei** | Project Manager |
|  (Frontend/Backend) |
| **Carla Vallejos Ari** | Fullstack Developer (Frontend/Backend) |
| **Gregori Rafael Urbaneja Morales** | Frontend Developer + QA |
**Eduin Pino** | Fullstack Developer

---

## Stack

| Capa | Tecnología |
|---|---|
| **Backend** | Java 17 · Spring Boot 4.1.1 · Spring Security 7 (JWT HS256) · Spring Data JPA · PostgreSQL / H2 |
| **Frontend** | React · TypeScript · Vite · PWA |
| **API Docs** | OpenAPI 3 / Swagger UI |
| **Build** | Maven Wrapper |

---

## Roles (dentro de la app)

| Rol | Acceso |
|---|---|
| **ADMIN** | Gestión completa: catálogos, creación y asignación de órdenes de trabajo, vista de agenda |
| **TECNICO** | Visualiza y actualiza sus órdenes asignadas, registra evidencia y conformidad |

---

## Backend

Ubicado en [`backend/`](backend/). API REST que expone autenticación JWT, gestión de órdenes de trabajo, trazabilidad de equipos, agenda de técnicos, catálogos y conformidad del cliente.

Arquitectura detallada con diagramas Mermaid: [`docs/architecture.md`](docs/architecture.md)

### Endpoints principales

```
# Autenticación (público)
POST /api/auth/login                      → {token, username, role}
POST /api/auth/register                   → crear usuario (TECNICO | ADMIN)

# Catálogos (ADMIN)
GET  /api/clientes
GET  /api/sedes?clienteId=
GET  /api/equipos?sedeId=
GET  /api/tecnicos
GET  /api/tecnicos/disponibles            → filtra por disponible=true

# Órdenes de Trabajo (TECNICO + ADMIN)
GET  /api/ordenes                         → listado
GET  /api/ordenes/{id}                    → detalle completo
GET  /api/ordenes/{id}/trazabilidad       → historial del equipo
GET  /api/ordenes/agenda/{tecnicoId}      → agenda del técnico por fecha programada
POST /api/ordenes                         → crear OT (ADMIN)
PUT  /api/ordenes/{id}/estado             → actualizar estado
POST /api/ordenes/{id}/conformidad        → notas + firma del cliente, finaliza OT
```

Swagger UI: `http://localhost:8081/swagger-ui.html`

### Ciclo de estados de una OT

```
pendiente → asignada → enCamino → enEjecucion → pendienteConformidad → finalizada
                │           │           │                │
                └───────────┴───────────┴────────────────┘
                                    ↓
                              reprogramada → pendiente
```

### Cómo correr el backend

Requisito: JDK 17+. No se necesita Maven instalado (wrapper incluido).

```bash
cd backend

# Perfil demo (H2 en memoria, seed automático, sin base de datos):
.\mvnw.cmd "-Dspring-boot.run.profiles=demo" spring-boot:run

# Perfil por defecto (PostgreSQL):
# crear DB: fieldflow, ajustar credenciales en application.yaml
.\mvnw.cmd spring-boot:run
```

### Usuarios seed (perfil demo)

| Username | Password | Rol |
|---|---|---|
| `admin` | `admin123` | ADMIN |
| `tecnico1` | `tecnico123` | TECNICO |
| `tecnico2` | `tecnico123` | TECNICO |

### Configuración

- `backend/src/main/resources/application.yaml` — perfil default: PostgreSQL, puerto 8081, JWT secret y expiración.
- `backend/src/main/resources/application-demo.yaml` — perfil demo: H2 in-memory, `ddl-auto: create-drop`.

> Usar variable de entorno para `app.jwt.secret` en producción.

---

## Frontend

Ubicado en [`frontend/`](frontend/). React + TypeScript + Vite PWA. En desarrollo.

---

## Entidades implementadas

`Usuario` · `Cliente` · `Sede` · `Equipo` · `Tecnico` · `OrdenTrabajo` · `CheckItem`

**Campos de `OrdenTrabajo`:** código (auto `OT-100x`), tipo de servicio, estado, prioridad (`baja|media|alta|urgente`), duración estimada (minutos), fecha de creación, fecha programada, descripción, notas, checklist, fotos (URLs), historial de eventos, firma de conformidad.

---

## Estado del proyecto

| Área | Estado |
|---|---|
| Repo | ✅ activo |
| Backend — Auth + seguridad JWT | ✅ completo |
| Backend — Entidades y modelo de dominio | ✅ completo |
| Backend — Catálogos + técnicos disponibles | ✅ completo |
| Backend — Órdenes de trabajo (CRUD + estados + conformidad + trazabilidad + agenda) | ✅ completo |
| Backend — Tests | ⏳ pendiente |
| Frontend | ⏳ en desarrollo |
| Documentación (architecture.md, design.md, tasks.md) | ✅ actualizada |
