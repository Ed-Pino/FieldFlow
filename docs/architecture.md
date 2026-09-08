# FieldFlow Backend - Arquitectura

Backend REST para la gestion de servicios tecnicos en campo. Spring Boot 4.1.1, Spring Security 7 (JWT), Spring Data JPA, PostgreSQL/H2 y Swagger UI.

## 1. Vision general (capas)

```mermaid
flowchart TB
    subgraph Cliente["Cliente externo"]
        FE["Frontend React (PWA)"] --> API
        SW["Swagger UI / OpenAPI"] --> API
    end

    subgraph API["Backend FieldFlow  :8081"]
        direction TB
        SEC["SecurityConfig<br/>SecurityFilterChain + JWT"] --> CTRL

        subgraph CTRL["Controller (REST)"]
            A1["HomeController"]
            A2["AuthController<br/>/api/auth"]
            A3["CatalogoController<br/>/api/clientes|sedes|equipos|tecnicos|tecnicos/disponibles"]
            A4["OrdenController<br/>/api/ordenes<br/>+agenda/{tecnicoId}<br/>+preAuthorize ADMIN en create"]
        end

        CTRL --> SVC

        subgraph SVC["Service (logica de negocio)"]
            B1["AuthService"]
            B2["CatalogoService"]
            B3["OrdenService<br/>@Transactional"]
        end

        SVC --> REP

        subgraph REP["Repository (Spring Data JPA)"]
            C1["ClienteRepository"]
            C2["SedeRepository"]
            C3["EquipoRepository"]
            C4["TecnicoRepository"]
            C5["OrdenTrabajoRepository"]
            C6["UsuarioRepository"]
        end

        REP --> DB[("Base de datos<br/>PostgreSQL / H2")]
        SEC --> ERR["GlobalExceptionHandler<br/>401/403/400/404/500"]
        SVC --> ERR
    end
```

## 2. Autenticacion (login y emision de JWT)

```mermaid
flowchart TD
    A["POST /api/auth/login<br/>{username, password}"] --> B["AuthController.login"]
    B --> C["AuthService.login"]
    C --> D{"UsuarioRepository<br/>findByUsername"}
    D -- "no existe" --> E["BadCredentialsException -> 401"]
    D -- "existe" --> F{"PasswordEncoder.matches<br/>(BCrypt 12)"}
    F -- "password incorrecto" --> E
    F -- "OK" --> G["TokenService.generateToken"]
    G --> H["JwtEncoder HS256<br/>iss=fieldflow, sub=username, claim role, exp"]
    H --> I["AuthResponse {token, username, rol}"]

    J["Request con Authorization: Bearer <token>"] --> K["SecurityConfig<br/>oauth2ResourceServer"]
    K --> L["JwtDecoder valida firma y expiracion"]
    L -- "invalido" --> M["401 invalid_token"]
    L -- "valido" --> N["JwtAuthenticationConverter<br/>claim 'role' -> ROLE_XXX"]
    N --> O{"Reglas de rutas"}
    O -- "/api/auth y /swagger/**" --> R["permitAll"]
    O -- "/api/ordenes/**" --> P["hasAnyRole TECNICO, ADMIN"]
    O -- "resto /api/**" --> Q["hasRole ADMIN"]
    P --> CTRL["Controlador"]
    Q --> CTRL
    R --> CTRL
    CTRL --> V{"@PreAuthorize<br/>hasRole ADMIN"}
    V -- "rol insuficiente" --> W["AuthorizationDeniedException -> 403"]
    V -- "autorizado" --> X["Procesar request"]
```

## 3. Flujo de una peticion (crear orden de trabajo)

```mermaid
flowchart TD
    A["POST /api/ordenes + JWT ADMIN"] --> B["SecurityFilterChain"]
    B --> C{"Token valido?"}
    C -- "no" --> D["401"]
    C -- "si" --> E["CORS + CSRF off + session stateless"]
    E --> F["OrdenController.create<br/>@PreAuthorize hasRole ADMIN"]
    F -- "rol != ADMIN" --> G["403 Acceso denegado"]
    F -- "ADMIN" --> H["OrdenService.create<br/>@Transactional"]
    H --> I["ClienteRepository.findById"]
    H --> J["SedeRepository.findById"]
    H --> K["EquipoRepository.findById"]
    H --> L["TecnicoRepository.findById (si tecnicoId)"]
    I -- "no existe" --> M["EntityNotFoundException -> 404"]
    J -- "no existe" --> M
    K -- "no existe" --> M
    L -- "no existe" --> M
    I -- "OK" --> N["Generar codigo OT-100x"]
    J -- "OK" --> N
    K -- "OK" --> N
    L -- "OK" --> N
    N --> O["Crear OrdenTrabajo estado=pendiente"]
    O --> P["setChecklist + historial 'OT creada'"]
    P --> Q["OrdenTrabajoRepository.save"]
    Q --> R["OrdenResponse.from<br/>materializa colecciones lazy"]
    R --> S["201 Created + JSON"]
```

## 4. Ciclo de estados de la orden de trabajo

```mermaid
stateDiagram-v2
    [*] --> pendiente
    pendiente --> asignada
    asignada --> enCamino
    enCamino --> enEjecucion
    enEjecucion --> pendienteConformidad
    pendienteConformidad --> finalizada
    pendienteConformidad --> reprogramada
    asignada --> reprogramada
    enCamino --> reprogramada
    enEjecucion --> reprogramada
    reprogramada --> pendiente

    note right of pendienteConformidad
        POST /api/ordenes/{id}/conformidad
        guarda notas + firmaBase64 y
        registra 'Finalizada con conformidad'
        en el historial (trazabilidad)
    end note
```

## 5. Modelo de datos (relaciones)

```mermaid
erDiagram
    CLIENTE ||--o{ SEDE : "tiene"
    SEDE ||--o{ EQUIPO : "aloja"
    EQUIPO ||--o{ ORDEN_TRABAJO : "registra"
    TECNICO ||--o{ ORDEN_TRABAJO : "atiende"
    CLIENTE ||--o{ ORDEN_TRABAJO : "solicita"
    SEDE ||--o{ ORDEN_TRABAJO : "ubicacion"

    USUARIO {
        bigint id PK
        varchar username UK
        varchar password
        varchar rol "TECNICO | ADMIN"
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
        boolean disponible
    }
    ORDEN_TRABAJO {
        bigint id PK
        varchar codigo UK
        varchar tipo_servicio
        varchar estado
        varchar prioridad "baja|media|alta|urgente"
        int duracion_estimada_min
        datetime fecha_creacion
        date fecha_programada
        varchar descripcion
        varchar notas
        varchar firma_base64
        bigint cliente_id FK
        bigint sede_id FK
        bigint equipo_id FK
        bigint tecnico_id FK
    }
```

Colecciones embebidas de `OrdenTrabajo` (tablas hijas, no entidades):

```mermaid
erDiagram
    ORDEN_TRABAJO ||--o{ OT_CHECKLIST : "@ElementCollection"
    ORDEN_TRABAJO ||--o{ OT_FOTOS : "@ElementCollection"
    ORDEN_TRABAJO ||--o{ OT_HISTORIAL : "@ElementCollection"
    TECNICO ||--o{ TECNICO_ESPECIALIDADES : "@ElementCollection"

    OT_CHECKLIST {
        text texto
        boolean hecho
    }
    OT_FOTOS {
        varchar foto_url
    }
    OT_HISTORIAL {
        varchar evento
    }
    TECNICO_ESPECIALIDADES {
        varchar especialidad
    }
```