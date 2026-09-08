# Design — FieldFlow

## Visión general

FieldFlow es una plataforma web para la gestión centralizada de servicios técnicos en campo. La arquitectura sigue un modelo en capas clásico de Spring Boot (Controller → Service → Repository), con seguridad stateless basada en JWT y base de datos PostgreSQL.

Servidor: `:8081`

Requisitos cubiertos: REQ-1 · REQ-2 · REQ-3 · REQ-4 · REQ-5 · REQ-6 · REQ-7 · REQ-8

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Backend | Java 17 · Spring Boot 4.1.1 · Spring Security 7 · Spring Data JPA |
| Autenticación | JWT (HS256) · OAuth2 Resource Server (claims: iss, sub, role, exp) |
| Base de datos (prod) | PostgreSQL |
| Base de datos (test/dev) | H2 (in-memory) |
| Documentación API | SpringDoc OpenAPI 3 (Swagger UI) |
| Build | Maven |
| Utilidades | Lombok |

---

## Arquitectura de capas

```
[ Frontend React (PWA) / Swagger UI ]
              │
        [ :8081 Backend ]
              │
    [ SecurityFilterChain + JWT ]          ← REQ-1
              │
    ┌─────────────────────────┐
    │     Controller (REST)   │
    │  HomeController         │
    │  AuthController         │            ← REQ-1
    │  CatalogoController     │            ← REQ-2
    │  OrdenController        │            ← REQ-3, REQ-4, REQ-5, REQ-6, REQ-7, REQ-8
    └────────────┬────────────┘
                 │
    ┌────────────▼────────────┐
    │   Service (negocio)     │
    │  AuthService            │            ← REQ-1
    │  CatalogoService        │            ← REQ-2
    │  OrdenService           │  ← @Transactional  (REQ-3 al REQ-8)
    └────────────┬────────────┘
                 │
    ┌────────────▼────────────┐
    │  Repository (JPA)       │
    │  ClienteRepository      │
    │  SedeRepository         │
    │  EquipoRepository       │
    │  TecnicoRepository      │
    │  OrdenTrabajoRepository │
    │  UsuarioRepository      │
    └────────────┬────────────┘
                 │
    ┌────────────▼────────────┐
    │  Base de datos          │
    │  PostgreSQL / H2        │
    └─────────────────────────┘
              │
    GlobalExceptionHandler (401/403/400/404/500)
```

---

## Modelo de dominio

### Entidades principales

```
Cliente                                    ← REQ-2, REQ-3
  ├── id: Long
  ├── nombre: String
  ├── nit: String (único)
  └── sedes: List<Sede>

Sede                                       ← REQ-2, REQ-3
  ├── id: Long
  ├── nombre: String
  ├── direccion: String
  ├── ciudad: String
  ├── cliente: Cliente
  └── equipos: List<Equipo>

Equipo                                     ← REQ-2, REQ-3, REQ-8
  ├── id: Long
  ├── codigo: String (único)
  ├── nombre: String
  ├── tipo: String
  ├── ultimoMantenimiento: LocalDate
  ├── sede: Sede
  └── ordenes: List<OrdenTrabajo>

Tecnico                                    ← REQ-2, REQ-3, REQ-5
  ├── id: Long
  ├── nombre: String
  ├── especialidades: Set<String>  ← tabla tecnico_especialidades
  ├── disponible: boolean          ← REQ-2 (filtro disponibles)
  └── ordenes: List<OrdenTrabajo>

OrdenTrabajo (Aggregate Root)              ← REQ-3, REQ-4, REQ-5, REQ-6, REQ-7, REQ-8
  ├── id: Long
  ├── codigo: String (único, generado: "OT-100x")   ← REQ-3.4
  ├── tipoServicio: String                           ← REQ-3.2
  ├── estado: EstadoOT                               ← REQ-4
  ├── prioridad: Prioridad (baja|media|alta|urgente, default: media)  ← REQ-3.6
  ├── duracionEstimadaMin: Integer (nullable)        ← REQ-3.7
  ├── fechaCreacion: LocalDateTime
  ├── fechaProgramada: LocalDate                     ← REQ-5
  ├── descripcion: String                            ← REQ-3.2
  ├── notas: String                                  ← REQ-6.1, REQ-7.1
  ├── firmaBase64: String                            ← REQ-7.1
  ├── cliente: Cliente
  ├── sede: Sede
  ├── equipo: Equipo
  ├── tecnico: Tecnico
  ├── checklist: List<CheckItem>   ← REQ-3.8, REQ-6.2
  ├── fotos: List<String>          ← REQ-6.3 (URLs)
  └── historial: List<String>      ← REQ-4.5, REQ-7.3, REQ-8

CheckItem (Embeddable)                     ← REQ-3.8, REQ-6.2
  ├── texto: String
  └── hecho: boolean

Usuario                                    ← REQ-1
  ├── id: Long
  ├── username: String (único)
  ├── password: String (BCrypt factor 12)
  └── role: String  ← "ADMIN" | "TECNICO"
```

