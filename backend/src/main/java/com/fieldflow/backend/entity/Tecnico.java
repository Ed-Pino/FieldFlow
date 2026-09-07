package com.fieldflow.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "tecnicos")
@Getter
@Setter
@NoArgsConstructor
public class Tecnico {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String nombre;

    @ElementCollection
    @CollectionTable(name = "tecnico_especialidades", joinColumns = @JoinColumn(name = "tecnico_id"))
    @Column(name = "especialidad", length = 100)
    private Set<String> especialidades = new HashSet<>();

    @Column(nullable = false)
    private boolean disponible = true;

    @OneToMany(mappedBy = "tecnico")
    private List<OrdenTrabajo> ordenes = new ArrayList<>();

    public Tecnico(String nombre, Set<String> especialidades) {
        this.nombre = nombre;
        this.especialidades = especialidades;
    }
}