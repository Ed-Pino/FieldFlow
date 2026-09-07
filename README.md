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

### Dependencias

- `spring-boot-starter-webmvc`, `spring-boot-starter-security`, `spring-boot-starter-oauth2-resource-server`, `spring-boot-starter-data-jpa`
- `spring-boot-starter-validation`, `Lombok`
- `postgresql` (runtime), `h2` (perfil demo)
- `springdoc-openapi-starter-webmvc-ui` (Swagger UI)

### Endpoints principales
