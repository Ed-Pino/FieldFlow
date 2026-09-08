package com.fieldflow.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Entity
@Table(name = "ordenes_trabajo")
@Getter
@Setter
@NoArgsConstructor
public class OrdenTrabajo {

    public enum EstadoOT {
        pendiente, asignada, enCamino, enEjecucion, pendienteConformidad, finalizada, reprogramada
    }

    public enum Prioridad {
        baja, media, alta, urgente
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "codigo", nullable = false, unique = true, length = 30)
    private String codigo;

    @Column(name = "tipo_servicio", nullable = false, length = 150)
    private String tipoServicio;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private EstadoOT estado;

    @Column(name = "fecha_creacion", nullable = false)
    private LocalDateTime fechaCreacion;

    @Column(name = "fecha_programada", nullable = false)
    private LocalDate fechaProgramada;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Prioridad prioridad = Prioridad.media;

    @Column(name = "duracion_estimada_min")
    private Integer duracionEstimadaMin;

    @Column(nullable = false, length = 1000)
    private String descripcion;

    @Column(length = 2000)
    private String notas;

    @Column(name = "firma_base64", length = 50000)
    private String firmaBase64;

    @ManyToOne(optional = false)
    @JoinColumn(name = "cliente_id")
    private Cliente cliente;

    @ManyToOne(optional = false)
    @JoinColumn(name = "sede_id")
    private Sede sede;

    @ManyToOne(optional = false)
    @JoinColumn(name = "equipo_id")
    private Equipo equipo;

    @ManyToOne
    @JoinColumn(name = "tecnico_id")
    private Tecnico tecnico;

    @ElementCollection
    @CollectionTable(name = "ot_checklist", joinColumns = @JoinColumn(name = "ot_id"))
    private List<CheckItem> checklist = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "ot_fotos", joinColumns = @JoinColumn(name = "ot_id"))
    @Column(name = "foto_url", length = 1000)
    private List<String> fotos = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "ot_historial", joinColumns = @JoinColumn(name = "ot_id"))
    @Column(name = "evento", length = 2000)
    private List<String> historial = new ArrayList<>();

    public OrdenTrabajo(String codigo, String tipoServicio, EstadoOT estado,
                        LocalDateTime fechaCreacion, LocalDate fechaProgramada,
                        String descripcion, Cliente cliente, Sede sede, Equipo equipo, Tecnico tecnico,
                        Prioridad prioridad, Integer duracionEstimadaMin) {
        this.codigo = codigo;
        this.tipoServicio = tipoServicio;
        this.estado = estado;
        this.fechaCreacion = fechaCreacion;
        this.fechaProgramada = fechaProgramada;
        this.descripcion = descripcion;
        this.cliente = cliente;
        this.sede = sede;
        this.equipo = equipo;
        this.tecnico = tecnico;
        this.prioridad = prioridad != null ? prioridad : Prioridad.media;
        this.duracionEstimadaMin = duracionEstimadaMin;
    }
}