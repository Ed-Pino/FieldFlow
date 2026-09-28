package com.fieldflow.backend.dto;

import com.fieldflow.backend.entity.CheckItem;
import com.fieldflow.backend.entity.Checklist;

import java.util.List;

public record ChecklistResponse(
        Long id,
        String codigo,
        String nombre,
        String aplicaA,
        List<CheckItemResponse> items) {

    public static ChecklistResponse from(Checklist c) {
        List<CheckItemResponse> it = c.getItems() == null ? List.of()
                : c.getItems().stream().map(CheckItemResponse::from).toList();
        return new ChecklistResponse(c.getId(), c.getCodigo(), c.getNombre(),
                c.getAplicaA(), it);
    }

    public record CheckItemResponse(String texto, boolean hecho, String tipo, String unidad, String valor) {
        public static CheckItemResponse from(CheckItem i) {
            return new CheckItemResponse(i.getTexto(), i.isHecho(),
                    i.getTipo() == null ? "SI_NO" : i.getTipo(), i.getUnidad(), i.getValor());
        }
    }
}
