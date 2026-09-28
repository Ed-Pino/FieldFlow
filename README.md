# FieldFlow — S8-6-Team-8

Plataforma full-stack centralizada para la gestión de servicios técnicos en campo: planificación y asignación de técnicos, seguimiento de órdenes de trabajo, registro de intervenciones con checklists y mediciones, evidencia fotográfica, notas técnicas, firma de conformidad del cliente e historial completo de mantenimiento por equipo. PWA instalable con funcionamiento offline para técnicos en campo.

Ciclo completo: Cliente → Sede → Equipo → OT → Técnico → Agenda → Intervención → Evidencia → Firma Digital → Trazabilidad.

Guía de pruebas manuales: [`docs/PLAN-PRUEBAS.md`](docs/PLAN-PRUEBAS.md)

---

## Equipo — No Country S08-26-equipo 8

| Integrante | Rol |
|---|---|
| **Agustina Corei** | Project Manager |
| (Frontend/Backend) |
| **Carla Vallejos Ari** | Fullstack Developer (Frontend/Backend) |
| **Gregori Rafael Urbaneja Morales** | Frontend Developer + QA |
**Eduin Pino** | Fullstack Developer

---

## Stack

| Capa | Tecnología |
|---|---|
| **Backend** | Java 17 (runtime JDK 21) · Spring Boot 4.1.1 · Spring Security 7 (JWT HS256, 24 h) · Spring Data JPA · H2 local / PostgreSQL |
| **Frontend** | React 18 (JavaScript) · React Router 6 · Vite 5 · PWA (`vite-plugin-pwa`, Workbox) |
| **API Docs** | OpenAPI 3 / Swagger UI |
| **Build** | Maven Wrapper · npm |
| **Tests** | JUnit 5 + MockMvc (backend, 58 verdes) · E2E headless con Chrome (flujos UI) |

---

## Roles (dentro de la app)

| Rol | Acceso |
|---|---|
| **ADMIN** | Gestión completa: catálogos y altas, crear y asignar OTs, agendar, agenda general, dashboard |
| **SUPER_ADMIN** | Todo lo de ADMIN + gestión de usuarios + borrado de catálogos |
| **TECNICO** | En camino, Ejecución, Mis órdenes y su Agenda; opera sus OTs (estados, checklist, evidencia, conformidad). Vinculado a su ficha vía `tecnicoId` |

---

## Backend

Ubicado en [`backend/`](backend/). API REST con autenticación JWT, gestión de órdenes de trabajo, trazabilidad de equipos, agenda de técnicos, catálogos con altas, conformidad del cliente y asignación de técnicos.

Arquitectura detallada con diagramas Mermaid: [`docs/architecture.md`](docs/architecture.md)

### Endpoints principales

```
# Autenticación (público)
POST /api/auth/login                      → {token, username, role, tecnicoId?}
POST /api/auth/register                   → crear usuario (TECNICO | ADMIN)

# Catálogos (ADMIN; DELETE solo SUPER_ADMIN)
GET  /api/clientes
POST /api/clientes                        → 201 (NIT duplicado → 409)
GET  /api/sedes?clienteId=
POST /api/sedes                           → 201 (cliente inexistente → 404)
GET  /api/equipos?sedeId=
GET  /api/equipos/{id}                    → ficha del equipo
POST /api/equipos                         → 201 (código duplicado → 409)
GET  /api/tecnicos
GET  /api/tecnicos/disponibles            → filtra por disponible=true
GET  /api/productos · /api/tareas-mantenimiento · /api/fallas-recurrentes · /api/checklists

# Órdenes de Trabajo (TECNICO + ADMIN; creación/asignación/agenda: ADMIN)
GET  /api/ordenes                         → listado
GET  /api/ordenes/{id}                    → detalle completo
POST /api/ordenes                         → crear OT: código auto OT-100x, estado pendiente
PUT  /api/ordenes/{id}/estado             → transición validada (inválida → 400)
PUT  /api/ordenes/{id}/tecnico            → asignar/desasignar técnico + historial
PUT  /api/ordenes/{id}/agenda             → reprogramar fecha (hoy o futura)
PUT  /api/ordenes/{id}/evidencia          → notas + checklist (+valor/unidad) + fotos
POST /api/ordenes/{id}/conformidad        → notas + firma, solo desde pendienteConformidad, finaliza OT
GET  /api/ordenes/{id}/trazabilidad       → OTs del mismo equipo, fecha DESC
GET  /api/ordenes/agenda/{tecnicoId}      → agenda del técnico, fecha ASC
```

Swagger UI: `http://localhost:8081/swagger-ui.html`

### Ciclo de estados de una OT

```
pendiente → asignada → enCamino → enEjecucion → pendienteConformidad → finalizada
                 │          │            │                │
                 └──────────┴────────────┴────────────────┘
                                     ↓ reprogramada → pendiente
```

### Cómo correr el backend

Requisito: JDK 17+. No se necesita Maven instalado (wrapper incluido).
**Una sola instancia a la vez** (el H2 en archivo admite una sola conexión).

