package com.fieldflow.backend.repository;

import com.fieldflow.backend.entity.FallaRecurrente;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FallaRecurrenteRepository extends JpaRepository<FallaRecurrente, Long> {
    List<FallaRecurrente> findByProductoId(Long productoId);
}
