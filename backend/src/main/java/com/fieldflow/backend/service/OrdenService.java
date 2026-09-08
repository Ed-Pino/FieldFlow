package com.fieldflow.backend.service;

import com.fieldflow.backend.dto.ConformidadRequest;
import com.fieldflow.backend.dto.OrdenRequest;
import com.fieldflow.backend.dto.OrdenResponse;
import com.fieldflow.backend.entity.*;
import com.fieldflow.backend.repository.*;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

@Service
@Transactional(readOnly = true)
public class OrdenService {

    private static final AtomicInteger SEQUENCE = new AtomicInteger(1002);

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
        ot.setEstado(nuevoEstado);
        ot.getHistorial().add(nuevoEstado.name() + " "
                + LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        return OrdenResponse.from(ordenRepository.save(ot));
    }

    @Transactional
    public OrdenResponse guardarConformidad(Long id, ConformidadRequest request) {
        OrdenTrabajo ot = getOrThrow(id);
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