# Plan de pruebas — FieldFlow (Backend + Frontend)

Guía manual para validar el MVP punta a punta.
Tiempo estimado: 30–40 min.

---

## 0. Preparación (una sola vez por sesión)

### 0.1 Requisitos
- Java 21 + Node 18+ instalados.
- Puertos libres: **8081** (backend) y **5173** (frontend).
- ⚠️ **Una sola instancia del backend a la vez.** El H2 en archivo (`backend/data/fieldflow.mv.db`)
  solo admite una conexión. Si ves `Database may be already in use [90020]` o `Port 8081 in use`,
  mata los `java.exe` colgados antes de arrancar otro.

### 0.2 Arrancar backend
```powershell
cd "C:\Users\Admin\Desktop\NoCountry Projects\FieldFlow\backend"
.\mvnw spring-boot:run
```
✔ Esperado: `Tomcat started on port 8081` + `Started BackendApplication`.
Swagger: http://localhost:8081/swagger-ui.html — botón **Authorize**, login con `admin/admin123`
y pega el token como `Bearer <token>`.

### 0.3 Arrancar frontend
```powershell
cd "C:\Users\Admin\Desktop\NoCountry Projects\FieldFlow\frontend"
npm run dev
```
Abrir **http://localhost:5173** (usa `localhost`, no `127.0.0.1`: Vite escucha en IPv6 `::1`).

### 0.4 Credenciales y notas de sesión
| Usuario | Clave | Rol | Técnico vinculado |
|---|---|---|---|
| `admin` | `admin123` | ADMIN | — |
| `superadmin` | `super123` | SUPER_ADMIN | — |
| `tecnico1` | `tecnico123` | TECNICO | Eduin (id 1) |
| `tecnico2` | `tecnico123` | TECNICO | Carlos (id 2) |

- Si tu sesión es vieja: **Cerrar sesión y volver a entrar** (el `tecnicoId` solo viene en logins nuevos).
- Si no ves cambios recientes: **recarga forzada** `Ctrl + Shift + R`.

---

## 1. Backend (Swagger o PowerShell)

> En Swagger autoriza cada sección con el token del rol indicado.

### 1.1 Auth — `POST /api/auth/login`
- [ ] `admin/admin123` → 200 con `{token, username, role, tecnicoId?}` (admin: sin `tecnicoId`).
- [ ] `tecnico1/tecnico123` → 200 con `tecnicoId: 1`.
- [ ] Clave mala → 401.

### 1.2 Catálogos (ADMIN)
- [ ] `GET /api/clientes` → 200, lista con GasSolutions.
- [ ] `POST /api/clientes` `{nombre, nit nuevo}` → 201. Repetir mismo NIT → 409.
- [ ] `GET /api/sedes?clienteId=1` → solo sedes de ese cliente.
- [ ] `POST /api/sedes` `{clienteId, nombre, direccion, ciudad}` → 201. `clienteId: 999999` → 404.
- [ ] `GET /api/equipos` → lista. `GET /api/equipos/1` → ficha CAL-001. `GET /api/equipos/999999` → 404.
- [ ] `POST /api/equipos` `{sedeId, codigo, nombre, tipo}` → 201. Código repetido → 409.
- [ ] `GET /api/tecnicos/disponibles` → solo `disponible: true`.
- [ ] `GET /api/checklists` → CHK-CAL-01 con 3 ítems.

### 1.3 Roles en catálogo (TECNICO)
- [ ] Con token `tecnico1`: `GET /api/clientes` → 403. `POST /api/clientes` → 403. `POST /api/sedes` → 403.

### 1.4 Ciclo de vida de OT (ADMIN crea, TECNICO opera)
1. [ ] `POST /api/ordenes` (ADMIN) con cliente/sede/equipo/tecnico válidos, `fechaProgramada` futura → **201**,
   `codigo: OT-10xx`, `estado: pendiente`, historial `["OT … creada"]`.
