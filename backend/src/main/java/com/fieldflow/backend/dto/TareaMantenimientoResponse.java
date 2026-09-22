package com.fieldflow.backend.dto;

import com.fieldflow.backend.entity.TareaMantenimiento;

public record TareaMantenimientoResponse(
        Long id,
        Long productoId,
        String productoCodigo,
        String nombre,
        String descripcion,
        int frecuenciaMeses,
        int diasAnticipacion) {

    public static TareaMantenimientoResponse from(TareaMantenimiento t) {
        return new TareaMantenimientoResponse(
                t.getId(),
                t.getProducto() != null ? t.getProducto().getId() : null,
                t.getProducto() != null ? t.getProducto().getCodigo() : null,
                t.getNombre(),
                t.getDescripcion(),
                t.getFrecuenciaMeses(),
                t.getDiasAnticipacion());
    }
}
