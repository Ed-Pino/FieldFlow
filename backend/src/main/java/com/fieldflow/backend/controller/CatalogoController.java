package com.fieldflow.backend.controller;

import com.fieldflow.backend.dto.ClienteResponse;
import com.fieldflow.backend.dto.EquipoResponse;
import com.fieldflow.backend.dto.SedeResponse;
import com.fieldflow.backend.dto.TecnicoResponse;
import com.fieldflow.backend.service.CatalogoService;
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

    @GetMapping("/sedes")
    public List<SedeResponse> getSedes(@RequestParam(required = false) Long clienteId) {
        return catalogoService.getSedes(clienteId);
    }

    @GetMapping("/equipos")
    public List<EquipoResponse> getEquipos(@RequestParam(required = false) Long sedeId) {
        return catalogoService.getEquipos(sedeId);
    }

    @GetMapping("/tecnicos")
    public List<TecnicoResponse> getTecnicos() {
        return catalogoService.getTecnicos();
    }
}