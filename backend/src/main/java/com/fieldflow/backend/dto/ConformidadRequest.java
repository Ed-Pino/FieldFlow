package com.fieldflow.backend.dto;

import jakarta.validation.constraints.NotBlank;

public record ConformidadRequest(
        @NotBlank String notas,
        @NotBlank String firma) {
}