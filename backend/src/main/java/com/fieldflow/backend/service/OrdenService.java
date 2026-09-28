package com.fieldflow.backend.service;

import com.fieldflow.backend.dto.ConformidadRequest;
import com.fieldflow.backend.dto.EvidenciaRequest;
import com.fieldflow.backend.dto.OrdenRequest;
import com.fieldflow.backend.dto.OrdenResponse;
import com.fieldflow.backend.entity.*;
import com.fieldflow.backend.repository.*;
import jakarta.annotation.PostConstruct;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.atomic.AtomicInteger;

@Service
@Transactional(readOnly = true)
public class OrdenService {

    private static final AtomicInteger SEQUENCE = new AtomicInteger(1002);

    private static final Map<OrdenTrabajo.EstadoOT, Set<OrdenTrabajo.EstadoOT>> TRANSICIONES_VALIDAS = Map.of(
            OrdenTrabajo.EstadoOT.pendiente, Set.of(OrdenTrabajo.EstadoOT.asignada),
            OrdenTrabajo.EstadoOT.asignada, Set.of(OrdenTrabajo.EstadoOT.enCamino, OrdenTrabajo.EstadoOT.reprogramada),
            OrdenTrabajo.EstadoOT.enCamino, Set.of(OrdenTrabajo.EstadoOT.enEjecucion, OrdenTrabajo.EstadoOT.reprogramada),
            OrdenTrabajo.EstadoOT.enEjecucion, Set.of(OrdenTrabajo.EstadoOT.pendienteConformidad, OrdenTrabajo.EstadoOT.reprogramada),
            OrdenTrabajo.EstadoOT.pendienteConformidad, Set.of(OrdenTrabajo.EstadoOT.finalizada, OrdenTrabajo.EstadoOT.reprogramada),
            OrdenTrabajo.EstadoOT.finalizada, Set.of(),
            OrdenTrabajo.EstadoOT.reprogramada, Set.of(OrdenTrabajo.EstadoOT.pendiente));

    private final OrdenTrabajoRepository ordenRepository;
    private final ClienteRepository clienteRepository;
    private final SedeRepository sedeRepository;
    private final EquipoRepository equipoRepository;
    private final TecnicoRepository tecnicoRepository;

    public OrdenService(OrdenTrabajoRepository ordenRepository, ClienteRepository clienteRepository,
                        SedeRepository sedeRepository, EquipoRepository equipoRepository,
                        TecnicoRepository tecnicoRepository) {
        this.ordenRepository = ordenRepository;
        this.clienteRepository = clienteRepository;
        this.sedeRepository = sedeRepository;
        this.equipoRepository = equipoRepository;
        this.tecnicoRepository = tecnicoRepository;
    }

    /**
     * La secuencia en memoria se pierde en cada reinicio; se reinicia desde el
     * maximo codigo existente (OT-NNNN) para no generar duplicados (columna unique).
     */
    @PostConstruct
    void initSequence() {
        int max = 1001;
        for (OrdenTrabajo ot : ordenRepository.findAll()) {
            String codigo = ot.getCodigo();
            if (codigo != null && codigo.startsWith("OT-")) {
                try {
                    max = Math.max(max, Integer.parseInt(codigo.substring(3)));
                } catch (NumberFormatException ignored) {
                    // codigos con formato no numerico se ignoran
                }
            }
        }
        SEQUENCE.set(max + 1);
    }

    public List<OrdenResponse> getAll() {
        return ordenRepository.findAll().stream().map(OrdenResponse::from).toList();
    }

    public OrdenResponse getById(Long id) {
        return OrdenResponse.from(getOrThrow(id));
    }

    public List<OrdenResponse> getTrazabilidad(Long equipoId) {
        return ordenRepository.findByEquipoIdOrderByFechaCreacionDesc(equipoId)
                .stream().map(OrdenResponse::from).toList();
    }

    public List<OrdenResponse> getTrazabilidadDeEquipo(Long ordenId) {
        OrdenTrabajo ot = getOrThrow(ordenId);
        return getTrazabilidad(ot.getEquipo().getId());
    }

    public List<OrdenResponse> getAgendaTecnico(Long tecnicoId) {
        return ordenRepository.findByTecnicoIdOrderByFechaProgramadaAsc(tecnicoId)
                .stream().map(OrdenResponse::from).toList();
    }

