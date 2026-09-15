package com.fieldflow.backend.controller;

import com.fieldflow.backend.dto.ConformidadRequest;
import com.fieldflow.backend.dto.EstadoRequest;
import com.fieldflow.backend.dto.EvidenciaRequest;
import com.fieldflow.backend.dto.OrdenRequest;
import com.fieldflow.backend.dto.OrdenResponse;
import com.fieldflow.backend.service.OrdenService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ordenes")
public class OrdenController {

    private final OrdenService ordenService;

    public OrdenController(OrdenService ordenService) {
        this.ordenService = ordenService;
    }

    @GetMapping
    public List<OrdenResponse> getAll() {
        return ordenService.getAll();
    }

    @GetMapping("/{id}")
    public OrdenResponse getById(@PathVariable Long id) {
        return ordenService.getById(id);
    }

    @GetMapping("/{id}/trazabilidad")
    public List<OrdenResponse> getTrazabilidad(@PathVariable Long id) {
        return ordenService.getTrazabilidadDeEquipo(id);
    }

    @GetMapping("/agenda/{tecnicoId}")
    public List<OrdenResponse> getAgendaTecnico(@PathVariable Long tecnicoId) {
        return ordenService.getAgendaTecnico(tecnicoId);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<OrdenResponse> create(@Valid @RequestBody OrdenRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ordenService.create(request));
    }

    @PutMapping("/{id}/estado")
    public OrdenResponse updateEstado(@PathVariable Long id, @RequestBody EstadoRequest request) {
        return ordenService.updateEstado(id, request.estado());
    }

    @PutMapping("/{id}/evidencia")
    public OrdenResponse registrarEvidencia(@PathVariable Long id, @RequestBody EvidenciaRequest request) {
        return ordenService.registrarEvidencia(id, request);
    }

    @PostMapping("/{id}/conformidad")
    public OrdenResponse guardarConformidad(@PathVariable Long id, @Valid @RequestBody ConformidadRequest request) {
        return ordenService.guardarConformidad(id, request);
    }
}