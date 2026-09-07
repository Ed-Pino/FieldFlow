package com.fieldflow.backend.dto;

import com.fieldflow.backend.entity.OrdenTrabajo;

public record EstadoRequest(
        OrdenTrabajo.EstadoOT estado) {
}