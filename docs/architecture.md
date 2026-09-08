# FieldFlow Backend — Arquitectura

Backend REST para la gestión de servicios técnicos en campo. Spring Boot 4.1.1, Spring Security 7 (JWT HS256), Spring Data JPA, PostgreSQL/H2 y Swagger UI.

Requisitos cubiertos: REQ-1 · REQ-2 · REQ-3 · REQ-4 · REQ-5 · REQ-6 · REQ-7 · REQ-8

---

## 1. Visión general (capas)

```mermaid
flowchart TB
    subgraph Cliente["Cliente externo"]
        FE["Frontend React (PWA)"] --> API
        SW["Swagger UI / OpenAPI"] --> API
    end

    subgraph API["Backend FieldFlow  :8081"]
        direction TB
        SEC["SecurityConfig\nSecurityFilterChain + JWT\nREQ-1"] --> CTRL

        subgraph CTRL["Controller (REST)"]
            A1["HomeController"]
            A2["AuthController\n/api/auth\nREQ-1"]
            A3["CatalogoController\n/api/clientes|sedes|equipos\n/api/tecnicos|tecnicos/disponibles\nREQ-2"]
            A4["OrdenController\n/api/ordenes\n+agenda/{tecnicoId}\n+preAuthorize ADMIN en create\nREQ-3..REQ-8"]
        end

        CTRL --> SVC

        subgraph SVC["Service (lógica de negocio)"]
            B1["AuthService\nREQ-1"]
            B2["CatalogoService\nREQ-2"]
            B3["OrdenService\n@Transactional\nREQ-3..REQ-8"]
        end

        SVC --> REP

        subgraph REP["Repository (Spring Data JPA)"]
            C1["ClienteRepository"]
            C2["SedeRepository"]
            C3["EquipoRepository"]
            C4["TecnicoRepository\nfindByDisponibleTrue (REQ-2)"]
            C5["OrdenTrabajoRepository\nfindByEquipoId... (REQ-8)\nfindByTecnicoId... (REQ-5)"]
            C6["UsuarioRepository"]
        end

        REP --> DB[("Base de datos\nPostgreSQL / H2")]
        SEC --> ERR["GlobalExceptionHandler\n401/403/400/404/500"]
        SVC --> ERR
    end
```

---

## 2. Autenticación — login y emisión de JWT (REQ-1)

```mermaid
flowchart TD
    A["POST /api/auth/login\n{username, password}"] --> B["AuthController.login"]
    B --> C["AuthService.login"]
    C --> D{"UsuarioRepository\nfindByUsername"}
    D -- "no existe" --> E["BadCredentialsException → 401\nREQ-1.2"]
    D -- "existe" --> F{"PasswordEncoder.matches\nBCrypt factor 12"}
    F -- "password incorrecto" --> E
    F -- "OK" --> G["TokenService.generateToken"]
    G --> H["JwtEncoder HS256\niss=fieldflow, sub=username\nclaim role, exp\nREQ-1.3"]
    H --> I["AuthResponse {token, username, role}\nREQ-1.1"]

    J["Request con Authorization: Bearer token"] --> K["SecurityConfig\noauth2ResourceServer"]
    K --> L["JwtDecoder\nvalida firma y expiración"]
    L -- "inválido" --> M["401 invalid_token\nREQ-1.4"]
    L -- "válido" --> N["JwtAuthenticationConverter\nclaim 'role' → ROLE_XXX\nREQ-1.3"]
    N --> O{"Reglas de rutas"}
    O -- "/api/auth y /swagger/**" --> R["permitAll"]
    O -- "/api/ordenes/**" --> P["hasAnyRole TECNICO, ADMIN\nREQ-1.5"]
    O -- "resto /api/**" --> Q["hasRole ADMIN\nREQ-1.6"]
    P --> CTRL["Controlador"]
    Q --> CTRL
    R --> CTRL
    CTRL --> V{"@PreAuthorize\nhasRole ADMIN"}
    V -- "rol insuficiente" --> W["AuthorizationDeniedException → 403\nREQ-1.5"]
    V -- "autorizado" --> X["Procesar request"]
```

---

## 3. Flujo de una petición — crear Orden de Trabajo (REQ-3)

