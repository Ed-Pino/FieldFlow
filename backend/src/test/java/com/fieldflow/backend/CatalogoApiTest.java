package com.fieldflow.backend;

import com.fieldflow.backend.entity.Cliente;
import com.fieldflow.backend.entity.Equipo;
import com.fieldflow.backend.entity.Sede;
import com.fieldflow.backend.entity.Tecnico;
import com.fieldflow.backend.repository.ClienteRepository;
import com.fieldflow.backend.repository.EquipoRepository;
import com.fieldflow.backend.repository.SedeRepository;
import com.fieldflow.backend.repository.TecnicoRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.annotation.DirtiesContext;

import java.util.List;
import java.util.Map;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.not;
import static org.springframework.http.HttpHeaders.AUTHORIZATION;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class CatalogoApiTest extends AbstractApiTestBase {

    @Autowired
    private ClienteRepository clienteRepository;

    @Autowired
    private SedeRepository sedeRepository;

    @Autowired
    private EquipoRepository equipoRepository;

    @Autowired
    private TecnicoRepository tecnicoRepository;

    @Test
    void sedesFiltradasPorClienteSoloDevuelvenSedesDeEseCliente() throws Exception {
        Cliente c1 = clienteRepository.findAll().stream()
                .filter(c -> c.getNombre().equals("GasSolutions S.A.S"))
                .findFirst().orElseThrow();

        mvc.perform(get("/api/sedes?clienteId=" + c1.getId())
                        .header(AUTHORIZATION, bearer(adminToken())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].nombre").value("Planta Principal"))
                .andExpect(jsonPath("$[0].clienteId").value(c1.getId()));
    }

    @Test
    void equiposFiltradosPorSedeSoloDevuelvenEquiposDeEsaSede() throws Exception {
        Sede s1 = sedeRepository.findAll().stream()
                .filter(s -> s.getNombre().equals("Planta Principal"))
                .findFirst().orElseThrow();

        List<Equipo> equipos = equipoRepository.findBySedeId(s1.getId());

        mvc.perform(get("/api/equipos?sedeId=" + s1.getId())
                        .header(AUTHORIZATION, bearer(adminToken())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(equipos.size())))
                .andExpect(jsonPath("$[0].sedeId").value(s1.getId()));
    }

    @Test
    void tecnicosDisponiblesSoloDevuelveTecnicosDisponibles() throws Exception {
        mvc.perform(get("/api/tecnicos/disponibles")
                        .header(AUTHORIZATION, bearer(adminToken())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)));

        Tecnico carlos = tecnicoRepository.findAll().stream()
                .filter(t -> t.getNombre().equals("Carlos - Mantenimiento"))
                .findFirst().orElseThrow();
        carlos.setDisponible(false);
        tecnicoRepository.save(carlos);

        mvc.perform(get("/api/tecnicos/disponibles")
                        .header(AUTHORIZATION, bearer(adminToken())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].nombre").value("Eduin - Senior Gas"))
                .andExpect(jsonPath("$[0].disponible").value(true));
    }

    @Test
    void tecnicosSinFiltroDevuelveTodos() throws Exception {
        mvc.perform(get("/api/tecnicos")
                        .header(AUTHORIZATION, bearer(adminToken())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", not(org.hamcrest.Matchers.empty())))
                .andExpect(jsonPath("$[?(@.nombre == 'Carlos - Mantenimiento')]").exists());
    }

    @Test
    void catalogosEpica1DevuelvenDatosSembrados() throws Exception {
        mvc.perform(get("/api/productos")
                        .header(AUTHORIZATION, bearer(adminToken())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(3)))
                .andExpect(jsonPath("$[0].codigo").value("PRD-CAL"))
                .andExpect(jsonPath("$[0].categoria").value("Caldera"));

        mvc.perform(get("/api/tareas-mantenimiento")
                        .header(AUTHORIZATION, bearer(adminToken())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(3)))
                .andExpect(jsonPath("$[0].frecuenciaMeses").value(3));

        mvc.perform(get("/api/fallas-recurrentes")
                        .header(AUTHORIZATION, bearer(adminToken())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(3)))
                .andExpect(jsonPath("$[0].contadorCasos").value(6));

        mvc.perform(get("/api/checklists")
                        .header(AUTHORIZATION, bearer(adminToken())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].codigo").value("CHK-CAL-01"))
                .andExpect(jsonPath("$[0].items", hasSize(3)));
    }

    @Test
    void altaClienteCreaClienteYloDevuelveEn201() throws Exception {
        String nit = "9012345678";

        String resp = mvc.perform(post("/api/clientes")
                        .header(AUTHORIZATION, bearer(adminToken()))
                        .contentType(APPLICATION_JSON)
                        .content(om.writeValueAsString(Map.of("nombre", "Distribuidora Andina S.A.S", "nit", nit))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.nombre").value("Distribuidora Andina S.A.S"))
                .andExpect(jsonPath("$.nit").value(nit))
                .andReturn().getResponse().getContentAsString();

        Long idNuevo = om.readTree(resp).get("id").asLong();

        mvc.perform(get("/api/clientes")
                        .header(AUTHORIZATION, bearer(adminToken())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id == " + idNuevo + ")]").exists());

        mvc.perform(get("/api/clientes")
                        .header(AUTHORIZATION, bearer(adminToken())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.nit == '" + nit + "')]").exists());
    }

    @Test
    void altaClienteConNitDuplicadoDevuelve409() throws Exception {
        String nitDuplicado = clienteRepository.findAll().get(0).getNit();

        mvc.perform(post("/api/clientes")
                        .header(AUTHORIZATION, bearer(adminToken()))
                        .contentType(APPLICATION_JSON)
                        .content(om.writeValueAsString(Map.of("nombre", "Cliente Duplicado", "nit", nitDuplicado))))
                .andExpect(status().isConflict());
    }
}