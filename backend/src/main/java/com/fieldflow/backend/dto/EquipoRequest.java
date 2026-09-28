package com.fieldflow.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record EquipoRequest(
        @NotNull Long sedeId,
        @NotBlank String codigo,
        @NotBlank String nombre,
        @NotBlank String tipo,
        LocalDate ultimoMantenimiento) {
}