### Estados de una Orden de Trabajo (REQ-4)

```
                          ┌─────────────────────────────────┐
                          ▼                                 │
pendiente → asignada → enCamino → enEjecucion → pendienteConformidad → finalizada
                │           │           │                │
                └───────────┴───────────┴────────────────┘
                                    │
                               reprogramada
                                    │
                                pendiente  (reanudación)
```

- Flujo principal: `pendiente → asignada → enCamino → enEjecucion → pendienteConformidad → finalizada` (REQ-4.2)
- `reprogramada` válido desde: `asignada`, `enCamino`, `enEjecucion`, `pendienteConformidad` (REQ-4.3)
- `reprogramada → pendiente` (REQ-4.4)
- Cada transición registra evento en historial con timestamp (REQ-4.5)

---

## Seguridad y autenticación (REQ-1)

### Flujo de login y emisión de JWT

```
POST /api/auth/login {username, password}
  → AuthService.login
  → UsuarioRepository.findByUsername
      ├── no existe → BadCredentialsException (401)        ← REQ-1.2
      └── existe → BCrypt.matches
          ├── password incorrecto → 401                    ← REQ-1.2
          └── OK → TokenService.generateToken
              → JwtEncoder HS256
                claims: iss=fieldflow, sub=username, role=ROLE_X, exp
              → AuthResponse {token, username, role}       ← REQ-1.1
```

### Validación de JWT en cada request

```
Authorization: Bearer <token>
  → SecurityConfig.oauth2ResourceServer
  → JwtDecoder (valida firma + expiración)
      ├── inválido → 401 invalid_token                     ← REQ-1.4
      └── válido → JwtAuthenticationConverter
          → claim "role" → "ROLE_XXX"                      ← REQ-1.3
          → evalúa reglas de rutas:
              /api/auth/**         → permitAll
              /swagger-ui/**       → permitAll
              /api/ordenes/**      → hasAnyRole(TECNICO, ADMIN)
              /api/**              → hasRole(ADMIN)         ← REQ-1.5, REQ-1.6
          → @PreAuthorize a nivel de método (create OT → solo ADMIN)  ← REQ-3.1
```

### Roles y autorización (REQ-1)

| Rol | Permisos |
|---|---|
| `ADMIN` | Acceso completo a todos los endpoints `/api/**` (REQ-1.6) |
| `TECNICO` | Acceso a `/api/ordenes/**` — lectura, estado, evidencia, conformidad (REQ-1.5) |
| Anónimo | Solo `/api/auth/**` y documentación Swagger |

---

## API Endpoints

### Autenticación — `/api/auth` (REQ-1)

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| POST | `/api/auth/login` | público | Autentica, devuelve JWT |
| POST | `/api/auth/register` | público | Registra usuario, devuelve JWT |

### Catálogo — `/api` (REQ-2)

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| GET | `/api/clientes` | ADMIN | Lista clientes (REQ-2.1) |
| GET | `/api/sedes?clienteId=` | ADMIN | Lista sedes, filtro opcional por cliente (REQ-2.2) |
| GET | `/api/equipos?sedeId=` | ADMIN | Lista equipos, filtro opcional por sede (REQ-2.3) |
| GET | `/api/tecnicos` | ADMIN | Lista todos los técnicos con especialidades y disponibilidad (REQ-2.4) |
| GET | `/api/tecnicos/disponibles` | ADMIN | Lista técnicos con `disponible=true` (REQ-2.5) |

