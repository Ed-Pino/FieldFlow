# Tasks — FieldFlow

## Leyenda de estado
- [ ] Pendiente
- [x] Completado
- [-] En progreso

---

## Backend

### Autenticación y seguridad
- [x] Configurar Spring Security con JWT (HS256) y sesiones stateless
- [x] Configurar `SecurityFilterChain` — reglas de rutas por rol (`/api/auth/**` público, `/api/ordenes/**` TECNICO+ADMIN, `/api/**` solo ADMIN)
- [x] Implementar `AuthController` — POST `/api/auth/login` y `/api/auth/register`
- [x] Implementar `AuthService` — login con BCrypt (factor 12) + `BadCredentialsException` → 401
- [x] Implementar `TokenService` — generación de JWT con claims `iss=fieldflow`, `sub=username`, `role`, `exp`
- [x] Implementar `JwtAuthenticationConverter` — mapea claim `role` a `ROLE_XXX`
- [x] Configurar CORS desde `CorsConfig`

### Entidades y modelo de dominio
- [x] Crear entidad `Cliente` (nombre, nit único, sedes)
- [x] Crear entidad `Sede` (nombre, dirección, ciudad, cliente, equipos)
- [x] Crear entidad `Equipo` (código único, nombre, tipo, último mantenimiento, sede)
- [x] Crear entidad `Tecnico` (nombre, especialidades, disponible)
- [x] Crear entidad `OrdenTrabajo` con enum `EstadoOT` (7 estados), relaciones y colecciones embebidas
- [x] Crear embeddable `CheckItem` (texto, hecho)
- [x] Crear entidad `Usuario` (username único, password BCrypt, role)
- [ ] Agregar campo `prioridad: Prioridad` (enum `baja|media|alta|urgente`, default `media`) a `OrdenTrabajo`
- [ ] Agregar campo `duracionEstimadaMin: Integer` (nullable) a `OrdenTrabajo`
- [ ] Exponer `prioridad` y `duracionEstimadaMin` en `OrdenRequest` y `OrdenResponse`

### Catálogo (solo lectura)
- [x] Implementar `CatalogoController` — GET `/api/clientes`, `/sedes`, `/equipos`, `/tecnicos`
- [x] Implementar `CatalogoService` con filtros opcionales por `clienteId` / `sedeId`
- [x] Implementar repositorios JPA: `ClienteRepository`, `SedeRepository`, `EquipoRepository`, `TecnicoRepository`
- [ ] Implementar GET `/api/tecnicos/disponibles` — filtra por `disponible=true` (`TecnicoRepository.findByDisponibleTrue` ya existe)

### Órdenes de Trabajo
- [x] Implementar `OrdenController` — GET lista, GET detalle, POST crear, PUT estado, POST conformidad, GET trazabilidad
- [x] Implementar `OrdenService.create` — generación de código automático `OT-100x`, estado inicial `pendiente`, inicialización de historial con `"OT creada"`, materialización de colecciones lazy en `OrdenResponse`
- [x] Implementar `OrdenService.updateEstado` — cambio de estado con validación de transiciones
- [x] Implementar `OrdenService.guardarConformidad` — guarda `notas` + `firmaBase64`, registra `"Finalizada con conformidad"` en historial, cambia estado a `finalizada`
- [x] Implementar `OrdenService.getTrazabilidadDeEquipo` — historial de OTs del mismo equipo
- [x] Implementar `OrdenTrabajoRepository`
- [x] Implementar `UsuarioRepository`
- [ ] Implementar GET `/api/ordenes/agenda/{tecnicoId}` — OTs del técnico ordenadas por `fechaProgramada` ASC
- [ ] Agregar `findByTecnicoIdOrderByFechaProgramadaAsc` en `OrdenTrabajoRepository`

### Configuración y datos
- [x] Implementar `HomeController`
- [x] Configurar `DataSeeder` — datos iniciales de clientes, sedes, equipos, técnicos y usuarios
- [x] Configurar `OpenApiConfig` — Swagger UI con autenticación JWT Bearer
- [x] Configurar `GlobalExceptionHandler` — 401 / 403 / 400 / 404 / 500
- [x] Crear DTOs: `OrdenRequest`, `OrdenResponse`, `ConformidadRequest`, `EstadoRequest`, `AuthResponse`, `LoginRequest`, `RegisterRequest`, `ClienteResponse`, `SedeResponse`, `EquipoResponse`, `TecnicoResponse`