    @Transactional
    public OrdenResponse create(OrdenRequest request) {
        Cliente cliente = clienteRepository.findById(request.clienteId())
                .orElseThrow(() -> new EntityNotFoundException("Cliente no encontrado"));
        Sede sede = sedeRepository.findById(request.sedeId())
                .orElseThrow(() -> new EntityNotFoundException("Sede no encontrada"));
        Equipo equipo = equipoRepository.findById(request.equipoId())
                .orElseThrow(() -> new EntityNotFoundException("Equipo no encontrado"));
        Tecnico tecnico = request.tecnicoId() == null ? null
                : tecnicoRepository.findById(request.tecnicoId())
                .orElseThrow(() -> new EntityNotFoundException("Tecnico no encontrado"));

        String codigo = "OT-" + SEQUENCE.getAndIncrement();
        OrdenTrabajo ot = new OrdenTrabajo(
                codigo, request.tipoServicio(), OrdenTrabajo.EstadoOT.pendiente,
                LocalDateTime.now(), request.fechaProgramada(), request.descripcion(),
                cliente, sede, equipo, tecnico,
                request.prioridad(), request.duracionEstimadaMin());
        ot.setChecklist(request.checklist());
        ot.setHistorial(List.of("OT " + codigo + " creada"));
        return OrdenResponse.from(ordenRepository.save(ot));
    }

    @Transactional
    public OrdenResponse updateEstado(Long id, OrdenTrabajo.EstadoOT nuevoEstado) {
        OrdenTrabajo ot = getOrThrow(id);
        OrdenTrabajo.EstadoOT actual = ot.getEstado();
        if (!TRANSICIONES_VALIDAS.getOrDefault(actual, Set.of()).contains(nuevoEstado)) {
            throw new IllegalArgumentException("Transicion no permitida de " + actual + " a " + nuevoEstado);
        }
        ot.setEstado(nuevoEstado);
        ot.getHistorial().add(nuevoEstado.name() + " "
                + LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        return OrdenResponse.from(ordenRepository.save(ot));
    }

    @Transactional
    public OrdenResponse asignarTecnico(Long id, Long tecnicoId) {
        OrdenTrabajo ot = getOrThrow(id);
        Tecnico tecnico = tecnicoId == null ? null
                : tecnicoRepository.findById(tecnicoId)
                .orElseThrow(() -> new EntityNotFoundException("Tecnico no encontrado"));
        ot.setTecnico(tecnico);
        ot.getHistorial().add("Tecnico asignado: " + (tecnico == null ? "sin asignar" : tecnico.getNombre())
                + " " + LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        return OrdenResponse.from(ordenRepository.save(ot));
    }

    @Transactional
    public OrdenResponse agendar(Long id, java.time.LocalDate fechaProgramada) {
        OrdenTrabajo ot = getOrThrow(id);
        ot.setFechaProgramada(fechaProgramada);
        ot.getHistorial().add("Reprogramada para " + fechaProgramada + " "
                + LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        return OrdenResponse.from(ordenRepository.save(ot));
    }

    @Transactional
    public OrdenResponse registrarEvidencia(Long id, EvidenciaRequest request) {
        OrdenTrabajo ot = getOrThrow(id);
        if (request.notas() != null) {
            ot.setNotas(request.notas());
        }
        if (request.checklist() != null) {
            ot.setChecklist(request.checklist());
        }
        if (request.fotos() != null) {
            ot.setFotos(request.fotos());
        }
        ot.getHistorial().add("Evidencia registrada "
                + LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        return OrdenResponse.from(ordenRepository.save(ot));
    }

    @Transactional
    public OrdenResponse guardarConformidad(Long id, ConformidadRequest request) {
        OrdenTrabajo ot = getOrThrow(id);
        if (ot.getEstado() != OrdenTrabajo.EstadoOT.pendienteConformidad) {
            throw new IllegalArgumentException(
                    "Conformidad solo permitida en estado pendienteConformidad (actual: " + ot.getEstado() + ")");
        }
        ot.setNotas(request.notas());
        ot.setFirmaBase64(request.firma());
        ot.setEstado(OrdenTrabajo.EstadoOT.finalizada);
        ot.getHistorial().add("Finalizada con conformidad " + LocalDateTime.now()
                .format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        return OrdenResponse.from(ordenRepository.save(ot));
    }

    private OrdenTrabajo getOrThrow(Long id) {
        return ordenRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Orden de trabajo no encontrada"));
    }
}