package com.fieldflow.backend.repository;

import com.fieldflow.backend.entity.Sede;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SedeRepository extends JpaRepository<Sede, Long> {
    List<Sede> findByClienteId(Long clienteId);
}