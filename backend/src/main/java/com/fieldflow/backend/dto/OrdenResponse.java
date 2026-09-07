package com.fieldflow.backend.dto;

import com.fieldflow.backend.entity.CheckItem;
import com.fieldflow.backend.entity.OrdenTrabajo;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public record OrdenResponse(
        Long id,
        String codigo,
        String tipoServicio,
        OrdenTrabajo.EstadoOT estado,
        LocalDateTime fechaCreacion,
        LocalDate fechaProgramada,
        String descripcion,
        String notas,
        String firmaBase64,
        String cliente,
        String sede,
        String equipo,
        String tecnico,
        List<CheckItem> checklist,
        List<String> fotos,
        List<String> historial) {

    public static OrdenResponse from(OrdenTrabajo ot) {
        // Materializar colecciones lazy para evitar LazyInitializationException al serializar
        List<CheckItem> checklist = ot.getChecklist() == null
                ? new ArrayList<>()
                : new ArrayList<>(ot.getChecklist());
        List<String> fotos = ot.getFotos() == null
                ? new ArrayList<>()
                : new ArrayList<>(ot.getFotos());
        List<String> historial = ot.getHistorial() == null
                ? new ArrayList<>()
                : new ArrayList<>(ot.getHistorial());

        return new OrdenResponse(
                ot.getId(),
                ot.getCodigo(),
                ot.getTipoServicio(),
                ot.getEstado(),
                ot.getFechaCreacion(),
                ot.getFechaProgramada(),
                ot.getDescripcion(),
                ot.getNotas(),
                ot.getFirmaBase64(),
                ot.getCliente() != null ? ot.getCliente().getNombre() : null,
                ot.getSede() != null ? ot.getSede().getNombre() : null,
                ot.getEquipo() != null ? ot.getEquipo().getNombre() : null,
                ot.getTecnico() != null ? ot.getTecnico().getNombre() : null,
                checklist,
                fotos,
                historial);
    }
}