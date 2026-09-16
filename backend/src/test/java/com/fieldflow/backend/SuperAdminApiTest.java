package com.fieldflow.backend;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;
import org.springframework.test.annotation.DirtiesContext;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.not;
import static org.springframework.http.HttpHeaders.AUTHORIZATION;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class SuperAdminApiTest extends AbstractApiTestBase {

    private String superAdminToken() throws Exception {
        return login("superadmin", "super123");
    }

    @Test
    void superAdminPuedeListarUsuarios() throws Exception {
        mvc.perform(get("/api/usuarios")
                        .header(AUTHORIZATION, bearer(superAdminToken())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(4)));
    }

    @Test
    void adminNoPuedeListarUsuarios() throws Exception {
        mvc.perform(get("/api/usuarios")
                        .header(AUTHORIZATION, bearer(adminToken())))
                .andExpect(status().isForbidden());
    }

    @Test
    void tecnicoNoPuedeListarUsuarios() throws Exception {
        mvc.perform(get("/api/usuarios")
                        .header(AUTHORIZATION, bearer(tecnicoToken())))
                .andExpect(status().isForbidden());
    }

    @Test
    void superAdminPuedeEliminarTecnicoDeCatalogo() throws Exception {
        String json = mvc.perform(get("/api/tecnicos")
                        .header(AUTHORIZATION, bearer(superAdminToken())))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode nodes = om.readTree(json);
        long id = -1;
        for (JsonNode n : nodes) {
            if ("Carlos - Mantenimiento".equals(n.get("nombre").asText())) {
                id = n.get("id").asLong();
                break;
            }
        }
        org.junit.jupiter.api.Assertions.assertTrue(id > 0, "tecnico semilla no encontrado");

        mvc.perform(delete("/api/tecnicos/" + id)
                        .header(AUTHORIZATION, bearer(superAdminToken())))
                .andExpect(status().isOk());

        mvc.perform(get("/api/tecnicos")
                        .header(AUTHORIZATION, bearer(superAdminToken())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].nombre",
                        not(org.hamcrest.Matchers.hasItem("Carlos - Mantenimiento"))));
    }

    @Test
    void adminNoPuedeEliminarRegistrosDeCatalogo() throws Exception {
        mvc.perform(delete("/api/tecnicos/999")
                        .header(AUTHORIZATION, bearer(adminToken())))
                .andExpect(status().isForbidden());
    }

    @Test
    void registroRechazaRolSuperAdmin() throws Exception {
        mvc.perform(post("/api/auth/register")
                        .contentType(APPLICATION_JSON)
                        .content("{\"username\":\"hacker\",\"password\":\"x12345678\",\"role\":\"SUPER_ADMIN\"}"))
                .andExpect(status().isBadRequest());
    }
}