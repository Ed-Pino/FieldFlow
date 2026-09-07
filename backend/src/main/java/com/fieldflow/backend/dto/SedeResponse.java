package com.fieldflow.backend.dto;

import com.fieldflow.backend.entity.Sede;

public record SedeResponse(
        Long id,
        String nombre,
        String direccion,
        String ciudad,
        Long clienteId) {

    public static SedeResponse from(Sede s) {
        return new SedeResponse(s.getId(), s.getNombre(), s.getDireccion(), s.getCiudad(),
                s.getCliente() != null ? s.getCliente().getId() : null);
    }
}