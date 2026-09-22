# Tasks — FieldFlow

## Leyenda de estado
- [ ] Pendiente
- [x] Completado
- [-] En progreso

---

## Backend

### REQ-1 · Autenticación y seguridad
- [x] Configurar Spring Security con JWT (HS256) y sesiones stateless
- [x] Configurar `SecurityFilterChain` — reglas de rutas por rol (`/api/auth/**` público, `/api/ordenes/**` TECNICO+ADMIN, `/api/**` solo ADMIN)
- [x] Implementar `AuthController` — POST `/api/auth/login` y `/api/auth/register`
- [x] Implementar `AuthService` — login con BCrypt (factor 12) + `BadCredentialsException` → 401
- [x] Implementar `TokenService` — generación de JWT con claims `iss=fieldflow`, `sub=username`, `role`, `exp`
- [x] Implementar `JwtAuthenticationConverter` — mapea claim `role` a `ROLE_XXX`
- [x] Configurar CORS desde `CorsConfig`

### REQ-2 · Catálogo
- [x] Implementar `CatalogoController` — GET `/api/clientes`, `/sedes`, `/equipos`, `/tecnicos`
- [x] Implementar `CatalogoService` con filtros opcionales por `clienteId` / `sedeId`
- [x] Implementar repositorios JPA: `ClienteRepository`, `SedeRepository`, `EquipoRepository`, `TecnicoRepository`
- [x] Implementar GET `/api/tecnicos/disponibles` — filtra por `disponible=true` (REQ-2.5)

### Entidades y modelo de dominio (REQ-2, REQ-3)
- [x] Crear entidad `Cliente` (nombre, nit único, sedes)
- [x] Crear entidad `Sede` (nombre, dirección, ciudad, cliente, equipos)
- [x] Crear entidad `Equipo` (código único, nombre, tipo, último mantenimiento, sede)
- [x] Crear entidad `Tecnico` (nombre, especialidades, disponible)
- [x] Crear entidad `OrdenTrabajo` con enum `EstadoOT` (7 estados), relaciones y colecciones embebidas
- [x] Crear embeddable `CheckItem` (texto, hecho)
- [x] Crear entidad `Usuario` (username único, password BCrypt, role)
- [x] Agregar campo `prioridad: Prioridad` (enum `baja|media|alta|urgente`, default `media`) a `OrdenTrabajo` (REQ-3.6)
- [x] Agregar campo `duracionEstimadaMin: Integer` (nullable) a `OrdenTrabajo` (REQ-3.7)
- [x] Exponer `prioridad` y `duracionEstimadaMin` en `OrdenRequest` y `OrdenResponse`

### REQ-3 · Creación de Órdenes de Trabajo
- [x] Implementar `OrdenController.create` — POST `/api/ordenes` con `@PreAuthorize ADMIN` (REQ-3.1)
- [x] Implementar `OrdenService.create` — generación de código `OT-100x` (REQ-3.4), estado inicial `pendiente` (REQ-3.5), checklist del request (REQ-3.8), historial inicializado con `"OT creada"` (REQ-3.9), materialización lazy
- [x] Validar existencia de cliente, sede, equipo y técnico → 404 si no existen (REQ-3.10)
- [x] Aplicar `prioridad` por defecto `media` si no se envía en el request (REQ-3.6)

### REQ-4 · Seguimiento de estados
- [x] Implementar `OrdenService.updateEstado` — cambio de estado con registro en historial (REQ-4.5)
- [x] Validar que `reprogramada` solo se permite desde: `asignada`, `enCamino`, `enEjecucion`, `pendienteConformidad` (REQ-4.3)
- [x] Validar que una OT `reprogramada` puede volver a `pendiente` (REQ-4.4)
- [x] Validar transiciones inválidas → 400 (REQ-4.2, REQ-4.3, REQ-4.4)

### REQ-5 · Agenda del técnico
- [x] Implementar GET `/api/ordenes/agenda/{tecnicoId}` — OTs ordenadas por `fechaProgramada` ASC (REQ-5.1, REQ-5.2)
- [x] Agregar `findByTecnicoIdOrderByFechaProgramadaAsc` en `OrdenTrabajoRepository`

### REQ-6 · Registro de evidencia
- [x] Campo `notas` en `OrdenTrabajo` para observaciones del técnico (REQ-6.1)
- [x] `CheckItem` embeddable con campo `hecho` para marcar ítems completados (REQ-6.2)
- [x] Campo `fotos` (List de URLs) en `OrdenTrabajo` para evidencia fotográfica (REQ-6.3)
- [x] Implementar PUT `/api/ordenes/{id}/evidencia` — registra notas, checklist y fotos en OT existente (REQ-6.1, REQ-6.2, REQ-6.3)

### REQ-7 · Conformidad del cliente
- [x] Implementar `OrdenService.guardarConformidad` — guarda `notas` + `firmaBase64` (REQ-7.1), cambia estado a `finalizada` (REQ-7.2), registra `"Finalizada con conformidad"` en historial (REQ-7.3)
- [x] Validar que conformidad solo se registra cuando estado es `pendienteConformidad` (REQ-7.4)

### REQ-8 · Trazabilidad del equipo
- [x] Implementar `OrdenService.getTrazabilidadDeEquipo` — OTs del mismo equipo ordenadas por fecha DESC (REQ-8.1, REQ-8.2)
- [x] Implementar GET `/api/ordenes/{id}/trazabilidad`

