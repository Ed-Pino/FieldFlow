# Design — FieldFlow

## Visión general

FieldFlow es una plataforma web para la gestión centralizada de servicios técnicos en campo. La arquitectura sigue un modelo en capas clásico de Spring Boot (Controller → Service → Repository), con seguridad stateless basada en JWT y base de datos PostgreSQL.

Servidor: `:8081`

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
    [ SecurityFilterChain + JWT ]
              │
    ┌─────────────────────────┐
    │     Controller (REST)   │
    │  HomeController         │
    │  AuthController         │
    │  CatalogoController     │
    │  OrdenController        │
    └────────────┬────────────┘
                 │
    ┌────────────▼────────────┐
    │   Service (negocio)     │
    │  AuthService            │
    │  CatalogoService        │
    │  OrdenService           │  ← @Transactional
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
Cliente
  ├── id: Long
  ├── nombre: String
  ├── nit: String (único)
  └── sedes: List<Sede>

Sede
  ├── id: Long
  ├── nombre: String
  ├── direccion: String
  ├── ciudad: String
  ├── cliente: Cliente
  └── equipos: List<Equipo>

Equipo
  ├── id: Long
  ├── codigo: String (único)
  ├── nombre: String
  ├── tipo: String
  ├── ultimoMantenimiento: LocalDate
  ├── sede: Sede
  └── ordenes: List<OrdenTrabajo>

Tecnico
  ├── id: Long
  ├── nombre: String
  ├── especialidades: Set<String>  ← tabla tecnico_especialidades
  ├── disponible: boolean
  └── ordenes: List<OrdenTrabajo>

OrdenTrabajo (Aggregate Root)
  ├── id: Long
  ├── codigo: String (único, generado: "OT-100x")
  ├── tipoServicio: String
  ├── estado: EstadoOT
  ├── prioridad: Prioridad (baja | media | alta | urgente, default: media)
  ├── duracionEstimadaMin: Integer (minutos, nullable)
  ├── fechaCreacion: LocalDateTime
  ├── fechaProgramada: LocalDate
  ├── descripcion: String
  ├── notas: String
  ├── firmaBase64: String
  ├── cliente: Cliente
  ├── sede: Sede
  ├── equipo: Equipo
  ├── tecnico: Tecnico
  ├── checklist: List<CheckItem>   ← tabla ot_checklist
  ├── fotos: List<String>          ← tabla ot_fotos (URLs)
  └── historial: List<String>      ← tabla ot_historial (log de eventos)

CheckItem (Embeddable)
  ├── texto: String
  └── hecho: boolean

Usuario
  ├── id: Long
  ├── username: String (único)
  ├── password: String (BCrypt factor 12)
  └── role: String  ← "ADMIN" | "TECNICO"
```

### Estados de una Orden de Trabajo

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

Todas las transiciones a `reprogramada` son válidas desde: `asignada`, `enCamino`, `enEjecucion`, `pendienteConformidad`.
Una OT `reprogramada` puede volver a `pendiente`.

---

## Seguridad y autenticación

### Flujo de login y emisión de JWT

```
POST /api/auth/login {username, password}
  → AuthService.login
  → UsuarioRepository.findByUsername
      ├── no existe → BadCredentialsException (401)
      └── existe → BCrypt.matches
          ├── password incorrecto → 401
          └── OK → TokenService.generateToken
              → JwtEncoder HS256
                claims: iss=fieldflow, sub=username, role=ROLE_X, exp
              → AuthResponse {token, username, role}
