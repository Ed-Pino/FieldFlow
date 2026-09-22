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
@Table(name = "fallas_recurrentes")
@Getter
@Setter
@NoArgsConstructor
public class FallaRecurrente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "producto_id")
    private Producto producto;

    @Column(nullable = false, length = 250)
    private String nombre;

    @Column(length = 600)
    private String sintoma;

    @Column(nullable = false)
    private int contadorCasos;

    public FallaRecurrente(Producto producto, String nombre, String sintoma, int contadorCasos) {
        this.producto = producto;
        this.nombre = nombre;
        this.sintoma = sintoma;
        this.contadorCasos = contadorCasos;
    }
}
