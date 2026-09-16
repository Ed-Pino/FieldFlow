package com.fieldflow.backend;

import org.junit.jupiter.api.Test;
import org.springframework.test.annotation.DirtiesContext;

import static org.hamcrest.Matchers.not;
import static org.springframework.http.HttpHeaders.AUTHORIZATION;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class AuthApiTest extends AbstractApiTestBase {

    @Test
    void loginValidoDevuelveTokenUsernameYRole() throws Exception {
        mvc.perform(post("/api/auth/login")
                        .contentType(APPLICATION_JSON)
                        .content("{\"username\":\"admin\",\"password\":\"admin123\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("admin"))
                .andExpect(jsonPath("$.role").value("ADMIN"))
                .andExpect(jsonPath("$.token").isNotEmpty());
    }

    @Test
    void credencialesIncorrectasDevuelven401() throws Exception {
        mvc.perform(post("/api/auth/login")
                        .contentType(APPLICATION_JSON)
                        .content("{\"username\":\"admin\",\"password\":\"incorrecta\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void registroCreaUsuarioYPermiteLogin() throws Exception {
        mvc.perform(post("/api/auth/register")
                        .contentType(APPLICATION_JSON)
                        .content("{\"username\":\"testerAuth\",\"password\":\"pass123\",\"role\":\"TECNICO\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.username").value("testerAuth"))
                .andExpect(jsonPath("$.role").value("TECNICO"))
                .andExpect(jsonPath("$.token").isNotEmpty());

        mvc.perform(post("/api/auth/login")
                        .contentType(APPLICATION_JSON)
                        .content("{\"username\":\"testerAuth\",\"password\":\"pass123\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("TECNICO"));
    }

    @Test
    void jwtInvalidoDevuelve401() throws Exception {
        mvc.perform(get("/api/ordenes")
                        .header(AUTHORIZATION, "Bearer token-no-valido"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void jwtExpiradoDevuelve401() throws Exception {
        mvc.perform(get("/api/ordenes")
                        .header(AUTHORIZATION, bearer(expiredAdminToken())))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void sinTokenDevuelve401() throws Exception {
        mvc.perform(get("/api/ordenes"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void tecnicoNoPuedeCrearOrdenTrabajo() throws Exception {
        mvc.perform(post("/api/ordenes")
                        .header(AUTHORIZATION, bearer(tecnicoToken()))
                        .contentType(APPLICATION_JSON)
                        .content("{\"tipoServicio\":\"X\",\"descripcion\":\"X\",\"clienteId\":1," +
                                "\"sedeId\":1,\"equipoId\":1,\"fechaProgramada\":\"2026-12-31\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void tecnicoNoPuedeAccederACatalogos() throws Exception {
        mvc.perform(get("/api/clientes")
                        .header(AUTHORIZATION, bearer(tecnicoToken())))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminPuedeAccederACatalogos() throws Exception {
        mvc.perform(get("/api/clientes")
                        .header(AUTHORIZATION, bearer(adminToken())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", not(org.hamcrest.Matchers.empty())));
    }

    @Test
    void adminPuedeCrearOrdenTrabajo() throws Exception {
        mvc.perform(post("/api/ordenes")
                        .header(AUTHORIZATION, bearer(adminToken()))
                        .contentType(APPLICATION_JSON)
                        .content("{\"tipoServicio\":\"Reparacion\",\"descripcion\":\"Test\",\"clienteId\":1," +
                                "\"sedeId\":1,\"equipoId\":1,\"fechaProgramada\":\"2026-12-31\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.estado").value("pendiente"));
    }

    @Test
    void tokenConClaimRoleTECNICOObtieneAutoridadCorrespondiente() throws Exception {
        String adminJson = mvc.perform(post("/api/auth/login")
                        .contentType(APPLICATION_JSON)
                        .content("{\"username\":\"tecnico1\",\"password\":\"tecnico123\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("TECNICO"))
                .andReturn().getResponse().getContentAsString();

        String token = om.readTree(adminJson).get("token").asText();
        // TECNICO puede leer órdenes pero no crear
        mvc.perform(get("/api/ordenes").header(AUTHORIZATION, bearer(token)))
                .andExpect(status().isOk());
        mvc.perform(post("/api/ordenes")
                        .header(AUTHORIZATION, bearer(token))
                        .contentType(APPLICATION_JSON)
                        .content("{\"tipoServicio\":\"X\",\"descripcion\":\"X\",\"clienteId\":1," +
                                "\"sedeId\":1,\"equipoId\":1,\"fechaProgramada\":\"2026-12-31\"}"))
                .andExpect(status().isForbidden());
    }
}