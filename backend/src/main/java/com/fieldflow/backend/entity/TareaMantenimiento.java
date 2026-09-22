package com.fieldflow.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "tareas_mantenimiento")
@Getter
@Setter
@NoArgsConstructor
public class TareaMantenimiento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "producto_id")
    private Producto producto;

    @Column(nullable = false, length = 200)
    private String nombre;

    @Column(nullable = false, length = 500)
    private String descripcion;

    @Column(nullable = false)
    private int frecuenciaMeses;

    @Column(nullable = false)
    private int diasAnticipacion;

    public TareaMantenimiento(Producto producto, String nombre, String descripcion,
                              int frecuenciaMeses, int diasAnticipacion) {
        this.producto = producto;
        this.nombre = nombre;
        this.descripcion = descripcion;
        this.frecuenciaMeses = frecuenciaMeses;
        this.diasAnticipacion = diasAnticipacion;
    }
}
