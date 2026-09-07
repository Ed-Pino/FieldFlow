# FieldFlow — S8-6-Team-8

Plataforma full-stack centralizada para la gestión de servicios técnicos de campo: gestión de órdenes de trabajo, asignación de técnicos, seguimiento de estado con historial completo (trazabilidad), checklists técnicos, evidencia fotográfica, notas y firma de conformidad del cliente.

## Equipo — No Country S08-26-equipo 8

| Integrante | Rol |
|------------|-----|
| **Agustina Corei** | Project Manager |
| **Eduin Pino** | Fullstack Developer (Frontend/Backend) |
| **Carla Vallejos Ari** | Fullstack Developer (Frontend/Backend) |
| **Gregori Rafael Urbaneja Morales** | Frontend Developer + QA |

## Stack

| Capa | Tecnología |
|------|-----------|
| **Backend** | Java 17, Spring Boot 4, Spring Security 7 (JWT), Spring Data JPA/Hibernate, PostgreSQL / H2 |
| **Frontend** | React, TypeScript, Vite, PWA |
| **API** | REST, OpenAPI/Swagger |

## Roles (dentro de la app)

- **ADMIN** — acceso completo: gestiona catálogos (clientes, sedes, equipos, técnicos) y crea/asigna órdenes de trabajo.
- **TECNICO** — visualiza y actualiza únicamente sus órdenes de trabajo asignadas.

## Backend

Ubicado en [`backend/`](backend/). API REST en Spring Boot que expone órdenes de trabajo, trazabilidad, conformidad, catálogos, y autenticación JWT con acceso basado en roles.

Documento de arquitectura con diagramas: [`docs/architecture.md`](docs/architecture.md)

### Dependencias

- `spring-boot-starter-webmvc`, `spring-boot-starter-security`, `spring-boot-starter-oauth2-resource-server`, `spring-boot-starter-data-jpa`
- `spring-boot-starter-validation`, `Lombok`
- `postgresql` (runtime), `h2` (perfil demo)
- `springdoc-openapi-starter-webmvc-ui` (Swagger UI)

### Endpoints principales

    POST /api/auth/login                     → JWT + rol
    POST /api/auth/register                  → crear usuario (rol: TECNICO | ADMIN)
    GET  /api/ordenes                        → listado de órdenes de trabajo (TECNICO/ADMIN)
    GET  /api/ordenes/{id}                   → detalle de la orden de trabajo
    GET  /api/ordenes/{id}/trazabilidad      → historial del equipo
    POST /api/ordenes                        → crear orden de trabajo (ADMIN)
    PUT  /api/ordenes/{id}/estado            → actualizar estado
    POST /api/ordenes/{id}/conformidad       → notas + firma, finaliza la OT
    GET  /api/clientes | sedes | equipos | tecnicos → catálogos (ADMIN)

Documentación interactiva (Swagger UI): `http://localhost:8081/swagger-ui.html`

### Cómo correr el backend

Requisitos: JDK 17+ (probado con Java 21 LTS). No hace falta instalar Maven — usa el wrapper incluido.

    cd backend
    # Perfil demo (H2 en memoria, no requiere base de datos):
    .\mvnw.cmd "-Dspring-boot.run.profiles=demo" spring-boot:run
    # Perfil por defecto (PostgreSQL):
    .\mvnw.cmd spring-boot:run

### Usuarios semilla (perfil demo)

| Usuario | Contraseña | Rol |
|---------|-------------|-----|
| `admin` | `admin123` | ADMIN |
| `tecnico1` | `tecnico123` | TECNICO |
| `tecnico2` | `tecnico123` | TECNICO |

### Configuración

- `src/main/resources/application.yaml` — perfil por defecto (PostgreSQL, puerto 8081, JWT secret).
- `src/main/resources/application-demo.yaml` — perfil demo (H2 en memoria).

## Frontend

Ubicado en [`frontend/`](frontend/). React + TypeScript + Vite PWA. *(Se arrancó por el backend; frontend en progreso.)*

## Entidades implementadas hasta ahora

`Usuario`, `Cliente`, `Sede`, `Equipo`, `Tecnico`, `OrdenTrabajo`, `CheckItem`

## Gaps detectados (pendientes de validar en equipo)

El flujo completo definido en el brief del proyecto es:

**Cliente → Sede → Equipo → Orden de Trabajo → Asignación → Agenda → Intervención → Evidencia → Conformidad → Historial**

Las siguientes partes de ese flujo todavía no están cubiertas por una entidad o endpoint, y falta definirlas en equipo:

- **Asignación** (vínculo técnico↔OT) como entidad propia
- **Agenda** (fecha/hora programada de la intervención)
- **Intervención** como paso diferenciado de la OT
- **Checklist** como agrupador/contenedor de `CheckItem`
- **Evidencia fotográfica** — no implementada aún (crítico: forma parte del criterio de éxito del proyecto)
- **Tipos de servicio** como catálogo propio
- **Notas técnicas** separadas de la conformidad

## Estado del proyecto

- **Repo:** ✅ creado
- **Backend:** ⚠️ versión inicial en marcha (auth, roles, entidades base, endpoints de OT y catálogos) — pendiente de validación en equipo y de resolver los gaps de arriba
- **Frontend:** ⏳ no iniciado
- **Backlog:** ⏳ borrador inicial, pendiente de cargar en GitHub Projects
- **Mockup UI/UX:** ⏳ no iniciado
- **Entregables de la plataforma (4 tareas):** 0/4
