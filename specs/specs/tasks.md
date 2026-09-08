# Tasks — FieldFlow

## Leyenda de estado
- [ ] Pendiente
- [x] Completado
- [-] En progreso

---

## Backend

### Autenticación y seguridad
- [x] Configurar Spring Security con JWT (HS256) y sesiones stateless
- [x] Implementar `AuthController` — POST /api/auth/login y /api/auth/register
- [x] Implementar `AuthService` — login con BCrypt y generación de JWT
- [x] Implementar `TokenService` — firma y validación de JWT
- [x] Definir roles ADMIN y TECNICO con autorización por endpoint
- [x] Configurar CORS desde `CorsConfig`

### Entidades y modelo de dominio
- [x] Crear entidad `Cliente` (nombre, nit, sedes)
- [x] Crear entidad `Sede` (nombre, dirección, ciudad, cliente, equipos)
- [x] Crear entidad `Equipo` (código, nombre, tipo, último mantenimiento, sede)
- [x] Crear entidad `Tecnico` (nombre, especialidades, disponible)
- [x] Crear entidad `OrdenTrabajo` con estados, relaciones y colecciones embebidas
- [x] Crear embeddable `CheckItem` (texto, hecho)
- [x] Crear entidad `Usuario` (username, password, role)

### Catálogo (solo lectura)
- [x] Implementar `CatalogoController` — GET /api/clientes, /sedes, /equipos, /tecnicos
- [x] Implementar `CatalogoService` con filtros opcionales por clienteId / sedeId
- [x] Implementar repositorios JPA: `ClienteRepository`, `SedeRepository`, `EquipoRepository`, `TecnicoRepository`

### Órdenes de Trabajo
- [x] Implementar `OrdenController` — GET, POST, PUT estado, POST conformidad, GET trazabilidad
- [x] Implementar `OrdenService` — lógica de negocio para creación, actualización y consulta
- [x] Implementar `OrdenTrabajoRepository`
- [x] Implementar `UsuarioRepository`
- [x] Implementar actualización de estado de OT (PUT /api/ordenes/{id}/estado)
- [x] Implementar registro de conformidad con firma base64 (POST /api/ordenes/{id}/conformidad)
- [x] Implementar trazabilidad de equipo — historial de OTs por equipo (GET /api/ordenes/{id}/trazabilidad)

### Configuración y datos
- [x] Configurar `DataSeeder` — datos iniciales de clientes, sedes, equipos, técnicos y usuarios
- [x] Configurar `OpenApiConfig` — Swagger UI con autenticación JWT
- [x] Configurar `GlobalExceptionHandler` — manejo centralizado de errores
- [x] Crear DTOs: `OrdenRequest`, `OrdenResponse`, `ConformidadRequest`, `EstadoRequest`, `AuthResponse`, `LoginRequest`, `RegisterRequest`, `ClienteResponse`, `SedeResponse`, `EquipoResponse`, `TecnicoResponse`

### Tests Backend
- [ ] Test: solo ADMIN puede crear una OT (POST /api/ordenes con rol TECNICO → 403)
- [ ] Test: TECNICO puede actualizar estado de OT propia
- [ ] Test: transición de estados válida — pendiente → asignada → enCamino → enEjecucion → pendienteConformidad → finalizada
- [ ] Test: transición a `reprogramada` válida desde cualquier estado activo
- [ ] Test: conformidad solo registrable cuando estado es `pendienteConformidad`
- [ ] Test: trazabilidad devuelve OTs del equipo ordenadas por fecha
- [ ] Test: creación de OT falla si cliente/sede/equipo no existen (404)
- [ ] Test: JWT inválido o expirado → 401 en endpoints protegidos
- [ ] Test: catálogo filtrado por clienteId devuelve solo sedes de ese cliente
- [ ] Test: catálogo filtrado por sedeId devuelve solo equipos de esa sede

---

## Frontend

### Autenticación
- [ ] Pantalla de Login (email/usuario + contraseña)
- [ ] Manejo y almacenamiento seguro del JWT en cliente
- [ ] Redirección post-login según rol (ADMIN → dashboard, TECNICO → mis órdenes)
- [ ] Logout y limpieza de sesión

### Dashboard ADMIN
- [ ] Vista principal con resumen de OTs por estado (pendiente, asignada, en ejecución, finalizada)
- [ ] Listado de OTs con filtros por estado, técnico, cliente y fecha
- [ ] Formulario de creación de OT — selección de cliente → sede → equipo → técnico
- [ ] Detalle de OT con toda la información (cliente, sede, equipo, técnico, checklist, fotos, historial)
- [ ] Actualización de estado desde el detalle de OT

### Vista TECNICO
- [ ] Listado de OTs asignadas al técnico autenticado
- [ ] Detalle de OT con instrucciones, checklist e información del equipo
- [ ] Actualización de estado desde la vista del técnico (enCamino, enEjecucion, pendienteConformidad)
- [ ] Registro de notas y observaciones en la OT
- [ ] Captura y adjunto de fotos de evidencia
- [ ] Pantalla de conformidad — firma del cliente y notas finales
- [ ] Vista de historial / trazabilidad del equipo

### Catálogo (ADMIN)
- [ ] Listado de clientes con sus sedes
- [ ] Listado de equipos por sede
- [ ] Listado de técnicos con especialidades y disponibilidad

---

## Pendientes / Extensiones futuras

- [ ] Subida de fotos a almacenamiento externo (S3 o similar) — actualmente se almacenan URLs
- [ ] Mantenimientos preventivos recurrentes con programación automática de OTs
- [ ] Notificaciones por email/push al técnico al ser asignado a una OT
- [ ] Dashboard de métricas operativas (OTs por período, técnico más activo, tiempo promedio de cierre)
- [ ] Filtro de técnicos disponibles al momento de asignar una OT
- [ ] App móvil para técnicos en campo (PWA o nativa)
