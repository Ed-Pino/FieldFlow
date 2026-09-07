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
}