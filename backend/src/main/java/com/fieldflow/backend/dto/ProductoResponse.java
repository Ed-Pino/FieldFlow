package com.fieldflow.backend.dto;

import com.fieldflow.backend.entity.Producto;

public record ProductoResponse(
        Long id,
        String codigo,
        String nombre,
        String categoria,
        String marca,
        String modelo) {

    public static ProductoResponse from(Producto p) {
        return new ProductoResponse(p.getId(), p.getCodigo(), p.getNombre(),
                p.getCategoria(), p.getMarca(), p.getModelo());
    }
}
