package com.fieldflow.backend.service;

import com.fieldflow.backend.dto.ClienteResponse;
import com.fieldflow.backend.dto.EquipoResponse;
import com.fieldflow.backend.dto.SedeResponse;
import com.fieldflow.backend.dto.TecnicoResponse;
import com.fieldflow.backend.repository.ClienteRepository;
import com.fieldflow.backend.repository.EquipoRepository;
import com.fieldflow.backend.repository.SedeRepository;
import com.fieldflow.backend.repository.TecnicoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class CatalogoService {

    private final ClienteRepository clienteRepository;
    private final SedeRepository sedeRepository;
    private final EquipoRepository equipoRepository;
    private final TecnicoRepository tecnicoRepository;

    public CatalogoService(ClienteRepository clienteRepository, SedeRepository sedeRepository,
                           EquipoRepository equipoRepository, TecnicoRepository tecnicoRepository) {
        this.clienteRepository = clienteRepository;
        this.sedeRepository = sedeRepository;
        this.equipoRepository = equipoRepository;
        this.tecnicoRepository = tecnicoRepository;
    }

    public List<ClienteResponse> getClientes() {
        return clienteRepository.findAll().stream().map(ClienteResponse::from).toList();
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