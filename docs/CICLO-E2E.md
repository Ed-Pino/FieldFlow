# Ciclo E2E — Cliente → Firma → Trazabilidad

Checklist manual del ciclo completo. Precondiciones: backend `:8081` y frontend
`http://localhost:5173` corriendo, sesión cerrada al empezar.
Tiempo estimado: 15–20 min. Marca cada paso al verificarlo.

Datos de prueba sugeridos (evitan choques con datos existentes):

| Dato | Valor |
|---|---|
| Cliente | `Clinica Demo SAS` · NIT `900222333` |
| Sede | `Sede Demo Sur` · `Cl 50 # 10-20` · `Bogota` |
| Equipo | `DEMO-001` · `Caldera Demo` · tipo `Caldera` |
| OT | tipo `Mantenimiento Preventivo` |

---

## FASE A — Admin: catálogos y OT (http://localhost:5173, `admin/admin123`)

- [ ] **A1. Login** como `admin`. Sidebar: Dashboard, Ordenes, Crear orden, Agenda, Catalogos.
- [ ] **A2. Cliente**: Catálogos → tab Clientes → **+ Nuevo cliente** → nombre + NIT →
  mensaje `Cliente … creado` y fila visible en la tabla.
- [ ] **A3. Sede**: clic en el cliente nuevo → tab Sedes filtrado → **+ Nueva sede**
  (cliente pre-seleccionado) → guardar → mensaje + fila visible.
- [ ] **A4. Equipo**: tab Equipos → **+ Nuevo equipo** (sede, código `DEMO-001`, nombre, tipo) →
  mensaje + fila visible. Clic en el nombre → ficha `/equipos/:id` (sin OTs aún).
- [ ] **A5. Crear OT**: sidebar **03 Crear orden** → encadenar cliente→sede→equipo→técnico
  (toggle solo disponibles) → aplicar plantilla checklist → descripción → fecha futura →
  **Crear OT** → navega a `/ordenes/:id` en estado `pendiente`. Anota el código (ej. `OT-1006`).
- [ ] **A6. Asignar técnico**: en la ficha, selector Técnico → cambia a otro → mensaje
  `Tecnico asignado` → vuelve a Eduin. Historial suma el evento.
- [ ] **A7. Agendar**: fecha futura en *Reprogramar fecha* → **Agendar** → mensaje + fecha
  actualizada. Agenda (admin, selector Eduin): la OT aparece en su lista.

## FASE B — Técnico: campo (`tecnico1/tecnico123`, vista móvil 390px o ventana angosta)

- [ ] **B1. Login** redirige a **En camino** con la OT activa y destino (cliente/sede/equipo/fecha).
- [ ] **B2. Intervención**: **Estoy en camino** → estado `enCamino` (badge + mensaje).
- [ ] **B3. Ejecución** (sidebar 02): checklist con barra de progreso → tilda 1 ítem →
  agrega medición (texto + unidad + valor) → **Guardar avance** → mensaje con conteo.
- [ ] **B4. Estados**: detalle de la OT → `→ enEjecucion` → `→ pendienteConformidad`.
- [ ] **B5. Evidencia**: bitácora → agregar nota (queda con `[fecha hora]`) → **📷 Tomar/subir foto**
  (se comprime sola, sale thumbnail) y/o pegar URL → **Guardar evidencia** → mensaje.
- [ ] **B6. Firma**: notas finales + dibujar firma en el canvas → **Guardar conformidad y finalizar**
  → badge `finalizada` + mensaje. (Sin firma o sin notas → error visible, no finaliza.)

## FASE C — Trazabilidad y cierre (admin)

- [ ] **C1.** Detalle de la OT: historial con ≥8 eventos
  (creada, técnico, agenda, estados, evidencia, conformidad).
- [ ] **C2.** Ficha del equipo (`ver ficha` o Catálogos → Equipos → nombre):
  contador de OTs + la OT del ciclo en su trazabilidad.
- [ ] **C3.** Dashboard: KPIs actualizados (OT finalizada sale de activas).

✔ **Criterio MVP**: 12/12 pasos en verde sin abrir Swagger ni la consola.

## Si algo falla

| Paso | Revisa |
|---|---|
| A2/A3/A4 error 409 | NIT/código ya existe: cambia el dato de prueba |
| A5 error 500 / fecha | Backend viejo: reinícialo; fecha debe ser hoy o futura |
| B2/B3 "Sin conexión" | Banner offline: reconecta y pulsa **Sincronizar ahora** |
| B6 no finaliza | Falta firma o notas finales (mensajes lo indican) |
| No veo cambios nuevos | `Ctrl + Shift + R`; sesión vieja → logout/login |
| Backend no arranca | Un solo backend a la vez; mata `java.exe` colgados |