### Órdenes de Trabajo — `/api/ordenes`

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| GET | `/api/ordenes` | ADMIN, TECNICO | Lista todas las órdenes |
| GET | `/api/ordenes/{id}` | ADMIN, TECNICO | Detalle completo de una orden |
| GET | `/api/ordenes/{id}/trazabilidad` | ADMIN, TECNICO | Historial del equipo — REQ-8 |
| GET | `/api/ordenes/agenda/{tecnicoId}` | ADMIN, TECNICO | Agenda del técnico por fecha — REQ-5 |
| POST | `/api/ordenes` | ADMIN | Crea OT — REQ-3 |
| PUT | `/api/ordenes/{id}/estado` | ADMIN, TECNICO | Cambia estado — REQ-4 |
| POST | `/api/ordenes/{id}/conformidad` | ADMIN, TECNICO | Guarda notas + firma — REQ-7 |

---

## Flujo detallado — Crear Orden de Trabajo (REQ-3)

```
POST /api/ordenes + JWT ADMIN
  → SecurityFilterChain (valida token)                     ← REQ-1.4
  → OrdenController.create (@PreAuthorize ADMIN)           ← REQ-3.1
  → OrdenService.create (@Transactional)
      → ClienteRepository.findById   ← 404 si no existe   ← REQ-3.10
      → SedeRepository.findById      ← 404 si no existe   ← REQ-3.10
      → EquipoRepository.findById    ← 404 si no existe   ← REQ-3.10
      → TecnicoRepository.findById   ← 404 si no existe (opcional)  ← REQ-3.3
      → genera código "OT-100x"                            ← REQ-3.4
      → new OrdenTrabajo(estado=pendiente)                 ← REQ-3.5
      → prioridad = request.prioridad ?? media             ← REQ-3.6
      → setChecklist(items del request)                    ← REQ-3.8
      → historial.add("OT creada")                        ← REQ-3.9
      → OrdenTrabajoRepository.save
      → OrdenResponse.from(ot)  ← materializa colecciones lazy
  → 201 Created + OrdenResponse JSON
```

## Flujo detallado — Conformidad (REQ-7)

```
POST /api/ordenes/{id}/conformidad + JWT
  → OrdenService.guardarConformidad
      → validar estado == pendienteConformidad             ← REQ-7.4
      → ot.setNotas(request.notas)                        ← REQ-7.1
      → ot.setFirmaBase64(request.firmaBase64)            ← REQ-7.1
      → historial.add("Finalizada con conformidad")       ← REQ-7.3
      → estado → finalizada                               ← REQ-7.2
      → save
  → OrdenResponse
```

---

## DTOs clave

**OrdenRequest** (REQ-3)
```json
{
  "tipoServicio": "Mantenimiento preventivo",
  "fechaProgramada": "2026-09-15",
  "descripcion": "Revisión completa del sistema de refrigeración",
  "clienteId": 1,
  "sedeId": 2,
  "equipoId": 3,
  "tecnicoId": 4,
  "prioridad": "alta",
  "duracionEstimadaMin": 90,
  "checklist": [{ "texto": "Verificar presión", "hecho": false }]
}
```

**ConformidadRequest** (REQ-7)
```json
{
  "notas": "Trabajo realizado correctamente",
  "firmaBase64": "data:image/png;base64,..."
}
```

**AuthResponse** (REQ-1)
```json
{
  "token": "<JWT HS256>",
  "username": "admin",
  "role": "ADMIN"
}
```

---

## Base de datos — Tablas

| Tabla | Descripción | REQ |
|---|---|---|
| `clientes` | Empresas clientes | REQ-2 |
| `sedes` | Instalaciones por cliente | REQ-2 |
| `equipos` | Activos físicos por sede | REQ-2, REQ-8 |
| `tecnicos` | Técnicos de campo | REQ-2, REQ-5 |
| `tecnico_especialidades` | `@ElementCollection` de especialidades | REQ-2 |
| `ordenes_trabajo` | Órdenes de trabajo — incluye `prioridad` y `duracion_estimada_min` | REQ-3, REQ-4 |
| `ot_checklist` | `@ElementCollection` — ítems de verificación | REQ-3, REQ-6 |
| `ot_fotos` | `@ElementCollection` — URLs de evidencia fotográfica | REQ-6 |
| `ot_historial` | `@ElementCollection` — log de eventos con timestamp | REQ-4, REQ-7, REQ-8 |
| `usuarios` | Cuentas de acceso con rol | REQ-1 |

---

## Pendientes / Extensiones futuras

- Subida de fotos a almacenamiento externo (S3 / similar) — actualmente se almacenan URLs
- Mantenimientos preventivos recurrentes con programación automática de OTs
- Notificaciones push/email al técnico al ser asignado a una OT
- Dashboard de métricas operativas para ADMIN
- App móvil para técnicos en campo (PWA o nativa)
