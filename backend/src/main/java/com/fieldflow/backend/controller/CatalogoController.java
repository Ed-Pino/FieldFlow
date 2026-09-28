package com.fieldflow.backend.controller;

import com.fieldflow.backend.dto.ChecklistResponse;
import com.fieldflow.backend.dto.ClienteRequest;
import com.fieldflow.backend.dto.ClienteResponse;
import com.fieldflow.backend.dto.EquipoRequest;
import com.fieldflow.backend.dto.EquipoResponse;
import com.fieldflow.backend.dto.FallaRecurrenteResponse;
import com.fieldflow.backend.dto.ProductoResponse;
import com.fieldflow.backend.dto.SedeRequest;
import com.fieldflow.backend.dto.SedeResponse;
import com.fieldflow.backend.dto.TareaMantenimientoResponse;
import com.fieldflow.backend.dto.TecnicoResponse;
import com.fieldflow.backend.service.CatalogoService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class CatalogoController {

    private final CatalogoService catalogoService;

    public CatalogoController(CatalogoService catalogoService) {
        this.catalogoService = catalogoService;
    }

    @GetMapping("/clientes")
    public List<ClienteResponse> getClientes() {
        return catalogoService.getClientes();
    }

    @PostMapping("/clientes")
    public ResponseEntity<ClienteResponse> altaCliente(@RequestBody @Valid ClienteRequest request) {
        ClienteResponse creado = catalogoService.altaCliente(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(creado);
    }

    @GetMapping("/sedes")
    public List<SedeResponse> getSedes(@RequestParam(required = false) Long clienteId) {
        return catalogoService.getSedes(clienteId);
    }

    @PostMapping("/sedes")
    public ResponseEntity<SedeResponse> altaSede(@RequestBody @Valid SedeRequest request) {
        SedeResponse creada = catalogoService.altaSede(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(creada);
    }

    @GetMapping("/equipos")
    public List<EquipoResponse> getEquipos(@RequestParam(required = false) Long sedeId) {
        return catalogoService.getEquipos(sedeId);
    }

    @GetMapping("/equipos/{id}")
    public EquipoResponse getEquipo(@PathVariable Long id) {
        return catalogoService.getEquipo(id);
    }

    @PostMapping("/equipos")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<EquipoResponse> altaEquipo(@RequestBody @Valid EquipoRequest request) {
        EquipoResponse creado = catalogoService.altaEquipo(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(creado);
    }

    @GetMapping("/tecnicos")
    public List<TecnicoResponse> getTecnicos() {
        return catalogoService.getTecnicos();
    }

    @GetMapping("/tecnicos/disponibles")
    public List<TecnicoResponse> getTecnicosDisponibles() {
        return catalogoService.getTecnicosDisponibles();
    }

    @GetMapping("/productos")
    public List<ProductoResponse> getProductos() {
        return catalogoService.getProductos();
    }

    @GetMapping("/tareas-mantenimiento")
    public List<TareaMantenimientoResponse> getTareasMantenimiento(
            @RequestParam(required = false) Long productoId) {
        return catalogoService.getTareasMantenimiento(productoId);
    }

    @GetMapping("/fallas-recurrentes")
    public List<FallaRecurrenteResponse> getFallasRecurrentes(
            @RequestParam(required = false) Long productoId) {
        return catalogoService.getFallasRecurrentes(productoId);
    }

    @GetMapping("/checklists")
    public List<ChecklistResponse> getChecklists() {
        return catalogoService.getChecklists();
    }

    @DeleteMapping("/productos/{id}")
    public void deleteProducto(@PathVariable Long id) {
        catalogoService.deleteProducto(id);
    }

    @DeleteMapping("/tareas-mantenimiento/{id}")
    public void deleteTareaMantenimiento(@PathVariable Long id) {
        catalogoService.deleteTareaMantenimiento(id);
    }

    @DeleteMapping("/fallas-recurrentes/{id}")
    public void deleteFallaRecurrente(@PathVariable Long id) {
        catalogoService.deleteFallaRecurrente(id);
    }

    @DeleteMapping("/checklists/{id}")
    public void deleteChecklist(@PathVariable Long id) {
        catalogoService.deleteChecklist(id);
    }

    @DeleteMapping("/clientes/{id}")
    public void deleteCliente(@PathVariable Long id) {
        catalogoService.deleteCliente(id);
    }

    @DeleteMapping("/sedes/{id}")
    public void deleteSede(@PathVariable Long id) {
        catalogoService.deleteSede(id);
    }

    @DeleteMapping("/equipos/{id}")
    public void deleteEquipo(@PathVariable Long id) {
        catalogoService.deleteEquipo(id);
    }

    @DeleteMapping("/tecnicos/{id}")
    public void deleteTecnico(@PathVariable Long id) {
        catalogoService.deleteTecnico(id);
    }
}