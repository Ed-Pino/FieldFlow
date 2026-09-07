package com.fieldflow.backend.dto;

import com.fieldflow.backend.entity.CheckItem;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public record OrdenRequest(
        @NotBlank String tipoServicio,
        @NotBlank String descripcion,
        @NotNull Long clienteId,
        @NotNull Long sedeId,
        @NotNull Long equipoId,
        Long tecnicoId,
        @NotNull @FutureOrPresent LocalDate fechaProgramada,
        List<CheckItem> checklist) {

    public OrdenRequest {
        checklist = checklist == null ? new ArrayList<>() : checklist;
    }
}