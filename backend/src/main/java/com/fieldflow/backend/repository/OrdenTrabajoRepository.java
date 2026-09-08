package com.fieldflow.backend.repository;

import com.fieldflow.backend.entity.OrdenTrabajo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrdenTrabajoRepository extends JpaRepository<OrdenTrabajo, Long> {
    List<OrdenTrabajo> findByEquipoIdOrderByFechaCreacionDesc(Long equipoId);
    List<OrdenTrabajo> findByTecnicoIdOrderByFechaCreacionDesc(Long tecnicoId);
    List<OrdenTrabajo> findByTecnicoIdOrderByFechaProgramadaAsc(Long tecnicoId);
    long countByEstado(OrdenTrabajo.EstadoOT estado);
}