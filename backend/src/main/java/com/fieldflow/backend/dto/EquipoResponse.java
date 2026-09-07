package com.fieldflow.backend.dto;

import com.fieldflow.backend.entity.Equipo;

import java.time.LocalDate;

public record EquipoResponse(
        Long id,
        String codigo,
        String nombre,
        String tipo,
        LocalDate ultimoMantenimiento,
        Long sedeId) {

    public static EquipoResponse from(Equipo e) {
        return new EquipoResponse(e.getId(), e.getCodigo(), e.getNombre(), e.getTipo(),
                e.getUltimoMantenimiento(), e.getSede() != null ? e.getSede().getId() : null);
    }
}