package com.fieldflow.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CheckItem {

    @Column(nullable = false, length = 500)
    private String texto;

    @Column(nullable = false)
    private boolean hecho = false;

    @Column(length = 20)
    private String tipo;

    @Column(length = 30)
    private String unidad;

    @Column(length = 100)
    private String valor;

    public CheckItem(String texto) {
        this.texto = texto;
        this.hecho = false;
    }

    public CheckItem(String texto, boolean hecho) {
        this.texto = texto;
        this.hecho = hecho;
    }
}
