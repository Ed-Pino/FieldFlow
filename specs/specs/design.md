# Design — FieldFlow

## Visión general

FieldFlow es una plataforma web para la gestión centralizada de servicios técnicos en campo. La arquitectura sigue un modelo en capas clásico de Spring Boot (Controller → Service → Repository), con seguridad stateless basada en JWT y base de datos PostgreSQL.

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Backend | Java 17 · Spring Boot 4.x · Spring Security · Spring Data JPA |
| Autenticación | JWT (HS256) · OAuth2 Resource Server |
| Base de datos (prod) | PostgreSQL |
| Base de datos (test) | H2 (in-memory) |
| Documentación API | SpringDoc OpenAPI 3 (Swagger UI) |
| Build | Maven |
| Utilidades | Lombok |

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
  ├── especialidades: Set<String>
  ├── disponible: boolean
  └── ordenes: List<OrdenTrabajo>

OrdenTrabajo (Aggregate Root)
  ├── id: Long
  ├── codigo: String (único)
  ├── tipoServicio: String
  ├── estado: EstadoOT
  ├── fechaCreacion: LocalDateTime
  ├── fechaProgramada: LocalDate
  ├── descripcion: String
  ├── notas: String
  ├── firmaBase64: String
  ├── cliente: Cliente
  ├── sede: Sede
  ├── equipo: Equipo
  ├── tecnico: Tecnico
  ├── checklist: List<CheckItem>
  ├── fotos: List<String>  ← URLs
  └── historial: List<String> ← log de eventos

CheckItem (Embeddable)
  ├── texto: String
  └── hecho: boolean

Usuario
  ├── id: Long
  ├── username: String
  ├── password: String (BCrypt)
  └── role: String  ← "ADMIN" | "TECNICO"
```

### Estados de una Orden de Trabajo

```
pendiente → asignada → enCamino → enEjecucion → pendienteConformidad → finalizada
                                                                      ↘ reprogramada
```

---

## Arquitectura de capas

```
[ Cliente HTTP ]
      │
[ Controller ]  ← Valida entrada, delega al Service
      │
[ Service ]     ← Lógica de negocio, transacciones
      │
[ Repository ]  ← Spring Data JPA (interfaces)
      │
[ Base de datos ]  PostgreSQL / H2
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

| Método | Ruta | Roles | Descripción |
|---|---|---|---|
| POST | `/api/auth/login` | público | Autentica y devuelve JWT |
| POST | `/api/auth/register` | público | Registra nuevo usuario |

### Catálogo (solo lectura) — `/api`

| Método | Ruta | Roles | Descripción |
|---|---|---|---|
| GET | `/api/clientes` | ADMIN | Lista todos los clientes |
| GET | `/api/sedes?clienteId=` | ADMIN | Lista sedes (filtro opcional por cliente) |
| GET | `/api/equipos?sedeId=` | ADMIN | Lista equipos (filtro opcional por sede) |
| GET | `/api/tecnicos` | ADMIN | Lista todos los técnicos |

### Órdenes de Trabajo — `/api/ordenes`

| Método | Ruta | Roles | Descripción |
|---|---|---|---|
| GET | `/api/ordenes` | ADMIN, TECNICO | Lista todas las órdenes |
| GET | `/api/ordenes/{id}` | ADMIN, TECNICO | Detalle de una orden |
| GET | `/api/ordenes/{id}/trazabilidad` | ADMIN, TECNICO | Historial de intervenciones del equipo |
| POST | `/api/ordenes` | ADMIN | Crea nueva orden de trabajo |
| PUT | `/api/ordenes/{id}/estado` | ADMIN, TECNICO | Actualiza estado de la orden |
| POST | `/api/ordenes/{id}/conformidad` | ADMIN, TECNICO | Registra firma y notas de conformidad |

---

## DTOs clave

**OrdenRequest** — creación de OT
```json
{
  "tipoServicio": "Mantenimiento preventivo",
  "fechaProgramada": "2026-09-15",
  "descripcion": "Revisión completa del sistema de refrigeración",
  "clienteId": 1,
  "sedeId": 2,
  "equipoId": 3,
  "tecnicoId": 4,
  "checklist": [
    { "texto": "Verificar presión", "hecho": false }
  ]
}
```

**OrdenResponse** — respuesta completa de OT (incluye cliente, sede, equipo, técnico, checklist, fotos, historial)

**ConformidadRequest** — firma del cliente
```json
{
  "notas": "Trabajo realizado correctamente",
  "firmaBase64": "data:image/png;base64,..."
}
```

**AuthResponse**
```json
{
  "token": "<JWT>",
  "username": "admin",
  "role": "ADMIN"
}
```

---

## Base de datos — Tablas principales

| Tabla | Descripción |
|---|---|
| `clientes` | Empresas clientes |
| `sedes` | Instalaciones de cada cliente |
| `equipos` | Activos físicos en cada sede |
| `tecnicos` | Técnicos de campo disponibles |
| `tecnico_especialidades` | Especialidades por técnico (colección) |
| `ordenes_trabajo` | Órdenes de trabajo (núcleo) |
| `ot_checklist` | Ítems del checklist de cada OT |
| `ot_fotos` | URLs de fotos de evidencia por OT |
| `ot_historial` | Log de eventos por OT |
| `usuarios` | Cuentas de acceso al sistema |

---

## Seguridad

- Tokens JWT firmados con HS256 (secreto configurable vía `app.jwt.secret`)
- Passwords cifrados con BCrypt (factor 12)
- Sesiones stateless — sin cookies ni estado en servidor
- CORS configurado desde `CorsConfig`
- Autorización por método con `@PreAuthorize`

---

## Flujo principal — Ciclo de vida de una Orden de Trabajo

```
1. ADMIN crea OT (POST /api/ordenes)
     → estado: pendiente
     
2. ADMIN asigna técnico y actualiza estado (PUT /api/ordenes/{id}/estado)
     → estado: asignada
     
3. Técnico se desplaza (PUT estado)
     → estado: enCamino
     
4. Técnico inicia intervención (PUT estado)
     → estado: enEjecucion
     
5. Técnico completa trabajo, actualiza checklist/fotos/notas
     → estado: pendienteConformidad
     
6. Cliente firma conformidad (POST /api/ordenes/{id}/conformidad)
     → estado: finalizada
     
7. [Alternativo] OT se reprograma
     → estado: reprogramada
```

---

## Pendientes / Extensiones futuras

- Subida de fotos a almacenamiento externo (S3 / similar) — actualmente se almacenan URLs
- Mantenimientos preventivos recurrentes con programación automática
- Notificaciones push/email al técnico al asignar una OT
- Dashboard de métricas operativas para ADMIN
- App móvil para técnicos en campo