```

### Validación de JWT en cada request

```
Authorization: Bearer <token>
  → SecurityConfig.oauth2ResourceServer
  → JwtDecoder (valida firma + expiración)
      ├── inválido → 401 invalid_token
      └── válido → JwtAuthenticationConverter
          → claim "role" → "ROLE_XXX"
          → evalúa reglas de rutas:
              /api/auth/**         → permitAll
              /swagger-ui/**       → permitAll
              /api/ordenes/**      → hasAnyRole(TECNICO, ADMIN)
              /api/**              → hasRole(ADMIN)
          → @PreAuthorize a nivel de método (create OT → solo ADMIN)
```

### Roles y autorización

| Rol | Permisos |
|---|---|
| `ADMIN` | Acceso completo a todos los endpoints `/api/**` |
| `TECNICO` | Acceso a `/api/ordenes/**` (lectura + actualización de estado + conformidad) |
| Anónimo | Solo `/api/auth/**` y documentación Swagger |

---

## API Endpoints

### Autenticación — `/api/auth`

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| POST | `/api/auth/login` | público | Autentica, devuelve JWT |
| POST | `/api/auth/register` | público | Registra usuario, devuelve JWT |

### Catálogo — `/api`

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| GET | `/api/clientes` | ADMIN | Lista clientes |
| GET | `/api/sedes?clienteId=` | ADMIN | Lista sedes (filtro opcional) |
| GET | `/api/equipos?sedeId=` | ADMIN | Lista equipos (filtro opcional) |
| GET | `/api/tecnicos` | ADMIN | Lista todos los técnicos |
| GET | `/api/tecnicos/disponibles` | ADMIN | Lista técnicos con `disponible=true` |

### Órdenes de Trabajo — `/api/ordenes`

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| GET | `/api/ordenes` | ADMIN, TECNICO | Lista todas las órdenes |
| GET | `/api/ordenes/{id}` | ADMIN, TECNICO | Detalle de una orden |
| GET | `/api/ordenes/{id}/trazabilidad` | ADMIN, TECNICO | OTs del mismo equipo (historial) |
| GET | `/api/ordenes/agenda/{tecnicoId}` | ADMIN, TECNICO | Agenda del técnico ordenada por fecha programada |
| POST | `/api/ordenes` | ADMIN | Crea OT (código auto, estado=pendiente, historial inicializado) |
| PUT | `/api/ordenes/{id}/estado` | ADMIN, TECNICO | Cambia estado |
| POST | `/api/ordenes/{id}/conformidad` | ADMIN, TECNICO | Guarda notas + firma, registra evento en historial |

---

## Flujo detallado — Crear Orden de Trabajo

```
POST /api/ordenes + JWT ADMIN
  → SecurityFilterChain (valida token)
  → OrdenController.create (@PreAuthorize ADMIN)
  → OrdenService.create (@Transactional)
      → ClienteRepository.findById   ← 404 si no existe
      → SedeRepository.findById      ← 404 si no existe
      → EquipoRepository.findById    ← 404 si no existe
      → TecnicoRepository.findById   ← 404 si no existe (opcional)
      → genera código "OT-100x"
      → new OrdenTrabajo(estado=pendiente)
      → setChecklist(items del request)
      → historial.add("OT creada")
      → OrdenTrabajoRepository.save
      → OrdenResponse.from(ot)  ← materializa colecciones lazy
  → 201 Created + OrdenResponse JSON
```

## Flujo detallado — Conformidad

```
POST /api/ordenes/{id}/conformidad + JWT
  → OrdenService.guardarConformidad
      → ot.setNotas(request.notas)
      → ot.setFirmaBase64(request.firmaBase64)
      → historial.add("Finalizada con conformidad")
      → estado → finalizada
      → save
  → OrdenResponse
```

---

## DTOs clave

**OrdenRequest**
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

**ConformidadRequest**
```json
{
  "notas": "Trabajo realizado correctamente",
  "firmaBase64": "data:image/png;base64,..."
}
```

**AuthResponse**
```json
{
  "token": "<JWT HS256>",
  "username": "admin",
  "role": "ADMIN"
}
```

---

## Base de datos — Tablas

| Tabla | Descripción |
|---|---|
| `clientes` | Empresas clientes |
| `sedes` | Instalaciones por cliente |
| `equipos` | Activos físicos por sede |
| `tecnicos` | Técnicos de campo |
| `tecnico_especialidades` | `@ElementCollection` de especialidades |
| `ordenes_trabajo` | Órdenes de trabajo (núcleo) — incluye `prioridad` y `duracion_estimada_min` |
| `ot_checklist` | `@ElementCollection` — ítems checklist |
| `ot_fotos` | `@ElementCollection` — URLs de fotos |
| `ot_historial` | `@ElementCollection` — log de eventos |
| `usuarios` | Cuentas de acceso |

---

## Pendientes / Extensiones futuras

- Subida de fotos a almacenamiento externo (S3 / similar) — actualmente se almacenan URLs
- Mantenimientos preventivos recurrentes con programación automática de OTs
- Notificaciones push/email al técnico al ser asignado a una OT
- Dashboard de métricas operativas para ADMIN
- Filtro de técnicos disponibles al asignar una OT
- App móvil para técnicos en campo (PWA o nativa)
