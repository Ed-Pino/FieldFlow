# Requirements — FieldFlow

## Descripción general

### Problema

Plataforma centralizada para gestionar servicios técnicos en campo, permitiendo planificar y asignar técnicos, realizar seguimiento de órdenes de trabajo, registrar intervenciones y evidencias, y mantener un historial completo de mantenimiento por equipo.

---

## Descripción / Contexto

Una empresa brinda servicios técnicos y de mantenimiento a clientes que cuentan con diferentes sedes, instalaciones y equipos que requieren atención periódica, reparaciones o intervenciones específicas.

La operación involucra diferentes etapas y personas: el área administrativa recibe una solicitud o identifica una necesidad de mantenimiento, se genera una Orden de Trabajo (OT), se determina el tipo de servicio requerido y se asigna un técnico disponible para realizar la intervención en la ubicación correspondiente.

Los técnicos trabajan fuera de la oficina y necesitan acceder desde el campo a la información necesaria para ejecutar correctamente cada trabajo y registrar lo realizado.

Durante este proceso se generan y utilizan diferentes tipos de información:

- Clientes
- Sedes e instalaciones
- Equipos
- Órdenes de Trabajo
- Tipos de servicio
- Técnicos
- Disponibilidad y asignaciones
- Agenda de trabajo
- Estados de las intervenciones
- Checklists
- Fotos y evidencia
- Notas técnicas
- Firma o conformidad del cliente
- Historial de mantenimiento
- Mantenimientos preventivos
- Recurrencias

Actualmente, gran parte de esta información puede administrarse mediante planillas, mensajes, llamadas, sistemas administrativos y registros realizados por los propios técnicos, lo que dificulta mantener una visión centralizada de las tareas pendientes, las intervenciones en curso y el historial de cada equipo.

El problema no está únicamente en coordinar técnicos, sino en conectar la planificación del trabajo con lo que realmente ocurre en campo y mantener evidencia de cada intervención.

Ante una consulta, reclamo o necesidad de mantenimiento, la empresa necesita poder responder rápidamente:

> ¿Qué cliente solicitó el servicio, dónde está el equipo, qué trabajo debía realizarse, qué técnico fue asignado, qué se hizo, cuándo se realizó, qué evidencia existe y cuál es el estado actual del equipo?

FieldFlow busca resolver esta problemática mediante un sistema centralizado de gestión, planificación, ejecución y trazabilidad de servicios técnicos en campo.

---

## Problema / Dolor del negocio

### Falta de trazabilidad
La información de una intervención puede encontrarse distribuida entre la administración, el técnico y diferentes registros. Esto dificulta reconstruir el historial completo de un servicio desde su solicitud hasta su finalización.

### Información dispersa
Los datos del cliente, ubicación, equipo, orden de trabajo, instrucciones, fotografías y resultado de la intervención pueden encontrarse en diferentes lugares. Esto dificulta que el técnico tenga toda la información necesaria al momento de realizar el trabajo.

### Dificultad para planificar técnicos
La asignación de trabajos requiere considerar: disponibilidad del técnico, tipo de servicio, ubicación, agenda, prioridad y duración estimada. Cuando esta planificación se realiza manualmente, puede generar asignaciones poco eficientes, demoras y dificultades para reorganizar la agenda ante cambios o imprevistos.

### Dificultad para realizar seguimiento
La empresa necesita conocer en todo momento qué está ocurriendo con las órdenes de trabajo (pendiente, asignada, en camino, en ejecución, pendiente de conformidad, finalizada, reprogramada). Sin un estado centralizado, resulta difícil conocer la situación real de las operaciones en campo.

### Falta de evidencia del trabajo realizado
Una intervención técnica necesita quedar respaldada por fotografías, notas, checklists, mediciones, observaciones y firma o conformidad del cliente. Cuando estos registros se realizan fuera de un sistema centralizado, pueden perderse o quedar asociados de manera incorrecta a la intervención.

### Dificultad para consultar el historial de los equipos
Si cada mantenimiento se registra de manera independiente, resulta difícil conocer qué fallas tuvo el equipo, qué reparaciones recibió, cuándo fue su último mantenimiento o qué tareas se realizaron anteriormente. Esto dificulta detectar problemas recurrentes y planificar futuras intervenciones.

### Dificultad para gestionar mantenimiento preventivo
Sin un sistema que gestione recurrencias y fechas previstas, existe el riesgo de olvidar mantenimientos, realizarlos fuera de fecha o perder continuidad sobre el mantenimiento de los equipos.

---

## Oportunidad

La oportunidad consiste en transformar la operación actual en un flujo digital centralizado y trazable:

```
Cliente → Sede → Equipo → Orden de Trabajo → Asignación → Agenda → Intervención → Evidencia → Conformidad → Historial
```

El objetivo es construir una **fuente única de información** para las operaciones en campo, donde administración pueda planificar y realizar seguimiento, mientras que los técnicos puedan consultar la información necesaria, registrar el trabajo ejecutado y generar evidencia directamente desde el lugar de la intervención.

---

## Criterio de éxito del proyecto

El proyecto será exitoso si un usuario puede tomar una Orden de Trabajo y, sin necesidad de buscar información en diferentes sistemas, planillas o canales de comunicación:

- Conocer el cliente, la ubicación y el equipo involucrado
- Consultar el técnico asignado y el estado del servicio
- Acceder al registro completo de la intervención, incluyendo checklist, fotografías, notas, conformidad e historial de mantenimiento

---

## Roles del sistema

| Rol | Descripción |
|---|---|
| **ADMIN** | Área administrativa. Gestiona catálogos, crea y asigna órdenes de trabajo, hace seguimiento de todas las operaciones. |
| **TECNICO** | Técnico de campo. Consulta sus órdenes asignadas, actualiza estados, registra evidencia y conformidad del cliente. |