2. [ ] `POST /api/ordenes` con `clienteId` inexistente → 404. Con token TECNICO → 403.
3. [ ] `PUT /api/ordenes/{id}/tecnico` `{tecnicoId}` (ADMIN) → 200, cambia `tecnico`, suma historial.
   Con token TECNICO → 403.
4. [ ] `PUT /api/ordenes/{id}/agenda` `{fechaProgramada: <futura>}` (ADMIN) → 200. Fecha pasada → 400.
5. [ ] `PUT /api/ordenes/{id}/estado` secuencia `asignada → enCamino → enEjecucion → pendienteConformidad`
   (TECNICO) → 200 cada una. Salto inválido (ej. `pendiente → enEjecucion`) → 400.
6. [ ] `PUT /api/ordenes/{id}/evidencia` `{notas, checklist:[{texto, hecho, tipo, unidad, valor}], fotos:[urls…]}`
   → 200, persiste todo (incluye `valor` de medición y foto larga).
7. [ ] `POST /api/ordenes/{id}/conformidad` `{notas, firma}` en estado `pendienteConformidad`
   → 200, `estado: finalizada`. En otro estado → 400.
8. [ ] `GET /api/ordenes/{id}/trazabilidad` → OTs del mismo equipo, fecha DESC.
9. [ ] `GET /api/ordenes/agenda/{tecnicoId}` → OTs ordenadas por `fechaProgramada` ASC.

### 1.5 Suite automatizada (opcional, regresión)
```powershell
cd backend
.\mvnw test
```
✔ Esperado: `Tests run: 58, Failures: 0, Errors: 0` (ver `target/surefire-reports/`).

---

## 2. Frontend — flujo ADMIN (`admin/admin123`)

### 2.1 Dashboard (`/`)
- [ ] KPIs con números (no `-`): OTs activas, técnicos disponibles, equipos, alertas 7 días.
- [ ] Tabla OTs recientes con link al detalle.
- [ ] Botones **+ Crear orden** (sidebar `03`, Dashboard y lista) → `/ordenes/nueva`.

### 2.2 Catálogos (`/catalogos`)
- [ ] Tab Clientes → **+ Nuevo cliente** → aparece en tabla. NIT duplicado → error visible.
- [ ] Clic en un cliente → tab Sedes filtrado por ese cliente.
- [ ] Tab Sedes → **+ Nueva sede** (cliente pre-seleccionado) → aparece listada.
- [ ] Tab Equipos → filtro por sede + **+ Nuevo equipo** → aparece listado. Nombre linkea a `/equipos/:id`.
- [ ] Tab Técnicos → especialidades y badge disponible/ocupado.
- [ ] Botón **Eliminar** visible solo con `superadmin`.

### 2.3 Órdenes (`/ordenes`)
- [ ] Filtros por estado/técnico/cliente/fecha funcionan.
- [ ] **+ Crear orden** → formulario encadenado cliente→sede→equipo→técnico (+ toggle solo disponibles),
  fecha ≥ hoy, prioridad, duración, plantilla de checklist (sugerida por tipo de equipo) + ítems manuales.
- [ ] Crear → navega al detalle de la OT nueva (`/ordenes/:id`, estado `pendiente`).

### 2.4 Detalle de OT (`/ordenes/:id`)
- [ ] Ficha completa + link **ver ficha** del equipo → `/equipos/:id` (ficha + trazabilidad del equipo).
- [ ] Selector de **técnico** (solo admin) reasigna + historial. Fecha **Agendar** reprograma.
- [ ] Botones de estado: solo transiciones válidas (ej. en `asignada`: `→ enCamino`, `→ reprogramada`).
- [ ] Checklist interactivo + **Abrir en Ejecucion** → `/ejecucion?ot=:id`.
- [ ] **Bitácora de notas**: agregar nota → queda con `[fecha hora]` → Guardar evidencia persiste.
- [ ] **Fotos**: 📷 Tomar/subir (se comprime sola) + pegar URL + thumbnails + quitar.
- [ ] En `pendienteConformidad`: notas finales + **firma en canvas** → Guardar → `finalizada`.
- [ ] Historial con todos los eventos + trazabilidad del equipo.

