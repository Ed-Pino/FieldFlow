package com.fieldflow.backend;

import com.fieldflow.backend.dto.OrdenResponse;
import com.fieldflow.backend.entity.Cliente;
import com.fieldflow.backend.entity.Equipo;
import com.fieldflow.backend.entity.OrdenTrabajo;
import com.fieldflow.backend.entity.Sede;
import com.fieldflow.backend.entity.Tecnico;
import com.fieldflow.backend.repository.ClienteRepository;
import com.fieldflow.backend.repository.EquipoRepository;
import com.fieldflow.backend.repository.OrdenTrabajoRepository;
import com.fieldflow.backend.repository.SedeRepository;
import com.fieldflow.backend.repository.TecnicoRepository;
import com.fieldflow.backend.service.OrdenService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@ActiveProfiles("demo")
@TestPropertySource(properties = "spring.datasource.url=jdbc:h2:mem:fieldflow_ordering;DB_CLOSE_DELAY=-1")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class OrdenServiceOrderingTest {

    @Autowired
    private OrdenService ordenService;

    @Autowired
    private OrdenTrabajoRepository ordenRepository;

    @Autowired
    private ClienteRepository clienteRepository;

    @Autowired
    private SedeRepository sedeRepository;

    @Autowired
    private EquipoRepository equipoRepository;

    @Autowired
    private TecnicoRepository tecnicoRepository;

    private Cliente cliente;
    private Sede sede;
    private Equipo equipo;
    private Equipo equipoEstufa;
    private Tecnico tecnico;

    @BeforeEach
    void setup() {
        cliente = clienteRepository.findAll().stream()
                .filter(c -> c.getNombre().equals("GasSolutions S.A.S")).findFirst().orElseThrow();
        sede = sedeRepository.findAll().stream()
                .filter(s -> s.getNombre().equals("Planta Principal")).findFirst().orElseThrow();
        equipo = equipoRepository.findAll().stream()
                .filter(e -> e.getCodigo().equals("CAL-001")).findFirst().orElseThrow();
        equipoEstufa = equipoRepository.findAll().stream()
                .filter(e -> e.getCodigo().equals("EST-005")).findFirst().orElseThrow();
        tecnico = tecnicoRepository.findAll().stream()
                .filter(t -> t.getNombre().equals("Eduin - Senior Gas")).findFirst().orElseThrow();
    }

    private OrdenTrabajo insertarOT(String codigo, LocalDateTime fechaCreacion, LocalDate fechaProgramada) {
        OrdenTrabajo ot = new OrdenTrabajo(
                codigo, "Mantenimiento Preventivo", OrdenTrabajo.EstadoOT.asignada,
                fechaCreacion, fechaProgramada, "Orden de prueba",
                cliente, sede, equipo, tecnico,
                OrdenTrabajo.Prioridad.media, 60);
        ot.setHistorial(List.of("OT " + codigo + " creada"));
        return ordenRepository.save(ot);
    }

    private OrdenTrabajo insertarOTEnEquipo(String codigo, LocalDateTime fechaCreacion, Equipo target) {
        OrdenTrabajo ot = new OrdenTrabajo(
                codigo, "Mantenimiento Preventivo", OrdenTrabajo.EstadoOT.asignada,
                fechaCreacion, LocalDate.now(), "Orden de prueba",
                cliente, sede, target, tecnico,
                OrdenTrabajo.Prioridad.media, 60);
        ot.setHistorial(List.of("OT " + codigo + " creada"));
        return ordenRepository.save(ot);
    }

    @Test
    void agendaDelTecnicoOrdenadaPorFechaProgramadaAsc() {
        LocalDate hoy = LocalDate.now();
        insertarOT("ORD-AGT-A", LocalDateTime.now().minusDays(3), hoy.minusDays(5));
        insertarOT("ORD-AGT-B", LocalDateTime.now().minusDays(2), hoy.plusDays(1));
        insertarOT("ORD-AGT-C", LocalDateTime.now().minusDays(1), hoy.plusDays(10));

        List<OrdenResponse> agenda = ordenService.getAgendaTecnico(tecnico.getId());

        List<LocalDate> fechas = agenda.stream().map(OrdenResponse::fechaProgramada).toList();
        for (int i = 1; i < fechas.size(); i++) {
            assertTrue(fechas.get(i).isAfter(fechas.get(i - 1)),
                    "Agenda debe estar ordenada ASC: " + fechas);
        }
        assertEquals(4, agenda.size(), "Agenda debe incluir la OT seed + 3 creadas en el test");
        assertEquals(LocalDate.of(hoy.getYear(), hoy.getMonth(), hoy.getDayOfMonth()),
                agenda.get(1).fechaProgramada());
    }

    @Test
    void trazabilidadDelEquipoOrdenadaPorFechaCreacionDesc() {
        LocalDateTime ahora = LocalDateTime.now();
        insertarOTEnEquipo("ORD-TRZ-A", ahora.minusDays(10), equipoEstufa);
        insertarOTEnEquipo("ORD-TRZ-B", ahora, equipoEstufa);

        List<OrdenResponse> trazabilidad = ordenService.getTrazabilidad(equipoEstufa.getId());

        assertEquals(2, trazabilidad.size(), "Trazabilidad debe incluir solo las OTs del equipo EST-005");
        assertTrue(trazabilidad.get(0).fechaCreacion().isAfter(trazabilidad.get(1).fechaCreacion()),
                "Trazabilidad debe estar ordenada DESC");
        assertEquals("ORD-TRZ-B", trazabilidad.get(0).codigo());
        assertEquals("ORD-TRZ-A", trazabilidad.get(1).codigo());
    }
}