package com.fieldflow.backend.service;

import com.fieldflow.backend.dto.AuthResponse;
import com.fieldflow.backend.dto.LoginRequest;
import com.fieldflow.backend.dto.RegisterRequest;
import com.fieldflow.backend.entity.Usuario;
import com.fieldflow.backend.repository.UsuarioRepository;
import com.fieldflow.backend.security.TokenService;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final TokenService tokenService;

    public AuthService(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder, TokenService tokenService) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenService = tokenService;
    }

    public AuthResponse login(LoginRequest request) {
        Usuario usuario = usuarioRepository.findByUsername(request.username())
                .orElseThrow(() -> new BadCredentialsException("Credenciales invalidas"));

        if (!passwordEncoder.matches(request.password(), usuario.getPassword())) {
            throw new BadCredentialsException("Credenciales invalidas");
        }

        String token = tokenService.generateToken(usuario.getUsername(), usuario.getRole().name());
        Long tecnicoId = usuario.getTecnico() != null ? usuario.getTecnico().getId() : null;
        return new AuthResponse(token, usuario.getUsername(), usuario.getRole().name(), tecnicoId);
    }

    public AuthResponse register(RegisterRequest request) {
        if (usuarioRepository.existsByUsername(request.username())) {
            throw new IllegalArgumentException("El usuario ya existe");
        }
        Usuario.Rol role;
        try {
            role = Usuario.Rol.valueOf(request.role().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Rol invalido: debe ser TECNICO o ADMIN");
        }
        if (role == Usuario.Rol.SUPER_ADMIN) {
            throw new IllegalArgumentException("Rol invalido: SUPER_ADMIN no puede crearse por registro");
        }
        Usuario usuario = new Usuario(
                request.username(),
                passwordEncoder.encode(request.password()),
                role);
        usuarioRepository.save(usuario);

        String token = tokenService.generateToken(usuario.getUsername(), usuario.getRole().name());
        return new AuthResponse(token, usuario.getUsername(), usuario.getRole().name(), null);
    }
}