package com.fieldflow.backend.dto;

import com.fieldflow.backend.entity.Tecnico;

import java.util.HashSet;
import java.util.Set;

public record TecnicoResponse(
        Long id,
        String nombre,
        Set<String> especialidades,
        boolean disponible) {

    public static TecnicoResponse from(Tecnico t) {
        // Materializar coleccion lazy para evitar LazyInitializationException al serializar
        Set<String> esp = t.getEspecialidades() == null
                ? new HashSet<>()
                : new HashSet<>(t.getEspecialidades());
        return new TecnicoResponse(t.getId(), t.getNombre(), esp, t.isDisponible());
    }
}