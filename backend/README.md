# FieldFlow Backend

REST API para **FieldFlow**, la plataforma centralizada de gestión de servicios técnicos en campo. Cubre autenticación con roles (TECNICO/ADMIN), gestión de órdenes de trabajo, asignación de técnicos, seguimiento de estados, trazabilidad de equipos, checklists, evidencia fotográfica, y conformidad con firma del cliente.

## Stack

- **Java 17** (compatible con Java 21 LTS)
- **Spring Boot 4.1.1**
- **Spring Security 7** (JWT HS256 vía OAuth2 Resource Server, control de acceso por rol)
- **Spring Data JPA / Hibernate**
- **PostgreSQL** (perfil por defecto) / **H2** (perfil demo)
- **Maven Wrapper** (Maven 4+)
- **Springdoc OpenAPI 3 / Swagger UI**
- Tests con JUnit 5 + Spring Boot Test

---

## Estructura del proyecto

```
src/main/java/com/fieldflow/backend/
  config/      → CorsConfig, OpenApiConfig (Swagger), DataSeeder
  controller/  → AuthController, CatalogoController, OrdenController, HomeController
  dto/         → records de request/response
  entity/      → entidades JPA (Usuario, Cliente, Sede, Equipo, Tecnico, OrdenTrabajo, CheckItem)
  exception/   → GlobalExceptionHandler (400/401/403/404/500)
  repository/  → repositorios Spring Data JPA
  security/    → SecurityConfig, TokenService
  service/     → AuthService, CatalogoService, OrdenService
```

---

## Endpoints

### Autenticación — `/api/auth` (público)

```
POST /api/auth/login      → {token, username, role}
POST /api/auth/register   → crea usuario (role: TECNICO | ADMIN)
```

### Catálogo — `/api` (ADMIN)

```
GET /api/clientes
GET /api/sedes?clienteId=
GET /api/equipos?sedeId=
GET /api/tecnicos
GET /api/tecnicos/disponibles   → filtra técnicos con disponible=true
```

### Órdenes de Trabajo — `/api/ordenes` (TECNICO + ADMIN)

```
GET  /api/ordenes                       → lista todas las órdenes
GET  /api/ordenes/{id}                  → detalle de una orden
GET  /api/ordenes/{id}/trazabilidad     → historial de OTs del mismo equipo
GET  /api/ordenes/agenda/{tecnicoId}    → agenda del técnico ordenada por fecha programada
POST /api/ordenes                       → crea OT (solo ADMIN)
PUT  /api/ordenes/{id}/estado           → actualiza estado
POST /api/ordenes/{id}/conformidad      → guarda notas + firma del cliente, finaliza OT
```

### Acceso rápido

```
GET /  → redirect 302 → Swagger UI
```

- Swagger UI: http://localhost:8081/swagger-ui.html
- OpenAPI JSON: http://localhost:8081/v3/api-docs

---

## Modelo de Orden de Trabajo

Campos principales al crear una OT (`POST /api/ordenes`):

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
  "checklist": [
    { "texto": "Verificar presión", "hecho": false }
  ]
}
```

**Valores de `prioridad`:** `baja` · `media` *(default)* · `alta` · `urgente`

### Ciclo de estados

```
pendiente → asignada → enCamino → enEjecucion → pendienteConformidad → finalizada
                │           │           │                │
                └───────────┴───────────┴────────────────┘
                                    ↓
                              reprogramada → pendiente
```

---

## Pruebas con Swagger UI

1. Iniciar el backend (perfil demo recomendado):
   ```
   .\mvnw.cmd "-Dspring-boot.run.profiles=demo" spring-boot:run
   ```
2. Abrir **http://localhost:8081/swagger-ui.html**
3. Login: `POST /api/auth/login` con credenciales de seed → obtener `token`
4. Click en **Authorize** (arriba a la derecha) y pegar el JWT sin comillas, sin espacios, sin prefijo `Bearer` — Swagger lo agrega automáticamente.
5. Ejecutar endpoints desde la UI.

### Flujo de validación sugerido

| # | Endpoint | Resultado esperado |
|---|---|---|
| 1 | `POST /api/auth/login` (admin) | 200 → JWT + role ADMIN |
| 2 | `GET /api/clientes`, `/sedes`, `/equipos`, `/tecnicos` | 200 (datos seed) |
| 3 | `GET /api/tecnicos/disponibles` | 200 (técnicos disponibles) |
| 4 | `GET /api/ordenes` | 200 (OT-1001 con checklist) |
| 5 | `POST /api/ordenes` (ADMIN, con `prioridad` y `duracionEstimadaMin`) | 201 → nueva OT |
| 6 | `GET /api/ordenes/{id}` | 200 → detalle completo |
| 7 | `PUT /api/ordenes/{id}/estado` | 200 → estado actualizado |
| 8 | `GET /api/ordenes/{id}/trazabilidad` | 200 → historial del equipo |
| 9 | `GET /api/ordenes/agenda/{tecnicoId}` | 200 → agenda ordenada por fecha |
| 10 | `POST /api/ordenes/{id}/conformidad` | 200 → OT finalizada con firma |
| 11 | `POST /api/ordenes` como **tecnico1** | **403** (solo ADMIN) |
| 12 | `GET /api/ordenes` sin token | **401** |

Verificar también: credenciales incorrectas → **401**, ruta inexistente → **404**, `GET /` → redirect a Swagger.

### Usuarios seed (perfil demo)

| Username | Password | Rol |
|---|---|---|
| `admin` | `admin123` | ADMIN |
| `tecnico1` | `tecnico123` | TECNICO |
| `tecnico2` | `tecnico123` | TECNICO |

---

## Seguridad

- JWT stateless firmado con HS256 (`spring-boot-starter-oauth2-resource-server`)
- Claim `role` mapeado a authorities de Spring: `ROLE_TECNICO`, `ROLE_ADMIN`
- Rutas protegidas via `SecurityFilterChain` + `@PreAuthorize`
- Passwords hasheados con BCrypt (factor 12)
- CORS habilitado para el frontend React
- 401 para tokens ausentes/inválidos, 403 para violaciones de rol

---

## Ejecutar

Prerequisito: JDK 17+. No se requiere Maven instalado (wrapper incluido).

```bash
# Perfil demo (H2 in-memory, seed automático, sin base de datos externa):
.\mvnw.cmd "-Dspring-boot.run.profiles=demo" spring-boot:run

# Perfil por defecto (PostgreSQL):
#   - crear DB: fieldflow
#   - ajustar credenciales en application.yaml
.\mvnw.cmd spring-boot:run
```

La API corre en **http://localhost:8081**.

---

## Configuración

- `src/main/resources/application.yaml` — perfil default: URL/credenciales PostgreSQL, puerto 8081, JWT secret (`app.jwt.secret`) y expiración (`app.jwt.expiration-ms`).
- `src/main/resources/application-demo.yaml` — perfil demo: H2 in-memory, `ddl-auto: create-drop`.

> Usar una variable de entorno segura para `app.jwt.secret` en producción.

---

## Build y tests

```bash
# Ejecutar todos los tests (perfil demo para evitar DB externa):
.\mvnw.cmd "-Dspring.profiles.active=demo" test

# Empaquetar el jar:
.\mvnw.cmd "-Dspring.profiles.active=demo" package
# Output: target/backend-0.0.1-SNAPSHOT.jar

# Correr el jar empaquetado:
java -jar target/backend-0.0.1-SNAPSHOT.jar --spring.profiles.active=demo
```
