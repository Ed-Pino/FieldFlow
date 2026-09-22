package com.fieldflow.backend.service;

import com.fieldflow.backend.dto.ChecklistResponse;
import com.fieldflow.backend.dto.ClienteRequest;
import com.fieldflow.backend.dto.ClienteResponse;
import com.fieldflow.backend.dto.EquipoResponse;
import com.fieldflow.backend.dto.FallaRecurrenteResponse;
import com.fieldflow.backend.dto.ProductoResponse;
import com.fieldflow.backend.dto.SedeResponse;
import com.fieldflow.backend.dto.TareaMantenimientoResponse;
import com.fieldflow.backend.dto.TecnicoResponse;
import com.fieldflow.backend.repository.ChecklistRepository;
import com.fieldflow.backend.repository.ClienteRepository;
import com.fieldflow.backend.repository.EquipoRepository;
import com.fieldflow.backend.repository.FallaRecurrenteRepository;
import com.fieldflow.backend.repository.ProductoRepository;
import com.fieldflow.backend.repository.SedeRepository;
import com.fieldflow.backend.repository.TareaMantenimientoRepository;
import com.fieldflow.backend.repository.TecnicoRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class CatalogoService {

    private final ClienteRepository clienteRepository;
    private final SedeRepository sedeRepository;
    private final EquipoRepository equipoRepository;
    private final TecnicoRepository tecnicoRepository;
    private final ProductoRepository productoRepository;
    private final TareaMantenimientoRepository tareaMantenimientoRepository;
    private final FallaRecurrenteRepository fallaRecurrenteRepository;
    private final ChecklistRepository checklistRepository;

    public CatalogoService(ClienteRepository clienteRepository, SedeRepository sedeRepository,
                           EquipoRepository equipoRepository, TecnicoRepository tecnicoRepository,
                           ProductoRepository productoRepository,
                           TareaMantenimientoRepository tareaMantenimientoRepository,
                           FallaRecurrenteRepository fallaRecurrenteRepository,
                           ChecklistRepository checklistRepository) {
        this.clienteRepository = clienteRepository;
        this.sedeRepository = sedeRepository;
        this.equipoRepository = equipoRepository;
        this.tecnicoRepository = tecnicoRepository;
        this.productoRepository = productoRepository;
        this.tareaMantenimientoRepository = tareaMantenimientoRepository;
        this.fallaRecurrenteRepository = fallaRecurrenteRepository;
        this.checklistRepository = checklistRepository;
    }

    public List<ClienteResponse> getClientes() {
        return clienteRepository.findAll().stream().map(ClienteResponse::from).toList();
    }

    @Transactional
    public ClienteResponse altaCliente(ClienteRequest request) {
        clienteRepository.findByNit(request.nit()).ifPresent(existente -> {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe un cliente con ese NIT");
        });
        return ClienteResponse.from(clienteRepository.save(request.toEntity()));
    }

    public List<ProductoResponse> getProductos() {
        return productoRepository.findAll().stream().map(ProductoResponse::from).toList();
    }

    public List<TareaMantenimientoResponse> getTareasMantenimiento(Long productoId) {
        return (productoId == null ? tareaMantenimientoRepository.findAll()
                : tareaMantenimientoRepository.findByProductoId(productoId))
                .stream().map(TareaMantenimientoResponse::from).toList();
    }

    public List<FallaRecurrenteResponse> getFallasRecurrentes(Long productoId) {
        return (productoId == null ? fallaRecurrenteRepository.findAll()
                : fallaRecurrenteRepository.findByProductoId(productoId))
                .stream().map(FallaRecurrenteResponse::from).toList();
    }

    public List<ChecklistResponse> getChecklists() {
        return checklistRepository.findAll().stream().map(ChecklistResponse::from).toList();
    }

    public List<SedeResponse> getSedes(Long clienteId) {
        return (clienteId == null ? sedeRepository.findAll() : sedeRepository.findByClienteId(clienteId))
                .stream().map(SedeResponse::from).toList();
    }

    public List<EquipoResponse> getEquipos(Long sedeId) {
        return (sedeId == null ? equipoRepository.findAll() : equipoRepository.findBySedeId(sedeId))
                .stream().map(EquipoResponse::from).toList();
    }

    public List<TecnicoResponse> getTecnicos() {
        return tecnicoRepository.findAll().stream().map(TecnicoResponse::from).toList();
    }

    public List<TecnicoResponse> getTecnicosDisponibles() {
        return tecnicoRepository.findByDisponibleTrue().stream().map(TecnicoResponse::from).toList();
    }

    @Transactional
    public void deleteProducto(Long id) {
        productoRepository.deleteById(id);
    }

    @Transactional
    public void deleteTareaMantenimiento(Long id) {
        tareaMantenimientoRepository.deleteById(id);
    }

    @Transactional
    public void deleteFallaRecurrente(Long id) {
        fallaRecurrenteRepository.deleteById(id);
    }

    @Transactional
    public void deleteChecklist(Long id) {
        checklistRepository.deleteById(id);
    }

    @Transactional
    public void deleteCliente(Long id) {
        clienteRepository.deleteById(id);
    }

    @Transactional
    public void deleteSede(Long id) {
        sedeRepository.deleteById(id);
    }

    @Transactional
    public void deleteEquipo(Long id) {
        equipoRepository.deleteById(id);
    }

    @Transactional
    public void deleteTecnico(Long id) {
        tecnicoRepository.deleteById(id);
    }
}