---

## 3. Frontend — flujo TECNICO (`tecnico1/tecnico123`)

- [ ] Login redirige a **En camino** (`/` → `/en-camino`).
- [ ] Sidebar: 01 En camino · 02 Ejecucion · 03 Mis ordenes · 04 Agenda (sin Dashboard/Órdenes/Catálogos).
- [ ] Rutas admin (`/ordenes`, `/catalogos`, `/equipos/:id`) redirigen fuera. `/login` con sesión redirige a `/`.
- [ ] **En camino**: OT activa con destino + botón grande **Estoy en camino** → cambia estado.
- [ ] **Ejecucion**: progreso, checks, **mediciones** (valor + unidad), agregar medición, Guardar avance.
- [ ] **Mis ordenes**: solo las suyas. **Agenda**: selector bloqueado en "Mi agenda".
- [ ] Detalle de su OT: checklist, notas, fotos, firma y conformidad funcionan igual que admin.

---

## 4. Offline (PWA, rol técnico)

1. [ ] Como técnico, abre **En camino** con red.
2. [ ] Corta la red (modo avión / DevTools → Offline).
3. [ ] Pulsa **Estoy en camino** → mensaje *"Sin conexión: cambio encolado…"* + banner *"Sin conexion —…"*.
4. [ ] Reconecta → sincroniza solo, banner confirma, servidor refleja el estado.
5. [ ] Lo mismo con **Guardar avance** en Ejecución y **Guardar evidencia** en detalle.
> Límites v1: solo se encolan PUTs + conformidad. Crear OT/cliente/sede/equipo requiere red
> (un POST reintentado duplicaría). GETs se cachean en el SW del build de producción (`dist/`).

---

## 5. Ciclo completo (12 pasos, el MVP)

Con datos nuevos de punta a punta:
**Cliente → Sede → Equipo → OT → Técnico → Agenda → Intervención → Evidencia → Firma → Trazabilidad**
1. Catálogos: nuevo cliente → nueva sede (clic en cliente) → nuevo equipo (en esa sede).
2. Crear orden con esos datos + plantilla checklist.
3. Detalle: reasignar técnico + agendar fecha.
4. Agenda (admin): verificar la OT en la agenda del técnico.
5. Como técnico: En camino (Tomar OT, Estoy en camino) → Ejecución (checks + medición + guardar).
6. Detalle: `enEjecucion → pendienteConformidad` → nota + foto (archivo y URL) → Guardar evidencia.
7. Conformidad: notas finales + firma → `finalizada`.
8. Verificar historial completo + ficha del equipo con la OT en su trazabilidad.

✔ Criterio MVP: los 12 pasos en verde sin tocar Swagger ni la consola.

---

## 6. Solución de problemas

| Síntoma | Causa probable | Acción |
|---|---|---|
| `Database may be already in use [90020]` / `Port 8081 in use` | Dos backends corriendo | Deja **uno solo**; mata `java.exe` colgados |
| No veo cambios del frontend | Caché del navegador | `Ctrl + Shift + R`; si persiste, nueva pestaña |
| `127.0.0.1:5173` no conecta | Vite escucha en `::1` | Usa `http://localhost:5173` |
| Técnico sin "Mis ordenes" / agenda vacía | Sesión vieja sin `tecnicoId` | Cerrar sesión y volver a entrar |
| 401/403 inesperados en UI | Token vencido o rol insuficiente | Relogin; revisa rol al pie del sidebar |
| `OT-10xx` duplicada / 500 al crear | Backend viejo (secuencia en memoria) | Reinicia backend (fix: secuencia desde BD) |
