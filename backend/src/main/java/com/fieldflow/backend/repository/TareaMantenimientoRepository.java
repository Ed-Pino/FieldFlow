package com.fieldflow.backend.repository;

import com.fieldflow.backend.entity.TareaMantenimiento;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TareaMantenimientoRepository extends JpaRepository<TareaMantenimiento, Long> {
    List<TareaMantenimiento> findByProductoId(Long productoId);
}
