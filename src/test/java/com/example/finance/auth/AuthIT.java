package com.example.finance.auth;

import com.example.finance.user.*;
import com.fasterxml.jackson.databind.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.test.web.servlet.*;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.*;
import java.time.Instant;
import java.util.*;
import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@Testcontainers
@SpringBootTest
@AutoConfigureMockMvc
class AuthIT {
    @Container @ServiceConnection
    static final PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17-alpine");
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired UserRepository users;
    @Autowired com.example.finance.category.CategoryRepository categories;
    @Autowired PasswordEncoder passwords;
    @Autowired JwtDecoder decoder;
    @Autowired JwtEncoder encoder;
    static final String PASSWORD = "long-password-123";

    @BeforeEach
    void cleanUsers() { categories.deleteAll(); users.deleteAll(); }

    @Test
    void registersUserWithSaltedHashAndNoSensitiveResponseFields() throws Exception {
        var response = register(" ALICE@Example.com ").andExpect(status().isCreated())
                .andExpect(jsonPath("$.email").value("alice@example.com"))
                .andExpect(jsonPath("$.role").value("ROLE_USER"))
                .andExpect(jsonPath("$.password").doesNotExist())
                .andExpect(jsonPath("$.passwordHash").doesNotExist())
                .andReturn().getResponse().getContentAsString();
        assertThat(json.readTree(response).size()).isEqualTo(4);
        var user = users.findByEmail("alice@example.com").orElseThrow();
        assertThat(user.getPasswordHash()).startsWith("{pbkdf2}").isNotEqualTo(PASSWORD);
        assertThat(passwords.matches(PASSWORD, user.getPasswordHash())).isTrue();
        register("bob@example.com").andExpect(status().isCreated());
        assertThat(users.findByEmail("bob@example.com").orElseThrow().getPasswordHash())
                .isNotEqualTo(user.getPasswordHash());
    }

    @Test
    void rejectsCaseInsensitiveDuplicateEmail() throws Exception {
        register("alice@example.com").andExpect(status().isCreated());
        register("ALICE@example.com").andExpect(status().isConflict());
        assertThat(users.count()).isEqualTo(1);
    }

    @Test
    void databaseEnforcesUniqueEmail() throws Exception {
        register("alice@example.com").andExpect(status().isCreated());
        assertThatThrownBy(() -> users.saveAndFlush(new User("alice@example.com", "test-hash", "Other")))
                .isInstanceOf(org.springframework.dao.DataIntegrityViolationException.class);
    }

