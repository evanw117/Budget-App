package com.example.finance.account;

import com.example.finance.auth.TokenService;
import com.example.finance.category.*;
import com.example.finance.user.*;
import com.fasterxml.jackson.databind.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.*;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.*;
import java.util.*;
import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@Testcontainers
@SpringBootTest
@AutoConfigureMockMvc
class FinancialStructureIT {
    @Container @ServiceConnection
    static final PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17-alpine");
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired UserRepository users;
    @Autowired AccountRepository accounts;
    @Autowired CategoryRepository categories;
    @Autowired TokenService tokens;
    User alice, bob;
    String aliceToken, bobToken;
    @BeforeEach void setup() throws Exception {
        accounts.deleteAll(); categories.deleteAll(); users.deleteAll();
        alice = register("alice@example.com"); bob = register("bob@example.com");
        aliceToken = tokens.issue(alice).accessToken(); bobToken = tokens.issue(bob).accessToken();
    }
    @Test void createsListsAndRetrievesOnlyOwnedAccountsWithExactMoney() throws Exception {
        String id = createAccount(aliceToken, "Checking", "EUR", "123.4567");
        createAccount(bobToken, "Checking", "GBP", "-25.5001");
        perform(get("/api/v1/accounts"), aliceToken).andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1)).andExpect(jsonPath("$[0].currency").value("EUR"));
        perform(get("/api/v1/accounts/" + id), aliceToken).andExpect(status().isOk())
                .andExpect(jsonPath("$.openingBalance").value("123.4567"))
                .andExpect(jsonPath("$.user").doesNotExist()).andExpect(jsonPath("$.userId").doesNotExist());
    }
    @Test void foreignAccountReadPatchAndDeleteAreNotFound() throws Exception {
        String id = createAccount(aliceToken, "Private", "USD", "10");
        perform(get("/api/v1/accounts/" + id), bobToken).andExpect(status().isNotFound());
        perform(patch("/api/v1/accounts/" + id).contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"Stolen\"}"), bobToken).andExpect(status().isNotFound());
        perform(delete("/api/v1/accounts/" + id), bobToken).andExpect(status().isNotFound());
        perform(get("/api/v1/accounts/" + id), aliceToken).andExpect(jsonPath("$.name").value("Private"));
    }
    @Test void clientCannotAssignAnAccountToAnotherUser() throws Exception {
        var payload = Map.of("name", "Owned", "accountType", "CASH", "currency", "USD", "openingBalance", "5", "userId", bob.getId());
        perform(post("/api/v1/accounts").contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(payload)), aliceToken).andExpect(status().isCreated());
        perform(get("/api/v1/accounts"), bobToken).andExpect(jsonPath("$.length()").value(0));
        perform(get("/api/v1/accounts"), aliceToken).andExpect(jsonPath("$.length()").value(1));
    }
    @Test void partialUpdateArchiveAndReactivatePreserveRecord() throws Exception {
        String id = createAccount(aliceToken, "Cash", "USD", "10.1250");
        perform(patch("/api/v1/accounts/" + id).contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"Wallet\"}"), aliceToken)
                .andExpect(status().isOk()).andExpect(jsonPath("$.openingBalance").value("10.1250"))
                .andExpect(jsonPath("$.currency").value("USD"));
        perform(delete("/api/v1/accounts/" + id), aliceToken).andExpect(status().isNoContent());
        perform(delete("/api/v1/accounts/" + id), aliceToken).andExpect(status().isNoContent());
        perform(get("/api/v1/accounts/" + id), aliceToken).andExpect(jsonPath("$.active").value(false));
        perform(patch("/api/v1/accounts/" + id).contentType(MediaType.APPLICATION_JSON).content("{\"active\":true,\"openingBalance\":\"-5.1234\"}"), aliceToken)
                .andExpect(status().isOk()).andExpect(jsonPath("$.active").value(true));
        assertThat(accounts.count()).isEqualTo(1);
    }
    @Test void invalidAccountsAndNullPatchesAreRejected() throws Exception {
        for (String invalid : List.of("{}", "{\"name\":\" \"}",
                "{\"name\":\"A\",\"accountType\":\"NOPE\",\"currency\":\"USD\",\"openingBalance\":0}",
                "{\"name\":\"A\",\"accountType\":\"CASH\",\"currency\":\"US\",\"openingBalance\":0}",
                "{\"name\":\"A\",\"accountType\":\"CASH\",\"currency\":\"USD\",\"openingBalance\":\"0.00001\"}",
                "{\"name\":\"A\",\"accountType\":\"CASH\",\"currency\":\"USD\",\"openingBalance\":\"1000000000000000\"}")) {
            perform(post("/api/v1/accounts").contentType(MediaType.APPLICATION_JSON).content(invalid), aliceToken).andExpect(status().isBadRequest());
        }
        String id = createAccount(aliceToken, "Cash", "USD", "0");
        for (String invalid : List.of("{\"name\":null}", "{\"active\":null}", "{\"name\":\" \"}", "{\"openingBalance\":null}")) {
            perform(patch("/api/v1/accounts/" + id).contentType(MediaType.APPLICATION_JSON).content(invalid), aliceToken).andExpect(status().isBadRequest());
        }
        perform(get("/api/v1/accounts/not-a-uuid"), aliceToken).andExpect(status().isBadRequest());
    }
    @Test void registrationSeedsPrivateDefaultsIncludingRelocation() throws Exception {
        var own = categories.findAllByUserIdOrderByTypeAscNameAscIdAsc(alice.getId());
        var other = categories.findAllByUserIdOrderByTypeAscNameAscIdAsc(bob.getId());
        assertThat(own).hasSize(16).allMatch(Category::isDefaultCategory);
        assertThat(own).anyMatch(c -> c.getName().equals("Moving / Relocation"));
        assertThat(own.stream().map(Category::getId)).doesNotContainAnyElementsOf(other.stream().map(Category::getId).toList());
        perform(get("/api/v1/categories"), aliceToken).andExpect(jsonPath("$.length()").value(16));
    }
    @Test void customCategoriesAreUniquePerOwnerAndTypeIncludingArchived() throws Exception {
        String id = createCategory(aliceToken, "Pets", "EXPENSE");
        createCategory(bobToken, "Pets", "EXPENSE");
        createCategory(aliceToken, "Pets", "INCOME");
        perform(post("/api/v1/categories").contentType(MediaType.APPLICATION_JSON).content("{\"name\":\" PETS \",\"type\":\"EXPENSE\"}"), aliceToken).andExpect(status().isConflict());
        perform(delete("/api/v1/categories/" + id), aliceToken).andExpect(status().isNoContent());
        perform(post("/api/v1/categories").contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"pets\",\"type\":\"EXPENSE\"}"), aliceToken).andExpect(status().isConflict());
        perform(patch("/api/v1/categories/" + id).contentType(MediaType.APPLICATION_JSON).content("{\"active\":true}"), aliceToken).andExpect(status().isOk());
    }
    @Test void foreignCategoriesCannotBeReadUpdatedOrArchived() throws Exception {
        String id = categories.findAllByUserIdOrderByTypeAscNameAscIdAsc(alice.getId()).getFirst().getId().toString();
        perform(get("/api/v1/categories/" + id), bobToken).andExpect(status().isNotFound());
        perform(patch("/api/v1/categories/" + id).contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"Other name\"}"), bobToken).andExpect(status().isNotFound());
        perform(delete("/api/v1/categories/" + id), bobToken).andExpect(status().isNotFound());
    }
    @Test void categoryInvalidAndConflictingUpdatesFailWithoutChangingStoredData() throws Exception {
        String id = createCategory(aliceToken, "Pets", "EXPENSE");
        for (String invalid : List.of("{}", "{\"name\":\" \",\"type\":\"EXPENSE\"}", "{\"name\":\"A\",\"type\":\"OTHER\"}")) {
            perform(post("/api/v1/categories").contentType(MediaType.APPLICATION_JSON).content(invalid), aliceToken).andExpect(status().isBadRequest());
        }
        perform(patch("/api/v1/categories/" + id).contentType(MediaType.APPLICATION_JSON).content("{\"name\":null}"), aliceToken).andExpect(status().isBadRequest());
        perform(patch("/api/v1/categories/" + id).contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"housing\"}"), aliceToken).andExpect(status().isConflict());
        perform(get("/api/v1/categories/" + id), aliceToken).andExpect(jsonPath("$.name").value("Pets"));
    }
    @Test void anonymousRequestsFailForAllFinancialEndpoints() throws Exception {
        for (String resource : List.of("accounts", "categories")) {
            mvc.perform(get("/api/v1/" + resource)).andExpect(status().isUnauthorized());
            mvc.perform(post("/api/v1/" + resource).contentType(MediaType.APPLICATION_JSON).content("{}" )).andExpect(status().isUnauthorized());
            mvc.perform(patch("/api/v1/" + resource + "/" + UUID.randomUUID()).contentType(MediaType.APPLICATION_JSON).content("{}")).andExpect(status().isUnauthorized());
            mvc.perform(delete("/api/v1/" + resource + "/" + UUID.randomUUID())).andExpect(status().isUnauthorized());
        }
    }
    private User register(String email) throws Exception {
        mvc.perform(post("/api/v1/auth/register").contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(Map.of("email", email, "password", "long-test-password", "displayName", "Test"))))
                .andExpect(status().isCreated());
        return users.findByEmail(email).orElseThrow();
    }
    private ResultActions perform(MockHttpServletRequestBuilder request, String token) throws Exception {
        return mvc.perform(request.header("Authorization", "Bearer " + token));
    }
    private String createAccount(String token, String name, String currency, String balance) throws Exception {
        var result = perform(post("/api/v1/accounts").contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(Map.of("name", name, "accountType", "CHECKING", "currency", currency, "openingBalance", balance))), token)
                .andExpect(status().isCreated()).andReturn();
        return json.readTree(result.getResponse().getContentAsString()).get("id").asText();
    }
    private String createCategory(String token, String name, String type) throws Exception {
        var result = perform(post("/api/v1/categories").contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(Map.of("name", name, "type", type))), token)
                .andExpect(status().isCreated()).andExpect(jsonPath("$.defaultCategory").value(false)).andReturn();
        return json.readTree(result.getResponse().getContentAsString()).get("id").asText();
    }
}