```powershell
cd backend

# Desarrollo (por defecto): H2 en archivo ./data/fieldflow.mv.db, seed automático
.\mvnw.cmd spring-boot:run

# Perfil demo (H2 en memoria, create-drop, para tests):
.\mvnw.cmd "-Dspring-boot.run.profiles=demo" spring-boot:run

# Suite de tests (58):
.\mvnw.cmd test
```

PostgreSQL queda para más adelante (config comentada en `application.yaml`).
Consola H2: `http://localhost:8081/h2-console` (JDBC `jdbc:h2:file:./data/fieldflow`, usuario `sa`).

### Usuarios seed

| Username | Password | Rol | Técnico vinculado |
|---|---|---|---|
| `admin` | `admin123` | ADMIN | — |
| `superadmin` | `super123` | SUPER_ADMIN | — |
| `tecnico1` | `tecnico123` | TECNICO | Eduin - Senior Gas (id 1) |
| `tecnico2` | `tecnico123` | TECNICO | Carlos - Mantenimiento (id 2) |

### Configuración

- `backend/src/main/resources/application.yaml` — desarrollo: H2 archivo, puerto 8081, JWT secret y expiración (24 h).
- `backend/src/main/resources/application-demo.yaml` — tests: H2 in-memory, `ddl-auto: create-drop`.

> Usar variable de entorno para `app.jwt.secret` en producción.
> Desactivar Swagger en producción: `springdoc.api-docs.enabled=false`.

---

## Frontend

Ubicado en [`frontend/`](frontend/). React + Vite PWA con control de acceso por rol y cola offline.

```powershell
cd frontend
npm install
npm run dev      # http://localhost:5173 (usar localhost, no 127.0.0.1)
npm run build    # build PWA en dist/
```

### Rutas y vistas

| Ruta | Rol | Vista |
|---|---|---|
| `/login` | público | Login (redirige si ya hay sesión; credenciales demo en pantalla) |
| `/` | ADMIN | Dashboard real: KPIs, OTs recientes, accesos rápidos |
| `/` | TECNICO | Redirige a `/en-camino` |
| `/ordenes` · `/ordenes/nueva` | ADMIN | Lista con filtros · formulario encadenado cliente→sede→equipo→técnico + plantilla checklist |
| `/ordenes/:id` | ambos | Detalle: ficha, estados, técnico (admin), agenda (admin), checklist, bitácora de notas, fotos, conformidad con firma, historial, trazabilidad |
| `/equipos/:id` | ADMIN | Ficha del equipo + trazabilidad |
| `/agenda` | ambos | Por técnico (el técnico solo ve la suya) |
| `/en-camino` · `/ejecucion` · `/mis-ordenes` | TECNICO (+admin) | OT activa + transiciones grandes · checklist y mediciones · sus OTs |
| `/catalogos` | ADMIN | Clientes, sedes, equipos, técnicos + altas (Eliminar: SUPER_ADMIN) |

### Offline (técnicos en campo)
- Outbox en `localStorage`: estados, evidencia y conformidad se encolan sin red y se sincronizan solas al reconectar (banner con contador + botón manual).
- Solo se encolan operaciones rejugables (PUTs + conformidad con guarda de estado); las creaciones (POST) requieren red para no duplicar.
- El service worker cachea el shell + GETs `/api/` (NetworkFirst, 24 h).

---

## Entidades implementadas

`Usuario` (con `tecnico`) · `Cliente` · `Sede` · `Equipo` · `Tecnico` · `OrdenTrabajo` · `CheckItem` (texto, hecho, tipo, unidad, **valor**) · `Checklist` · `Producto` · `TareaMantenimiento` · `FallaRecurrente`

**Campos de `OrdenTrabajo`:** código (auto `OT-100x`, secuencia reiniciada desde BD), tipo de servicio, estado, prioridad (`baja|media|alta|urgente`), duración estimada (minutos), fecha de creación, fecha programada (reprogramable), descripción, notas (bitácora con timestamp), checklist (+mediciones), fotos (URLs o base64 comprimido), historial de eventos, firma de conformidad.

---

## Estado del proyecto

| Área | Estado |
|---|---|
| Repo | ✅ activo |
| Backend — Auth + seguridad JWT + roles | ✅ completo |
| Backend — Entidades y modelo de dominio | ✅ completo |
| Backend — Catálogos + altas + técnicos disponibles | ✅ completo |
| Backend — OTs (crear, estados, técnico, agenda, evidencia, conformidad, trazabilidad) | ✅ completo |
| Backend — Tests (58/58) | ✅ completo |
| Frontend — Auth, roles, dashboard, catálogos + altas | ✅ completo |
| Frontend — OTs (lista, crear, detalle, agenda, equipo) | ✅ completo |
| Frontend — Técnico mobile (en camino, ejecución, mis órdenes) | ✅ completo |
| Frontend — Firma, fotos, notas, offline | ✅ completo |
| Documentación (architecture.md, PLAN-PRUEBAS.md) | ✅ actualizada |
| Tablero Projects 503 | ⏳ actualizar items a done |
