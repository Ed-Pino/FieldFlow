package com.fieldflow.backend;

import com.fieldflow.backend.entity.Cliente;
import com.fieldflow.backend.entity.Equipo;
import com.fieldflow.backend.entity.Sede;
import com.fieldflow.backend.entity.Tecnico;
import com.fieldflow.backend.repository.ClienteRepository;
import com.fieldflow.backend.repository.EquipoRepository;
import com.fieldflow.backend.repository.SedeRepository;
import com.fieldflow.backend.repository.TecnicoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.annotation.DirtiesContext;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.matchesPattern;
import static org.springframework.http.HttpHeaders.AUTHORIZATION;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class OrdenApiTest extends AbstractApiTestBase {

    @Autowired
    private ClienteRepository clienteRepository;

    @Autowired
    private SedeRepository sedeRepository;

    @Autowired
    private EquipoRepository equipoRepository;

    @Autowired
    private TecnicoRepository tecnicoRepository;

    private Long clienteId;
    private Long sedeId;
    private Long equipoId;
    private Long tecnicoId;
    private String admin;
    private String tecnico;

    @BeforeEach
    void setupIds() throws Exception {
        Cliente c = clienteRepository.findAll().stream()
                .filter(x -> x.getNombre().equals("GasSolutions S.A.S")).findFirst().orElseThrow();
        Sede s = sedeRepository.findAll().stream()
                .filter(x -> x.getNombre().equals("Planta Principal")).findFirst().orElseThrow();
        Equipo e = equipoRepository.findAll().stream()
                .filter(x -> x.getCodigo().equals("CAL-001")).findFirst().orElseThrow();
        Tecnico t = tecnicoRepository.findAll().stream()
                .filter(x -> x.getNombre().equals("Eduin - Senior Gas")).findFirst().orElseThrow();
        clienteId = c.getId();
        sedeId = s.getId();
        equipoId = e.getId();
        tecnicoId = t.getId();
        admin = bearer(adminToken());
        tecnico = bearer(tecnicoToken());
    }

    private String createOtBaseJson() {
        return "{\"tipoServicio\":\"Reparacion de valvula\",\"descripcion\":\"Test integracion\","
                + "\"clienteId\":" + clienteId + ",\"sedeId\":" + sedeId + ",\"equipoId\":" + equipoId
                + ",\"tecnicoId\":" + tecnicoId + ",\"fechaProgramada\":\"2026-12-31\","
                + "\"checklist\":[{\"texto\":\"Verificar presion\",\"hecho\":false}]}";
    }

    private int createOt(String auth) throws Exception {
        String json = mvc.perform(post("/api/ordenes")
                        .header(AUTHORIZATION, auth)
                        .contentType(APPLICATION_JSON)
                        .content(createOtBaseJson()))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return om.readTree(json).get("id").asInt();
    }

    @Test
    void crearOTGeneraEstadoPendienteCodigoEHistorial() throws Exception {
        mvc.perform(post("/api/ordenes")
                        .header(AUTHORIZATION, admin)
                        .contentType(APPLICATION_JSON)
                        .content(createOtBaseJson()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.codigo").value(matchesPattern("OT-10\\d+")))
                .andExpect(jsonPath("$.estado").value("pendiente"))
                .andExpect(jsonPath("$.prioridad").value("media"))
                .andExpect(jsonPath("$.fechaProgramada").value("2026-12-31"))
                .andExpect(jsonPath("$.cliente").value("GasSolutions S.A.S"))
                .andExpect(jsonPath("$.checklist", hasSize(1)))
                .andExpect(jsonPath("$.historial[0]", containsString("creada")));
    }

    @Test
    void crearOTSoportaPrioridadYDuracionEstimada() throws Exception {
        String body = createOtBaseJson().replace(",\"checklist\"", ",\"prioridad\":\"urgente\"," +
                "\"duracionEstimadaMin\":90,\"checklist\"");
        mvc.perform(post("/api/ordenes")
                        .header(AUTHORIZATION, admin)
                        .contentType(APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.prioridad").value("urgente"))
                .andExpect(jsonPath("$.duracionEstimadaMin").value(90));
    }

    @Test
    void crearOTConEntidadInexistenteDevuelve404() throws Exception {
        String body = "{\"tipoServicio\":\"X\",\"descripcion\":\"X\",\"clienteId\":99999," +
                "\"sedeId\":1,\"equipoId\":1,\"fechaProgramada\":\"2026-12-31\"}";
        mvc.perform(post("/api/ordenes")
                        .header(AUTHORIZATION, admin)
                        .contentType(APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isNotFound());
    }

    @Test
    void flujoPrincipalDeTransicionesCompleto() throws Exception {
        int id = createOt(admin);
        String[] secuencia = {"asignada", "enCamino", "enEjecucion", "pendienteConformidad", "finalizada"};
        for (String estado : secuencia) {
            mvc.perform(put("/api/ordenes/" + id + "/estado")
                            .header(AUTHORIZATION, tecnico)
                            .contentType(APPLICATION_JSON)
                            .content("{\"estado\":\"" + estado + "\"}"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.estado").value(estado));
        }
    }

    @Test
    void transicionNoPermitidaDevuelve400() throws Exception {
        int id = createOt(admin);
        mvc.perform(put("/api/ordenes/" + id + "/estado")
                        .header(AUTHORIZATION, tecnico)
                        .contentType(APPLICATION_JSON)
                        .content("{\"estado\":\"enEjecucion\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void reprogramadaValidaDesdeAsignadaYPuedeVolverAPendiente() throws Exception {
        int id = createOt(admin);

        mvc.perform(put("/api/ordenes/" + id + "/estado")
                        .header(AUTHORIZATION, tecnico)
                        .contentType(APPLICATION_JSON)
                        .content("{\"estado\":\"asignada\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estado").value("asignada"));

        mvc.perform(put("/api/ordenes/" + id + "/estado")
                        .header(AUTHORIZATION, tecnico)
                        .contentType(APPLICATION_JSON)
                        .content("{\"estado\":\"reprogramada\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estado").value("reprogramada"));

        mvc.perform(put("/api/ordenes/" + id + "/estado")
                        .header(AUTHORIZATION, tecnico)
                        .contentType(APPLICATION_JSON)
                        .content("{\"estado\":\"pendiente\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estado").value("pendiente"));
    }

    @Test
    void reprogramadaValidaDesdeLosCuatroEstados() throws Exception {
        String[] estados = {"asignada", "enCamino", "enEjecucion", "pendienteConformidad"};
        for (String origen : estados) {
            int id = createOt(admin);
            for (String paso : estados) {
                mvc.perform(put("/api/ordenes/" + id + "/estado")
                                .header(AUTHORIZATION, tecnico)
                                .contentType(APPLICATION_JSON)
                                .content("{\"estado\":\"" + paso + "\"}"))
                        .andExpect(status().isOk());
                if (paso.equals(origen)) {
                    break;
                }
            }
            mvc.perform(put("/api/ordenes/" + id + "/estado")
                            .header(AUTHORIZATION, tecnico)
                            .contentType(APPLICATION_JSON)
                            .content("{\"estado\":\"reprogramada\"}"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.estado").value("reprogramada"));
        }
    }

    @Test
    void reprogramadaInvalidDesdePendienteDevuelve400() throws Exception {
        int id = createOt(admin);
        mvc.perform(put("/api/ordenes/" + id + "/estado")
                        .header(AUTHORIZATION, tecnico)
                        .contentType(APPLICATION_JSON)
                        .content("{\"estado\":\"reprogramada\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void OTFinalizadaEsTerminal() throws Exception {
        int id = createOt(admin);
        String[] secuencia = {"asignada", "enCamino", "enEjecucion", "pendienteConformidad", "finalizada"};
        for (String estado : secuencia) {
            mvc.perform(put("/api/ordenes/" + id + "/estado")
                            .header(AUTHORIZATION, tecnico)
                            .contentType(APPLICATION_JSON)
                            .content("{\"estado\":\"" + estado + "\"}"))
                    .andExpect(status().isOk());
        }
        mvc.perform(put("/api/ordenes/" + id + "/estado")
                        .header(AUTHORIZATION, tecnico)
                        .contentType(APPLICATION_JSON)
                        .content("{\"estado\":\"enCamino\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void cambioDeEstadoRegistraEventoEnHistorial() throws Exception {
        int id = createOt(admin);
        mvc.perform(put("/api/ordenes/" + id + "/estado")
                        .header(AUTHORIZATION, tecnico)
                        .contentType(APPLICATION_JSON)
                        .content("{\"estado\":\"asignada\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.historial[-1]", containsString("asignada")));
    }

    @Test
    void evidenciaRegistraNotasChecklistYFotos() throws Exception {
        int id = createOt(admin);
        mvc.perform(put("/api/ordenes/" + id + "/evidencia")
                        .header(AUTHORIZATION, tecnico)
                        .contentType(APPLICATION_JSON)
                        .content("{\"notas\":\"Reemplazo de valvula\",\"hecho\":true," +
                                "\"checklist\":[{\"texto\":\"Verificar presion\",\"hecho\":true}]," +
                                "\"fotos\":[\"https://s3.example.com/f1.jpg\"]}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.notas").value("Reemplazo de valvula"))
                .andExpect(jsonPath("$.checklist[0].texto").value("Verificar presion"))
                .andExpect(jsonPath("$.checklist[0].hecho").value(true))
                .andExpect(jsonPath("$.fotos[0]").value("https://s3.example.com/f1.jpg"))
                .andExpect(jsonPath("$.historial[-1]", containsString("Evidencia registrada")));
    }

    @Test
    void conformidadRechazadaSiEstadoNoEsPendienteDeConformidad() throws Exception {
        int id = createOt(admin);
        mvc.perform(post("/api/ordenes/" + id + "/conformidad")
                        .header(AUTHORIZATION, tecnico)
                        .contentType(APPLICATION_JSON)
                        .content("{\"notas\":\"ok\",\"firma\":\"data:image/png;base64,AAA\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void conformidadValidaFinalizaYRegistraEvento() throws Exception {        int id = createOt(admin);
        String[] secuencia = {"asignada", "enCamino", "enEjecucion", "pendienteConformidad"};
        for (String estado : secuencia) {
            mvc.perform(put("/api/ordenes/" + id + "/estado")
                            .header(AUTHORIZATION, tecnico)
                            .contentType(APPLICATION_JSON)
                            .content("{\"estado\":\"" + estado + "\"}"))
                    .andExpect(status().isOk());
        }

        mvc.perform(post("/api/ordenes/" + id + "/conformidad")
                        .header(AUTHORIZATION, tecnico)
                        .contentType(APPLICATION_JSON)
                        .content("{\"notas\":\"Trabajo finalizado\",\"firma\":\"data:image/png;base64,AAA\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estado").value("finalizada"))
                .andExpect(jsonPath("$.notas").value("Trabajo finalizado"))
                .andExpect(jsonPath("$.firmaBase64").value("data:image/png;base64,AAA"))
                .andExpect(jsonPath("$.historial[-1]", containsString("Finalizada con conformidad")));
    }

    @Test
    void asignarTecnicoActualizaTecnicoYRegistraEvento() throws Exception {
        int id = createOt(admin);
        Tecnico carlos = tecnicoRepository.findAll().stream()
                .filter(x -> x.getNombre().equals("Carlos - Mantenimiento")).findFirst().orElseThrow();

        mvc.perform(put("/api/ordenes/" + id + "/tecnico")
                        .header(AUTHORIZATION, admin)
                        .contentType(APPLICATION_JSON)
                        .content("{\"tecnicoId\":" + carlos.getId() + "}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tecnico").value("Carlos - Mantenimiento"))
                .andExpect(jsonPath("$.historial[-1]", containsString("Tecnico asignado: Carlos - Mantenimiento")));
    }

    @Test
    void asignarTecnicoConTecnicoInexistenteDevuelve404() throws Exception {
        int id = createOt(admin);
        mvc.perform(put("/api/ordenes/" + id + "/tecnico")
                        .header(AUTHORIZATION, admin)
                        .contentType(APPLICATION_JSON)
                        .content("{\"tecnicoId\":999999}"))
                .andExpect(status().isNotFound());
    }

    @Test
    void asignarTecnicoEnOTInexistenteDevuelve404() throws Exception {
        mvc.perform(put("/api/ordenes/999999/tecnico")
                        .header(AUTHORIZATION, admin)
                        .contentType(APPLICATION_JSON)
                        .content("{\"tecnicoId\":" + tecnicoId + "}"))
                .andExpect(status().isNotFound());
    }

    @Test
    void tecnicoNoPuedeAsignarTecnico() throws Exception {
        int id = createOt(admin);
        mvc.perform(put("/api/ordenes/" + id + "/tecnico")
                        .header(AUTHORIZATION, tecnico)
                        .contentType(APPLICATION_JSON)
                        .content("{\"tecnicoId\":" + tecnicoId + "}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void evidenciaConMedicionYFotoLargaPersiste() throws Exception {        int id = createOt(admin);
        String fotoLarga = "data:image/jpeg;base64," + "A".repeat(5000);
        mvc.perform(put("/api/ordenes/" + id + "/evidencia")
                        .header(AUTHORIZATION, tecnico)
                        .contentType(APPLICATION_JSON)
                        .content("{\"checklist\":[{\"texto\":\"Medir presion\",\"hecho\":true,\"tipo\":\"NUMERICO\",\"unidad\":\"psi\",\"valor\":\"3.2\"}],"
                                + "\"fotos\":[\"" + fotoLarga + "\"]}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.checklist[0].valor").value("3.2"))
                .andExpect(jsonPath("$.checklist[0].unidad").value("psi"))
                .andExpect(jsonPath("$.fotos[0]").value(fotoLarga));
    }

    @Test
    void agendarCambiaFechaProgramadaYRegistraEvento() throws Exception {
        int id = createOt(admin);
        mvc.perform(put("/api/ordenes/" + id + "/agenda")
                        .header(AUTHORIZATION, admin)
                        .contentType(APPLICATION_JSON)
                        .content("{\"fechaProgramada\":\"2027-01-15\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fechaProgramada").value("2027-01-15"))
                .andExpect(jsonPath("$.historial[-1]", containsString("Reprogramada para 2027-01-15")));
    }

    @Test
    void agendarConFechaPasadaDevuelve400() throws Exception {
        int id = createOt(admin);
        mvc.perform(put("/api/ordenes/" + id + "/agenda")
                        .header(AUTHORIZATION, admin)
                        .contentType(APPLICATION_JSON)
                        .content("{\"fechaProgramada\":\"2020-01-01\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void agendarEnOTInexistenteDevuelve404() throws Exception {
        mvc.perform(put("/api/ordenes/999999/agenda")
                        .header(AUTHORIZATION, admin)
                        .contentType(APPLICATION_JSON)
                        .content("{\"fechaProgramada\":\"2027-01-15\"}"))
                .andExpect(status().isNotFound());
    }

    @Test
    void tecnicoNoPuedeAgendar() throws Exception {
        int id = createOt(admin);
        mvc.perform(put("/api/ordenes/" + id + "/agenda")
                        .header(AUTHORIZATION, tecnico)
                        .contentType(APPLICATION_JSON)
                        .content("{\"fechaProgramada\":\"2027-01-15\"}"))
                .andExpect(status().isForbidden());
    }
    @Test
    void ordenResponseIncluyeEquipoId() throws Exception {
        int id = createOt(admin);
        mvc.perform(get("/api/ordenes/" + id)
                        .header(AUTHORIZATION, admin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.equipoId").value(equipoId.intValue()));
    }

    @Test
    void superAdminPuedeCrearAsignarYAgendarOT() throws Exception {
        String superAdmin = bearer(login("superadmin", "super123"));

        String json = mvc.perform(post("/api/ordenes")
                        .header(AUTHORIZATION, superAdmin)
                        .contentType(APPLICATION_JSON)
                        .content(createOtBaseJson()))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        int id = om.readTree(json).get("id").asInt();

        mvc.perform(put("/api/ordenes/" + id + "/tecnico")
                        .header(AUTHORIZATION, superAdmin)
                        .contentType(APPLICATION_JSON)
                        .content("{\"tecnicoId\":" + tecnicoId + "}"))
                .andExpect(status().isOk());

        mvc.perform(put("/api/ordenes/" + id + "/agenda")
                        .header(AUTHORIZATION, superAdmin)
                        .contentType(APPLICATION_JSON)
                        .content("{\"fechaProgramada\":\"2027-03-01\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fechaProgramada").value("2027-03-01"));
    }
}