### Lógica de transiciones de estado (pendiente de validación explícita)
- [ ] Validar que `reprogramada` solo se permite desde: `asignada`, `enCamino`, `enEjecucion`, `pendienteConformidad`
- [ ] Validar que una OT `reprogramada` puede volver a `pendiente`
- [ ] Validar que `conformidad` solo se puede registrar cuando el estado es `pendienteConformidad`

### Tests Backend
- [ ] Test: solo ADMIN puede crear una OT (`POST /api/ordenes` con rol TECNICO → 403)
- [ ] Test: TECNICO puede actualizar estado de una OT
- [ ] Test: transición válida — `pendiente → asignada → enCamino → enEjecucion → pendienteConformidad → finalizada`
- [ ] Test: `reprogramada` válida desde `asignada`, `enCamino`, `enEjecucion`, `pendienteConformidad`
- [ ] Test: OT `reprogramada` puede volver a `pendiente`
- [ ] Test: conformidad rechazada si estado ≠ `pendienteConformidad`
- [ ] Test: al crear OT el historial contiene `"OT creada"`
- [ ] Test: al guardar conformidad el historial contiene `"Finalizada con conformidad"`
- [ ] Test: código de OT generado automáticamente con formato `OT-100x`
- [ ] Test: `prioridad` por defecto es `media` si no se envía en el request
- [ ] Test: agenda del técnico devuelve OTs ordenadas por `fechaProgramada` ASC
- [ ] Test: `/api/tecnicos/disponibles` solo devuelve técnicos con `disponible=true`
- [ ] Test: trazabilidad devuelve OTs del mismo equipo ordenadas por fecha
- [ ] Test: creación de OT falla con 404 si cliente/sede/equipo no existen
- [ ] Test: JWT inválido o expirado → 401 en endpoints protegidos
- [ ] Test: catálogo filtrado por `clienteId` devuelve solo sedes de ese cliente
- [ ] Test: catálogo filtrado por `sedeId` devuelve solo equipos de esa sede

---

## Frontend

### Autenticación
- [ ] Pantalla de Login (username + contraseña)
- [ ] Almacenamiento seguro del JWT en cliente
- [ ] Redirección post-login según rol (ADMIN → dashboard, TECNICO → mis órdenes)
- [ ] Logout y limpieza de sesión

### Dashboard ADMIN
- [ ] Vista principal con resumen de OTs por estado (pendiente, asignada, en ejecución, finalizada)
- [ ] Listado de OTs con filtros por estado, técnico, cliente y fecha
- [ ] Formulario de creación de OT — selección encadenada: cliente → sede → equipo → técnico disponible (usando `/api/tecnicos/disponibles`)
- [ ] Soporte para `prioridad` y `duracionEstimadaMin` en el formulario de creación
- [ ] Detalle de OT con información completa (cliente, sede, equipo, técnico, checklist, fotos, historial de eventos)
- [ ] Actualización de estado desde el detalle de OT

### Vista TECNICO
- [ ] Listado de OTs asignadas al técnico autenticado
- [ ] Agenda del técnico — OTs ordenadas por fecha programada (`GET /api/ordenes/agenda/{tecnicoId}`)
- [ ] Detalle de OT con instrucciones, checklist e información del equipo
- [ ] Actualización de estado (`enCamino`, `enEjecucion`, `pendienteConformidad`)
- [ ] Registro de notas y observaciones en la OT
- [ ] Captura y adjunto de fotos de evidencia
- [ ] Pantalla de conformidad — firma digital del cliente + notas finales
- [ ] Vista de historial / trazabilidad del equipo

### Catálogo (ADMIN)
- [ ] Listado de clientes con sus sedes
- [ ] Listado de equipos por sede con fecha de último mantenimiento
- [ ] Listado de técnicos con especialidades y disponibilidad

---

## Pendientes / Extensiones futuras

- [ ] Subida de fotos a almacenamiento externo (S3 o similar) — actualmente se almacenan URLs
- [ ] Mantenimientos preventivos recurrentes con programación automática de OTs
- [ ] Notificaciones por email/push al técnico al ser asignado a una OT
- [ ] Dashboard de métricas operativas (OTs por período, técnico más activo, tiempo promedio de cierre)
- [ ] App móvil para técnicos en campo (PWA o nativa)
