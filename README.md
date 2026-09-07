# FieldFlow — S8-6-Team-8

Centralized full-stack platform for managing field technical services: work-order management, technician assignment, service state tracking with full history (trazability), technical checklists, photographic evidence, notes, and client signature for conformity sign-off.

## Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Java 17, Spring Boot 4, Spring Security 7 (JWT), Spring Data JPA/Hibernate, PostgreSQL / H2 |
| **Frontend** | React, TypeScript, Vite, PWA |
| **API** | REST, OpenAPI/Swagger |

## Roles

- **ADMIN** — full access: manage catalogs (clients, sites, equipment, technicians) and create/assign work orders.
- **TECNICO** — views and updates only their assigned work orders.

## Backend

Located in [`backend/`](backend/). Spring Boot REST API exposing work orders, trazability, conformity, catalogs, and JWT authentication with role-based access.

### Dependencies
- `spring-boot-starter-webmvc`, `spring-boot-starter-security`, `spring-boot-starter-oauth2-resource-server`, `spring-boot-starter-data-jpa`
- `spring-boot-starter-validation`, `Lombok`
- `postgresql` (runtime), `h2` (demo profile)
- `springdoc-openapi-starter-webmvc-ui` (Swagger UI)

### Main endpoints

```
POST /api/auth/login                     → JWT + rol
POST /api/auth/register                  → create user (rol: TECNICO | ADMIN)
GET  /api/ordenes                        → list work orders (TECNICO/ADMIN)
GET  /api/ordenes/{id}                   → work order detail
GET  /api/ordenes/{id}/trazabilidad      → history of the equipment
POST /api/ordenes                        → create work order (ADMIN)
PUT  /api/ordenes/{id}/estado            → update state
POST /api/ordenes/{id}/conformidad       → notes + signature, finalizes OT
GET  /api/clientes | sedes | equipos | tecnicos → catalogs (ADMIN)
```

Interactive docs (Swagger UI): `http://localhost:8081/swagger-ui.html`

### Run the backend

Prerequisites: JDK 17+ (Java 21 LTS tested). No Maven needed — uses the Maven wrapper.

```bash
cd backend

# Demo profile (H2 in-memory, no database required):
.\mvnw.cmd "-Dspring-boot.run.profiles=demo" spring-boot:run

# Default profile (PostgreSQL):
.\mvnw.cmd spring-boot:run
```

### Seed users (demo profile)

| Username | Password | Role |
|----------|----------|------|
| `admin` | `admin123` | ADMIN |
| `tecnico1` | `tecnico123` | TECNICO |
| `tecnico2` | `tecnico123` | TECNICO |

### Configuration

- `src/main/resources/application.yaml` — default profile (PostgreSQL, port 8081, JWT secret).
- `src/main/resources/application-demo.yaml` — demo profile (H2 in-memory).

## Frontend

Located in [`frontend/`](frontend/). React + TypeScript + Vite PWA. *(Backend-first; frontend in progress.)*