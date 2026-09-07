package com.fieldflow.backend.dto;

import com.fieldflow.backend.entity.Cliente;

public record ClienteResponse(
        Long id,
        String nombre,
        String nit) {

    public static ClienteResponse from(Cliente c) {
        return new ClienteResponse(c.getId(), c.getNombre(), c.getNit());
    }
}