package com.fieldflow.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "equipos")
@Getter
@Setter
@NoArgsConstructor
public class Equipo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String codigo;

    @Column(nullable = false, length = 150)
    private String nombre;

    @Column(nullable = false, length = 100)
    private String tipo;

    @Column(name = "ultimo_mantenimiento")
    private LocalDate ultimoMantenimiento;

    @ManyToOne(optional = false)
    @JoinColumn(name = "sede_id")
    private Sede sede;

    @OneToMany(mappedBy = "equipo", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrdenTrabajo> ordenes = new ArrayList<>();

    public Equipo(String codigo, String nombre, String tipo, LocalDate ultimoMantenimiento, Sede sede) {
        this.codigo = codigo;
        this.nombre = nombre;
        this.tipo = tipo;
        this.ultimoMantenimiento = ultimoMantenimiento;
        this.sede = sede;
    }
}