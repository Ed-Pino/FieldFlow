package com.fieldflow.backend.repository;

import com.fieldflow.backend.entity.Equipo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EquipoRepository extends JpaRepository<Equipo, Long> {
    List<Equipo> findBySedeId(Long sedeId);
    Optional<Equipo> findByCodigo(String codigo);
}