```mermaid
flowchart TD
    A["POST /api/ordenes + JWT ADMIN"] --> B["SecurityFilterChain"]
    B --> C{"Token válido?"}
    C -- "no" --> D["401  REQ-1.4"]
    C -- "si" --> E["CORS + CSRF off + session stateless"]
    E --> F["OrdenController.create\n@PreAuthorize hasRole ADMIN\nREQ-3.1"]
    F -- "rol != ADMIN" --> G["403 Acceso denegado\nREQ-1.5"]
    F -- "ADMIN" --> H["OrdenService.create\n@Transactional"]
    H --> I["ClienteRepository.findById"]
    H --> J["SedeRepository.findById"]
    H --> K["EquipoRepository.findById"]
    H --> L["TecnicoRepository.findById\nopcional REQ-3.3"]
    I -- "no existe" --> M["EntityNotFoundException → 404\nREQ-3.10"]
    J -- "no existe" --> M
    K -- "no existe" --> M
    L -- "no existe" --> M
    I -- "OK" --> N["Generar código OT-100x\nREQ-3.4"]
    J -- "OK" --> N
    K -- "OK" --> N
    L -- "OK" --> N
    N --> O["new OrdenTrabajo\nestado=pendiente\nprioridad=request.prioridad??media\nREQ-3.5 REQ-3.6"]
    O --> P["setChecklist REQ-3.8\nhistorial 'OT creada' REQ-3.9"]
    P --> Q["OrdenTrabajoRepository.save"]
    Q --> R["OrdenResponse.from\nmaterializa colecciones lazy"]
    R --> S["201 Created + JSON"]
```

---

## 4. Flujo — Agenda del técnico (REQ-5)

```mermaid
flowchart TD
    A["GET /api/ordenes/agenda/{tecnicoId}\n+ JWT ADMIN o TECNICO"] --> B["SecurityFilterChain\nhasAnyRole TECNICO ADMIN"]
    B --> C["OrdenController.getAgendaTecnico"]
    C --> D["OrdenService.getAgendaTecnico"]
    D --> E["OrdenTrabajoRepository\nfindByTecnicoIdOrderByFechaProgramadaAsc\nREQ-5.1 REQ-5.2"]
    E --> F["List OrdenResponse\nordenadas por fechaProgramada ASC"]
    F --> G["200 OK + JSON"]
```

---

## 5. Flujo — Conformidad del cliente (REQ-7)

```mermaid
flowchart TD
    A["POST /api/ordenes/{id}/conformidad\n+ JWT"] --> B["SecurityFilterChain"]
    B --> C["OrdenController.guardarConformidad"]
    C --> D["OrdenService.guardarConformidad"]
    D --> E{"estado == pendienteConformidad?\nREQ-7.4"}
    E -- "no" --> F["IllegalStateException → 400"]
    E -- "si" --> G["ot.setNotas REQ-7.1\not.setFirmaBase64 REQ-7.1"]
    G --> H["historial.add\nFinalizada con conformidad\nREQ-7.3"]
    H --> I["estado → finalizada\nREQ-7.2"]
    I --> J["OrdenTrabajoRepository.save"]
    J --> K["OrdenResponse\n200 OK"]
```

---

## 6. Ciclo de estados de la Orden de Trabajo (REQ-4)

```mermaid
stateDiagram-v2
    [*] --> pendiente : crear OT (REQ-3.5)
    pendiente --> asignada : REQ-4.2
    asignada --> enCamino : REQ-4.2
    enCamino --> enEjecucion : REQ-4.2
    enEjecucion --> pendienteConformidad : REQ-4.2
    pendienteConformidad --> finalizada : conformidad (REQ-7.2)
    pendienteConformidad --> reprogramada : REQ-4.3
    asignada --> reprogramada : REQ-4.3
    enCamino --> reprogramada : REQ-4.3
    enEjecucion --> reprogramada : REQ-4.3
    reprogramada --> pendiente : reanudación (REQ-4.4)

    note right of pendienteConformidad
        POST /api/ordenes/{id}/conformidad
        guarda notas + firmaBase64
        registra 'Finalizada con conformidad'
        en el historial (REQ-7.1, REQ-7.3)
    end note
```

Cada transición registra un evento con timestamp en `ot_historial` (REQ-4.5).

---