### Configuración y datos
- [x] Implementar `HomeController`
- [x] Configurar `DataSeeder` — datos iniciales de clientes, sedes, equipos, técnicos y usuarios
- [x] Configurar `OpenApiConfig` — Swagger UI con autenticación JWT Bearer
- [x] Configurar `GlobalExceptionHandler` — 401 / 403 / 400 / 404 / 500
- [x] Implementar `OrdenTrabajoRepository`
- [x] Implementar `UsuarioRepository`
- [x] Crear DTOs: `OrdenRequest`, `OrdenResponse`, `ConformidadRequest`, `EstadoRequest`, `AuthResponse`, `LoginRequest`, `RegisterRequest`, `ClienteResponse`, `SedeResponse`, `EquipoResponse`, `TecnicoResponse`

### Tests Backend
- [x] Test: solo ADMIN puede crear una OT — rol TECNICO → 403 (REQ-1.5, REQ-3.1)
- [x] Test: credenciales incorrectas → 401 (REQ-1.2)
- [x] Test: JWT inválido o expirado → 401 (REQ-1.4)
- [x] Test: TECNICO no puede acceder a catálogo → 403 (REQ-1.5)
- [x] Test: catálogo filtrado por `clienteId` devuelve solo sedes de ese cliente (REQ-2.2)
- [x] Test: catálogo filtrado por `sedeId` devuelve solo equipos de esa sede (REQ-2.3)
- [x] Test: `/api/tecnicos/disponibles` solo devuelve técnicos con `disponible=true` (REQ-2.5)
- [x] Test: creación de OT falla con 404 si cliente/sede/equipo no existen (REQ-3.10)
- [x] Test: código de OT generado automáticamente con formato `OT-100x` (REQ-3.4)
- [x] Test: OT creada con estado `pendiente` (REQ-3.5)
- [x] Test: `prioridad` por defecto es `media` si no se envía (REQ-3.6)
- [x] Test: historial contiene `"OT creada"` al crear (REQ-3.9)
- [x] Test: transición válida — `pendiente → asignada → enCamino → enEjecucion → pendienteConformidad → finalizada` (REQ-4.2)
- [x] Test: `reprogramada` válida desde `asignada`, `enCamino`, `enEjecucion`, `pendienteConformidad` (REQ-4.3)
- [x] Test: OT `reprogramada` puede volver a `pendiente` (REQ-4.4)
- [x] Test: cambio de estado registra evento con timestamp en historial (REQ-4.5)
- [x] Test: agenda del técnico devuelve OTs ordenadas por `fechaProgramada` ASC (REQ-5.2)
- [x] Test: conformidad rechazada si estado ≠ `pendienteConformidad` (REQ-7.4)
- [x] Test: conformidad cambia estado a `finalizada` y registra `"Finalizada con conformidad"` (REQ-7.2, REQ-7.3)
- [x] Test: evidencia (notas, checklist, fotos) se registra en OT existente y queda en historial (REQ-6)
- [x] Test: trazabilidad devuelve OTs del mismo equipo ordenadas por fecha DESC (REQ-8.1, REQ-8.2)

---

## Frontend

- [x] Inicializar proyecto Frontend (Vite + React + PWA, proxy `/api` → `:8081`) — [#12](https://github.com/No-Country-simulation/S8-6-Team-8-FieldFlow/issues/12)

### REQ-1 · Autenticación
- [ ] Pantalla de Login (username + contraseña)
- [ ] Almacenamiento seguro del JWT en cliente
- [ ] Redirección post-login según rol (ADMIN → dashboard, TECNICO → mis órdenes)
- [ ] Logout y limpieza de sesión

### REQ-2 · Catálogos (ADMIN)
- [ ] Listado de clientes con sus sedes
- [ ] Listado de equipos por sede con fecha de último mantenimiento
- [ ] Listado de técnicos con especialidades y disponibilidad

### REQ-3 · Gestión de OTs (ADMIN)
- [ ] Vista principal con resumen de OTs por estado (pendiente, asignada, en ejecución, finalizada)
- [ ] Listado de OTs con filtros por estado, técnico, cliente y fecha
- [ ] Formulario de creación de OT — selección encadenada: cliente → sede → equipo → técnico disponible
- [ ] Soporte para `prioridad` y `duracionEstimadaMin` en el formulario
- [ ] Detalle de OT con toda la información (cliente, sede, equipo, técnico, checklist, fotos, historial)

### REQ-4 · Seguimiento de estados
- [ ] Actualización de estado desde el detalle de OT (ADMIN)
- [ ] Actualización de estado desde la vista del técnico (`enCamino`, `enEjecucion`, `pendienteConformidad`)

### REQ-5 · Agenda del técnico
- [ ] Agenda del técnico — OTs ordenadas por fecha programada (GET `/api/ordenes/agenda/{tecnicoId}`)

### REQ-6 · Registro de evidencia (TECNICO)
- [ ] Detalle de OT con instrucciones y checklist interactivo
- [ ] Registro de notas y observaciones en la OT
- [ ] Captura y adjunto de fotos de evidencia

### REQ-7 · Conformidad del cliente (TECNICO)
- [ ] Pantalla de conformidad — firma digital del cliente + notas finales

### REQ-8 · Trazabilidad (ADMIN + TECNICO)
- [ ] Vista de historial / trazabilidad del equipo desde el detalle de OT

---

## Pendientes / Extensiones futuras

- [ ] Subida de fotos a almacenamiento externo (S3 o similar) — actualmente se almacenan URLs
- [ ] Mantenimientos preventivos recurrentes con programación automática de OTs
- [ ] Notificaciones por email/push al técnico al ser asignado a una OT
- [ ] Dashboard de métricas operativas (OTs por período, técnico más activo, tiempo promedio de cierre)
- [ ] App móvil para técnicos en campo (PWA o nativa)
