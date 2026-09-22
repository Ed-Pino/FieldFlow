package com.fieldflow.backend.dto;

import com.fieldflow.backend.entity.FallaRecurrente;

public record FallaRecurrenteResponse(
        Long id,
        Long productoId,
        String productoCodigo,
        String nombre,
        String sintoma,
        int contadorCasos) {

    public static FallaRecurrenteResponse from(FallaRecurrente f) {
        return new FallaRecurrenteResponse(
                f.getId(),
                f.getProducto() != null ? f.getProducto().getId() : null,
                f.getProducto() != null ? f.getProducto().getCodigo() : null,
                f.getNombre(),
                f.getSintoma(),
                f.getContadorCasos());
    }
}
