package com.fieldflow.backend.dto;

import com.fieldflow.backend.entity.CheckItem;

import java.util.List;

public record EvidenciaRequest(
        String notas,
        List<CheckItem> checklist,
        List<String> fotos) {
}