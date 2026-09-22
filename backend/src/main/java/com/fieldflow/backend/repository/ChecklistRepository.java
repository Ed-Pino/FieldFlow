package com.fieldflow.backend.repository;

import com.fieldflow.backend.entity.Checklist;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChecklistRepository extends JpaRepository<Checklist, Long> {
    List<Checklist> findByAplicaA(String aplicaA);
}
