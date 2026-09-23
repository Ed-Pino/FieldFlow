package com.fieldflow.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record EquipoRequest(
        @NotBlank String codigo,
        @NotBlank String nombre,
        @NotBlank String tipo,
        @NotNull Long sedeId) {
}
