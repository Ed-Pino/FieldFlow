package com.fieldflow.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record SedeRequest(
        @NotNull Long clienteId,
        @NotBlank String nombre,
        @NotBlank String direccion,
        @NotBlank String ciudad) {
}
