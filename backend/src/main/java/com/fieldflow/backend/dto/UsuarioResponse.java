package com.fieldflow.backend.dto;

import com.fieldflow.backend.entity.Usuario;

public record UsuarioResponse(
        Long id,
        String username,
        Usuario.Rol role) {

    public static UsuarioResponse from(Usuario u) {
        return new UsuarioResponse(u.getId(), u.getUsername(), u.getRole());
    }
}