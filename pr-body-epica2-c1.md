## Capítulo 1 de la Épica 2 — Alta de Cliente (#17)

### Backend
- NUEVO DTO `ClienteRequest` para alta de cliente.
- `POST /api/clientes` en `CatalogoController` → 201 con el cliente creado.
- `CatalogoService.altaCliente` + `ClienteRepository.findByNit`:
  - NIT duplicado ⇒ `ResponseStatusException(CONFLICT)` → 409.
- `GlobalExceptionHandler`: handler específico para `ResponseStatusException` (antes el catch-all devolvía 500).

### Frontend
- `catalogos.js`: `createCliente` (POST /api/clientes).
- `Catalogos.jsx`: form de alta de cliente (nombre + NIT) con mensajes de éxito/error.

### Tests
- `altaClienteCreaClienteYloDevuelveEn201` — 201 + cliente visible en listados.
- `altaClienteConNitDuplicadoDevuelve409` — 409 en NIT repetido.

> Tablero no actualizado (solicitud explícita).
