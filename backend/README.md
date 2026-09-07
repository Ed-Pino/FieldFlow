# FieldFlow Backend

REST API for **FieldFlow**, the centralized platform for managing field technical services. Handles authentication with roles (TECNICO/ADMIN), work-order management, technician assignment, state tracking and trazability, checklists, photographic evidence, and conformity sign-off with client signature.

## Stack

- **Java 17** (tested with Java 21 LTS)
- **Spring Boot 4.1.1**
- **Spring Security 7** (JWT via resource server, role-based access)
- **Spring Data JPA / Hibernate**
- **PostgreSQL** (default profile) / **H2** (demo profile)
- **Maven wrapper** (Maven 4 +)
- **Springdoc OpenAPI 3 / Swagger UI**
- Tests with JUnit 5 + Spring Boot Test

## Project structure

```
src/main/java/com/fieldflow/backend/
  config/      → CorsConfig, OpenApiConfig (Swagger), DataSeeder
  controller/  → AuthController, CatalogoController, OrdenController, HomeController
  dto/         → request/response records
  entity/      → JPA entities (Usuario, Cliente, Sede, Equipo, Tecnico, OrdenTrabajo, CheckItem)
  exception/   → GlobalExceptionHandler (400/401/403/404/500)
  repository/  → Spring Data JPA repositories
  security/    → SecurityConfig, TokenService
  service/     → AuthService, CatalogoService, OrdenService
```

## Endpoints

### Auth
```
POST /api/auth/login        → {token, username, rol}
POST /api/auth/register     → create user (rol: TECNICO | ADMIN)
```

### Work orders
```
GET  /api/ordenes                    → list work orders (TECNICO/ADMIN)
GET  /api/ordenes/{id}               → detail
GET  /api/ordenes/{id}/trazabilidad  → history by equipment
POST /api/ordenes                    → create (ADMIN only)
PUT  /api/ordenes/{id}/estado        → update state
POST /api/ordenes/{id}/conformidad   → notes + signature (finalizes OT)
```

### Catalogs (ADMIN)
```
GET /api/clientes
GET /api/sedes?clienteId=
GET /api/equipos?sedeId=
GET /api/tecnicos
```

## Quick access

```
GET /  → 302 redirect → Swagger UI
```

- Swagger UI: http://localhost:8081/swagger-ui.html
- OpenAPI JSON: http://localhost:8081/v3/api-docs

## Testing with Swagger

The API can be fully tested from the interactive Swagger UI.

1. Start the backend (demo profile recommended): `.\mvnw.cmd "-Dspring-boot.run.profiles=demo" spring-boot:run`
2. Open **http://localhost:8081/swagger-ui.html**.
3. Login: `POST /api/auth/login` with seed credentials (see table below) → returns `{token, username, rol}`.
4. Click **Authorize** (top right) and paste **only the raw JWT** (no quotes, no spaces, no `Bearer` prefix). Swagger appends `Bearer ` automatically — pasting extra characters results in `401 Bearer token is malformed`.
5. Execute the endpoints from Swagger UI.

### Validation flow

| # | Endpoint | Expected result |
|---|----------|-----------------|
| 1 | `POST /api/auth/login` (admin) | 200 → JWT + rol ADMIN |
| 2 | `GET /api/clientes`, `/sedes`, `/equipos`, `/tecnicos` | 200 (seed data) |
| 3 | `GET /api/ordenes` | 200 (OT-1001 with checklist) |
| 4 | `POST /api/ordenes` (ADMIN) | 201 → new OT |
| 5 | `GET /api/ordenes/{id}` | 200 → detail |
| 6 | `PUT /api/ordenes/{id}/estado` | 200 → state changed |
| 7 | `GET /api/ordenes/{id}/trazabilidad` | 200 → history by equipment |
| 8 | `POST /api/ordenes/{id}/conformidad` | 200 → OT finalized |
| 9 | `POST /api/ordenes` as **tecnico1** | **403** (ADMIN only) |
| 10 | `GET /api/ordenes` with no token | **401** |

Also check: wrong credentials → **401**, inexistent route (`/no-existe`) → **404**, `GET /` → redirects to Swagger.

### Seed users (demo profile)

| Username | Password | Role |
|----------|----------|------|
| `admin` | `admin123` | ADMIN |
| `tecnico1` | `tecnico123` | TECNICO |
| `tecnico2` | `tecnico123` | TECNICO |

## Security

- Stateless JWT (HS256) with `spring-boot-starter-oauth2-resource-server`.
- Role claim (`role`) mapped to Spring authorities: `ROLE_TECNICO`, `ROLE_ADMIN`.
- Protected routes via `SecurityFilterChain` + `@PreAuthorize`.
- Passwords hashed with BCrypt (strength 12).
- CORS enabled for the React frontend.
- 401 for missing/invalid tokens, 403 for role violations.

## Run

Prerequisites: JDK 17+. No Maven installation needed (wrapper included).

```bash
# Demo profile (H2 in-memory, auto-seeded, no database required):
.\mvnw.cmd "-Dspring-boot.run.profiles=demo" spring-boot:run

# Default profile (PostgreSQL):
#   - create DB: fieldflow
#   - adjust credentials in application.yaml
.\mvnw.cmd spring-boot:run
```

The API runs on **http://localhost:8081**.

Swagger UI: http://localhost:8081/swagger-ui.html
OpenAPI JSON: http://localhost:8081/v3/api-docs

## Configuration

- `src/main/resources/application.yaml` — default profile: PostgreSQL URL/credentials, port 8081, JWT secret (`app.jwt.secret`) and expiration (`app.jwt.expiration-ms`).
- `src/main/resources/application-demo.yaml` — demo profile: H2 in-memory, ddl-auto create-drop.

> Set a secure `app.jwt.secret` via environment variable in production.

## Build & test

```bash
# Run all tests (demo profile to avoid external DB):
.\mvnw.cmd "-Dspring.profiles.active=demo" test

# Package the jar:
.\mvnw.cmd "-Dspring.profiles.active=demo" package
# Output: target/backend-0.0.1-SNAPSHOT.jar

# Run the packaged jar:
java -jar target/backend-0.0.1-SNAPSHOT.jar --spring.profiles.active=demo
```