    @Test
    void loginReturnsExpiringTokenAndCurrentUserUsesItsSubject() throws Exception {
        var registration = json.readTree(register("alice@example.com").andReturn().getResponse().getContentAsString());
        String token = loginToken("ALICE@example.com");
        Jwt jwt = decoder.decode(token);
        assertThat(jwt.getSubject()).isEqualTo(registration.get("id").asText());
        assertThat(jwt.getExpiresAt()).isEqualTo(jwt.getIssuedAt().plusSeconds(900));
        assertThat(jwt.getClaimAsStringList("roles")).containsExactly("ROLE_USER");
        mvc.perform(get("/api/v1/users/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk()).andExpect(jsonPath("$.email").value("alice@example.com"))
                .andExpect(jsonPath("$.passwordHash").doesNotExist());
    }

    @Test
    void invalidPasswordAndUnknownUserHaveSameResponse() throws Exception {
        register("alice@example.com");
        var wrong = login("alice@example.com", "wrong-password").andExpect(status().isUnauthorized())
                .andReturn().getResponse().getContentAsString();
        var unknown = login("unknown@example.com", "wrong-password").andExpect(status().isUnauthorized())
                .andReturn().getResponse().getContentAsString();
        assertThat(json.readTree(wrong).get("detail")).isEqualTo(json.readTree(unknown).get("detail"));
        assertThat(wrong).doesNotContain("accessToken", "passwordHash", "wrong-password");
    }

    @Test
    void rejectsUnauthenticatedAndMalformedBearerRequests() throws Exception {
        mvc.perform(get("/api/v1/users/me")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/v1/users/me").header("Authorization", "Bearer invalid"))
                .andExpect(status().isUnauthorized());
        mvc.perform(get("/api/v1/health")).andExpect(status().isOk());
    }

    @Test
    void rejectsExpiredWrongAudienceAndWrongIssuerTokens() throws Exception {
        register("alice@example.com");
        String subject = users.findByEmail("alice@example.com").orElseThrow().getId().toString();
        for (String token : List.of(signedToken(subject, "finance-api", "finance-api", -120, List.of("ROLE_USER")),
                signedToken(subject, "wrong-issuer", "finance-api", 900, List.of("ROLE_USER")),
                signedToken(subject, "finance-api", "wrong-audience", 900, List.of("ROLE_USER")))) {
            mvc.perform(get("/api/v1/users/me").header("Authorization", "Bearer " + token))
                    .andExpect(status().isUnauthorized());
        }
    }

    @Test
    void rejectsTamperedToken() throws Exception {
        register("alice@example.com");
        String token = loginToken("alice@example.com");
        String[] parts = token.split("\\.");
        byte[] signature = Base64.getUrlDecoder().decode(parts[2]);
        signature[0] ^= 1;
        String tampered = parts[0] + "." + parts[1] + "." + Base64.getUrlEncoder().withoutPadding().encodeToString(signature);
        mvc.perform(get("/api/v1/users/me").header("Authorization", "Bearer " + tampered))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void registrationCannotGrantAdminAndClientUserIdCannotOverridePrincipal() throws Exception {
        mvc.perform(post("/api/v1/auth/register").contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(Map.of("email", "alice@example.com", "password", PASSWORD,
                        "displayName", "Alice", "role", "ROLE_ADMIN"))))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.role").value("ROLE_USER"));
        var bob = json.readTree(register("bob@example.com").andReturn().getResponse().getContentAsString());
        mvc.perform(get("/api/v1/users/me").param("userId", bob.get("id").asText())
                .header("Authorization", "Bearer " + loginToken("alice@example.com")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.email").value("alice@example.com"));
    }

    @Test
    void requiresRecognizedRoleAndAllowsAdminRole() throws Exception {
        register("alice@example.com");
        String id = users.findByEmail("alice@example.com").orElseThrow().getId().toString();
        mvc.perform(get("/api/v1/users/me").header("Authorization", "Bearer " +
                signedToken(id, "finance-api", "finance-api", 900, List.of())))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/users/me").header("Authorization", "Bearer " +
                signedToken(id, "finance-api", "finance-api", 900, List.of("ROLE_ADMIN"))))
                .andExpect(status().isOk());
    }

    @Test
    void validatesRegistrationAndLoginWithoutEchoingPasswords() throws Exception {
        for (var request : List.of(new RegisterRequest("not-email", PASSWORD, "Alice"),
                new RegisterRequest("alice@example.com", "short", "Alice"),
                new RegisterRequest("alice@example.com", PASSWORD, " "),
                new RegisterRequest("alice@example.com", "x".repeat(129), "Alice"))) {
            mvc.perform(post("/api/v1/auth/register").contentType(MediaType.APPLICATION_JSON)
                    .content(json.writeValueAsString(request))).andExpect(status().isBadRequest());
        }
        login("not-email", PASSWORD).andExpect(status().isBadRequest());
        assertThat(users.count()).isZero();
    }

    private ResultActions register(String email) throws Exception {
        return mvc.perform(post("/api/v1/auth/register").contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(Map.of("email", email, "password", PASSWORD, "displayName", "Alice"))));
    }
    private ResultActions login(String email, String password) throws Exception {
        return mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(Map.of("email", email, "password", password))));
    }
    private String loginToken(String email) throws Exception {
        String body = login(email, PASSWORD).andExpect(status().isOk())
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(header().string("Cache-Control", "no-store"))
                .andReturn().getResponse().getContentAsString();
        return json.readTree(body).get("accessToken").asText();
    }
    private String signedToken(String subject, String issuer, String audience, long expiresIn, List<String> roles) {
        var claims = JwtClaimsSet.builder().subject(subject).issuer(issuer).audience(List.of(audience))
                .issuedAt(Instant.now().minusSeconds(300)).expiresAt(Instant.now().plusSeconds(expiresIn))
                .claim("roles", roles).build();
        return encoder.encode(JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(), claims)).getTokenValue();
    }
}
