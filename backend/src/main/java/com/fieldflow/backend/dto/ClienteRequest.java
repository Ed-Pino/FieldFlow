package com.fieldflow.backend.dto;

import com.fieldflow.backend.entity.Cliente;

public record ClienteRequest(String nombre, String nit) {

    public Cliente toEntity() {
        return new Cliente(nombre, nit);
    }
}