## 7. Modelo de datos — relaciones (REQ-2, REQ-3, REQ-8)

```mermaid
erDiagram
    CLIENTE ||--o{ SEDE : "tiene"
    SEDE ||--o{ EQUIPO : "aloja"
    EQUIPO ||--o{ ORDEN_TRABAJO : "registra (REQ-8)"
    TECNICO ||--o{ ORDEN_TRABAJO : "atiende (REQ-5)"
    CLIENTE ||--o{ ORDEN_TRABAJO : "solicita"
    SEDE ||--o{ ORDEN_TRABAJO : "ubicacion"

    USUARIO {
        bigint id PK
        varchar username UK
        varchar password "BCrypt factor 12"
        varchar role "TECNICO | ADMIN  REQ-1"
    }
    CLIENTE {
        bigint id PK
        varchar nombre
        varchar nit UK
    }
    SEDE {
        bigint id PK
        varchar nombre
        varchar direccion
        varchar ciudad
        bigint cliente_id FK
    }
    EQUIPO {
        bigint id PK
        varchar codigo UK
        varchar nombre
        varchar tipo
        date ultimo_mantenimiento
        bigint sede_id FK
    }
    TECNICO {
        bigint id PK
        varchar nombre
        boolean disponible "REQ-2.5"
    }
    ORDEN_TRABAJO {
        bigint id PK
        varchar codigo UK "OT-100x  REQ-3.4"
        varchar tipo_servicio
        varchar estado "REQ-4"
        varchar prioridad "baja|media|alta|urgente  REQ-3.6"
        int duracion_estimada_min "REQ-3.7"
        datetime fecha_creacion
        date fecha_programada "REQ-5"
        varchar descripcion
        varchar notas "REQ-6.1 REQ-7.1"
        varchar firma_base64 "REQ-7.1"
        bigint cliente_id FK
        bigint sede_id FK
        bigint equipo_id FK
        bigint tecnico_id FK
    }
```

---

## 8. Colecciones embebidas de OrdenTrabajo

```mermaid
erDiagram
    ORDEN_TRABAJO ||--o{ OT_CHECKLIST : "@ElementCollection REQ-3.8 REQ-6.2"
    ORDEN_TRABAJO ||--o{ OT_FOTOS : "@ElementCollection REQ-6.3"
    ORDEN_TRABAJO ||--o{ OT_HISTORIAL : "@ElementCollection REQ-4.5 REQ-7.3 REQ-8"
    TECNICO ||--o{ TECNICO_ESPECIALIDADES : "@ElementCollection REQ-2.4"

    OT_CHECKLIST {
        text texto
        boolean hecho
    }
    OT_FOTOS {
        varchar foto_url "URL de evidencia fotográfica"
    }
    OT_HISTORIAL {
        varchar evento "log con timestamp"
    }
    TECNICO_ESPECIALIDADES {
        varchar especialidad
    }
```

---

## 9. Resumen de endpoints por requisito

| REQ | Endpoint | Método | Rol |
|---|---|---|---|
| REQ-1 | `/api/auth/login` | POST | público |
| REQ-1 | `/api/auth/register` | POST | público |
| REQ-2 | `/api/clientes` | GET | ADMIN |
| REQ-2 | `/api/sedes?clienteId=` | GET | ADMIN |
| REQ-2 | `/api/equipos?sedeId=` | GET | ADMIN |
| REQ-2 | `/api/tecnicos` | GET | ADMIN |
| REQ-2 | `/api/tecnicos/disponibles` | GET | ADMIN |
| REQ-3 | `/api/ordenes` | POST | ADMIN |
| REQ-4 | `/api/ordenes/{id}/estado` | PUT | ADMIN, TECNICO |
| REQ-5 | `/api/ordenes/agenda/{tecnicoId}` | GET | ADMIN, TECNICO |
| REQ-6, REQ-7 | `/api/ordenes/{id}/conformidad` | POST | ADMIN, TECNICO |
| REQ-8 | `/api/ordenes/{id}/trazabilidad` | GET | ADMIN, TECNICO |
| REQ-3..8 | `/api/ordenes` | GET | ADMIN, TECNICO |
| REQ-3..8 | `/api/ordenes/{id}` | GET | ADMIN, TECNICO |
