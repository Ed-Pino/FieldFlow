package com.fieldflow.backend;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;

import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("demo")
public abstract class AbstractApiTestBase {

    @Autowired
    protected MockMvc mvc;

    protected final ObjectMapper om = new ObjectMapper();

    @Autowired
    protected JwtEncoder jwtEncoder;

    protected String login(String username, String password) throws Exception {
        String body = om.writeValueAsString(Map.of("username", username, "password", password));
        String json = mvc.perform(post("/api/auth/login")
                        .contentType(APPLICATION_JSON)
                        .content(body))
                .andReturn()
                .getResponse()
                .getContentAsString();
        return om.readTree(json).get("token").asText();
    }

    protected String adminToken() throws Exception {
        return login("admin", "admin123");
    }

    protected String tecnicoToken() throws Exception {
        return login("tecnico1", "tecnico123");
    }

    protected String expiredAdminToken() {
        Instant past = Instant.now().minus(2, ChronoUnit.HOURS);
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("fieldflow")
                .subject("admin")
                .issuedAt(past)
                .expiresAt(past.plus(1, ChronoUnit.HOURS))
                .claim("role", "ADMIN")
                .build();
        return jwtEncoder.encode(JwtEncoderParameters.from(
                JwsHeader.with(MacAlgorithm.HS256).build(), claims)).getTokenValue();
    }

    protected String bearer(String token) {
        return "Bearer " + token;
    }
}