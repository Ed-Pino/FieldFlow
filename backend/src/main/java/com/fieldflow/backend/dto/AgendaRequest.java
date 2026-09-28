package com.fieldflow.backend.dto;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record AgendaRequest(
        @NotNull @FutureOrPresent LocalDate fechaProgramada) {
}
