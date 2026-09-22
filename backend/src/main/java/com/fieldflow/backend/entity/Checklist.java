package com.fieldflow.backend.entity;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "checklists")
@Getter
@Setter
@NoArgsConstructor
public class Checklist {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 40)
    private String codigo;

    @Column(nullable = false, length = 150)
    private String nombre;

    @Column(length = 200)
    private String aplicaA;

    @ElementCollection
    @CollectionTable(name = "checklist_items", joinColumns = @JoinColumn(name = "checklist_id"))
    private List<CheckItem> items = new ArrayList<>();

    public Checklist(String codigo, String nombre, String aplicaA, List<CheckItem> items) {
        this.codigo = codigo;
        this.nombre = nombre;
        this.aplicaA = aplicaA;
        this.items = items;
    }
}