---

## Requisitos funcionales

### REQ-1 · Autenticación y acceso

**User Story:** Como usuario del sistema (ADMIN o TECNICO), quiero autenticarme con usuario y contraseña para acceder a las funciones que corresponden a mi rol.

**Criterios de aceptación:**
1. El sistema acepta credenciales válidas y devuelve un token JWT
2. Las credenciales incorrectas resultan en error 401
3. Cada token contiene el rol del usuario (ADMIN o TECNICO)
4. Los endpoints protegidos rechazan requests sin token válido con 401
5. Un TECNICO no puede acceder a endpoints exclusivos de ADMIN (403)
6. Un ADMIN tiene acceso completo a todos los endpoints

---

### REQ-2 · Gestión de catálogos

**User Story:** Como ADMIN, quiero consultar el catálogo de clientes, sedes, equipos y técnicos para tener la información necesaria al crear y asignar órdenes de trabajo.

**Criterios de aceptación:**
1. El sistema lista todos los clientes registrados
2. El sistema lista sedes filtrables por cliente
3. El sistema lista equipos filtrables por sede
4. El sistema lista todos los técnicos con sus especialidades y estado de disponibilidad
5. El sistema lista solo los técnicos con `disponible=true` cuando se solicita el filtro de disponibles
6. Solo usuarios con rol ADMIN pueden acceder a los catálogos

---

### REQ-3 · Creación de Órdenes de Trabajo

**User Story:** Como ADMIN, quiero crear una Orden de Trabajo asociando cliente, sede, equipo y técnico, para planificar una intervención de servicio técnico.

**Criterios de aceptación:**
1. Solo un ADMIN puede crear una OT
2. La OT requiere: tipo de servicio, descripción, fecha programada, cliente, sede y equipo
3. La asignación de técnico es opcional al momento de la creación
4. Cada OT recibe un código único generado automáticamente (formato `OT-100x`)
5. La OT se crea con estado inicial `pendiente`
6. Se puede especificar prioridad (`baja`, `media`, `alta`, `urgente`); si no se indica, el valor por defecto es `media`
7. Se puede especificar duración estimada en minutos
8. Se puede incluir un checklist inicial de ítems a verificar
9. El historial de la OT registra automáticamente el evento de creación
10. Si el cliente, sede, equipo o técnico indicado no existe, el sistema devuelve error 404

---

### REQ-4 · Seguimiento de estados

**User Story:** Como ADMIN o TECNICO, quiero actualizar el estado de una Orden de Trabajo para reflejar el avance real de la intervención en campo.

**Criterios de aceptación:**
1. Los estados válidos son: `pendiente`, `asignada`, `enCamino`, `enEjecucion`, `pendienteConformidad`, `finalizada`, `reprogramada`
2. El flujo principal de estados es: `pendiente → asignada → enCamino → enEjecucion → pendienteConformidad → finalizada`
3. La transición a `reprogramada` es válida desde: `asignada`, `enCamino`, `enEjecucion`, `pendienteConformidad`
4. Una OT en estado `reprogramada` puede volver a `pendiente`
5. Cada cambio de estado queda registrado en el historial de la OT con timestamp

---

### REQ-5 · Agenda del técnico

**User Story:** Como ADMIN o TECNICO, quiero consultar la agenda de un técnico para ver sus órdenes de trabajo ordenadas por fecha programada.

**Criterios de aceptación:**
1. El sistema devuelve todas las OTs asignadas a un técnico
2. Las OTs se ordenan por `fechaProgramada` de forma ascendente
3. La agenda es accesible tanto para ADMIN como para TECNICO

---

### REQ-6 · Registro de evidencia e intervención

**User Story:** Como TECNICO, quiero registrar el trabajo realizado durante una intervención (notas, checklist, fotos) para dejar evidencia del servicio ejecutado.

**Criterios de aceptación:**
1. El técnico puede registrar notas y observaciones en la OT
2. El técnico puede marcar ítems del checklist como completados
3. El técnico puede adjuntar URLs de fotografías como evidencia del trabajo realizado
4. El registro de evidencia queda asociado permanentemente a la OT

---

### REQ-7 · Conformidad del cliente

**User Story:** Como TECNICO, quiero registrar la conformidad del cliente al finalizar una intervención, incluyendo notas finales y firma digital, para cerrar formalmente la Orden de Trabajo.

**Criterios de aceptación:**
1. La conformidad incluye notas de cierre y firma del cliente en formato base64
2. Al registrar la conformidad, la OT cambia automáticamente a estado `finalizada`
3. El evento queda registrado en el historial de la OT con timestamp
4. La conformidad solo es registrable cuando la OT está en estado `pendienteConformidad`

---

### REQ-8 · Trazabilidad del equipo

**User Story:** Como ADMIN o TECNICO, quiero consultar el historial de intervenciones de un equipo para conocer su historial completo de mantenimiento.

**Criterios de aceptación:**
1. El sistema devuelve todas las OTs asociadas al mismo equipo que una OT dada
2. Las OTs se ordenan por fecha de creación de forma descendente (más recientes primero)
3. Cada OT del historial incluye estado, técnico asignado, tipo de servicio y evidencia registrada
4. La trazabilidad es accesible tanto para ADMIN como para TECNICO

---

## Extensiones futuras (fuera del alcance del MVP)

- Subida de fotos a almacenamiento externo (S3 o similar)
- Mantenimientos preventivos recurrentes con programación automática de OTs
- Notificaciones por email/push al técnico al ser asignado a una OT
- Dashboard de métricas operativas (OTs por período, técnico más activo, tiempo promedio de cierre)
- App móvil nativa para técnicos en campo
