package com.example.finance.transaction;

import com.example.finance.account.*;
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
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.*;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@Testcontainers
@SpringBootTest
@AutoConfigureMockMvc
class TransactionIT {
    @Container @ServiceConnection
    static final PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17-alpine");
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired UserRepository users;
    @Autowired AccountRepository accounts;
    @Autowired CategoryRepository categories;
    @Autowired TransactionRepository transactions;
    @Autowired TokenService tokens;
    @Autowired JdbcTemplate jdbc;
    User alice, bob;
    Account euro, dollar, foreign;
    Category income, expense, foreignCategory;
    String token, otherToken;
    @BeforeEach void setup() {
        transactions.deleteAll(); accounts.deleteAll(); categories.deleteAll(); users.deleteAll();
        alice = users.saveAndFlush(new User("alice@example.com", "test-hash", "Alice"));
        bob = users.saveAndFlush(new User("bob@example.com", "test-hash", "Bob"));
        euro = accounts.saveAndFlush(new Account(alice, "Euro", AccountType.CHECKING, "EUR", new BigDecimal("100.0001")));
        dollar = accounts.saveAndFlush(new Account(alice, "Dollar", AccountType.CASH, "USD", new BigDecimal("-10")));
        foreign = accounts.saveAndFlush(new Account(bob, "Private", AccountType.CASH, "GBP", BigDecimal.ZERO));
        income = categories.saveAndFlush(new Category(alice, "Salary", CategoryType.INCOME, false));
        expense = categories.saveAndFlush(new Category(alice, "Food", CategoryType.EXPENSE, false));
        foreignCategory = categories.saveAndFlush(new Category(bob, "Food", CategoryType.EXPENSE, false));
        token = tokens.issue(alice).accessToken(); otherToken = tokens.issue(bob).accessToken();
    }
    @Test void incomeExpenseEditMoveAndDeleteRecalculateExactBalances() throws Exception {
        String id = create(euro, expense, "0.1234", "EXPENSE", token);
        create(euro, income, "5.2000", "INCOME", token);
        balance(euro, "105.0767"); balance(dollar, "-10.0000");
        send(put("/api/v1/transactions/" + id), payload(euro, expense, "1.0001", "EXPENSE"), token)
                .andExpect(status().isOk()).andExpect(jsonPath("$.amount").value("1.0001"));
        balance(euro, "104.2000");
        // Reassigning a record is a correction, not a transfer or currency conversion.
        send(put("/api/v1/transactions/" + id), payload(dollar, expense, "2.5555", "EXPENSE"), token)
                .andExpect(status().isOk()).andExpect(jsonPath("$.currency").value("USD"));
        balance(euro, "105.2001"); balance(dollar, "-12.5555");
        perform(delete("/api/v1/transactions/" + id), token).andExpect(status().isNoContent());
        balance(dollar, "-10.0000");
        perform(get("/api/v1/transactions/" + id), token).andExpect(status().isNotFound());
        perform(get("/api/v1/accounts"), token).andExpect(jsonPath("$[0].currentBalance").isString());
    }
    @Test void readEditDeleteAndFilteredListsAreOwnerScoped() throws Exception {
        String id = create(euro, expense, "1", "EXPENSE", token);
        create(foreign, foreignCategory, "9", "EXPENSE", otherToken);
        perform(get("/api/v1/transactions"), token).andExpect(jsonPath("$.totalElements").value(1));
        perform(get("/api/v1/transactions/" + id), otherToken).andExpect(status().isNotFound());
        send(put("/api/v1/transactions/" + id), payload(foreign, foreignCategory, "2", "EXPENSE"), otherToken)
                .andExpect(status().isNotFound());
        perform(delete("/api/v1/transactions/" + id), otherToken).andExpect(status().isNotFound());
        perform(get("/api/v1/transactions").param("accountId", euro.getId().toString()), otherToken).andExpect(status().isNotFound());
        balance(euro, "99.0001");
    }
    @Test void rejectsForeignReferencesAndIgnoresInjectedOwnerAndCurrency() throws Exception {
        send(post("/api/v1/transactions"), payload(foreign, expense, "1", "EXPENSE"), token).andExpect(status().isNotFound());
        send(post("/api/v1/transactions"), payload(euro, foreignCategory, "1", "EXPENSE"), token).andExpect(status().isNotFound());
        var input = payload(euro, expense, "1.2345", "EXPENSE");
        input.put("userId", bob.getId()); input.put("currency", "GBP");
        var result = send(post("/api/v1/transactions"), input, token).andExpect(status().isCreated())
                .andExpect(jsonPath("$.currency").value("EUR")).andExpect(jsonPath("$.userId").doesNotExist()).andReturn();
        String id = json.readTree(result.getResponse().getContentAsString()).get("id").asText();
        perform(get("/api/v1/transactions/" + id), otherToken).andExpect(status().isNotFound());
    }
    @Test void failedEditLeavesOriginalAndBalancesUnchanged() throws Exception {
        String id = create(euro, expense, "2.1111", "EXPENSE", token);
        send(put("/api/v1/transactions/" + id), payload(foreign, expense, "50", "EXPENSE"), token).andExpect(status().isNotFound());
        send(put("/api/v1/transactions/" + id), payload(euro, expense, "5", "INCOME"), token).andExpect(status().isBadRequest());
        balance(euro, "97.8890");
        perform(get("/api/v1/transactions/" + id), token).andExpect(jsonPath("$.amount").value("2.1111"));
    }
    @Test void validatesAmountsDatesRequiredFieldsAndMatchingType() throws Exception {
        for (String amount : List.of("0", "-1", "0.00001", "1000000000000000")) {
            send(post("/api/v1/transactions"), payload(euro, expense, amount, "EXPENSE"), token).andExpect(status().isBadRequest());
        }
        send(post("/api/v1/transactions"), Map.of(), token).andExpect(status().isBadRequest());
        var input = payload(euro, expense, "1", "EXPENSE");
        input.put("date", LocalDate.now().plusDays(2).toString());
        send(post("/api/v1/transactions"), input, token).andExpect(status().isBadRequest());
        input.put("date", "2026-02-30");
        send(post("/api/v1/transactions"), input, token).andExpect(status().isBadRequest());
        input.put("date", "2026-01-01"); input.put("description", "a".repeat(501));
        send(post("/api/v1/transactions"), input, token).andExpect(status().isBadRequest());
        send(post("/api/v1/transactions"), payload(euro, income, "1", "EXPENSE"), token).andExpect(status().isBadRequest());
        assertThat(transactions.count()).isZero();
    }
    @Test void listFiltersInclusiveDatesAndStablePagination() throws Exception {
        for (int i = 1; i <= 3; i++) {
            var input = payload(euro, expense, "1", "EXPENSE"); input.put("date", "2026-01-0" + i);
            send(post("/api/v1/transactions"), input, token).andExpect(status().isCreated());
        }
        create(dollar, income, "3", "INCOME", token);
        var query = get("/api/v1/transactions").param("accountId", euro.getId().toString())
                .param("type", "EXPENSE").param("from", "2026-01-02").param("to", "2026-01-03").param("size", "1");
        perform(query, token).andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.totalPages").value(2)).andExpect(jsonPath("$.items[0].date").value("2026-01-03"));
        perform(get("/api/v1/transactions").param("accountId", euro.getId().toString()).param("size", "1").param("page", "1"), token)
                .andExpect(jsonPath("$.items[0].date").value("2026-01-02"));
        for (String path : List.of("?page=-1", "?size=0", "?size=101", "?type=OTHER", "?from=2026-02-01&to=2026-01-01", "?accountId=bad")) {
            perform(get("/api/v1/transactions" + path), token).andExpect(status().isBadRequest());
        }
    }
    @Test void archivedReferencesRetainHistoryButCannotReceiveNewTransactions() throws Exception {
        String id = create(euro, expense, "1", "EXPENSE", token);
        perform(delete("/api/v1/accounts/" + euro.getId()), token).andExpect(status().isNoContent());
        perform(delete("/api/v1/categories/" + expense.getId()), token).andExpect(status().isNoContent());
        send(post("/api/v1/transactions"), payload(euro, expense, "1", "EXPENSE"), token).andExpect(status().isBadRequest());
        send(put("/api/v1/transactions/" + id), payload(euro, expense, "3", "EXPENSE"), token).andExpect(status().isOk());
        balance(euro, "97.0001");
        perform(delete("/api/v1/transactions/" + id), token).andExpect(status().isNoContent());
    }
    @Test void referencedCurrencyAndCategoryTypeAreProtectedByDatabase() throws Exception {
        create(euro, expense, "1", "EXPENSE", token);
        send(patch("/api/v1/accounts/" + euro.getId()), Map.of("currency", "USD"), token).andExpect(status().isConflict());
        send(patch("/api/v1/categories/" + expense.getId()), Map.of("type", "INCOME"), token).andExpect(status().isConflict());
        send(patch("/api/v1/accounts/" + euro.getId()), Map.of("openingBalance", "20.1001"), token).andExpect(status().isOk())
                .andExpect(jsonPath("$.currentBalance").value("19.1001"));
        balance(euro, "19.1001");
    }
    @Test void databaseRejectsCrossOwnerReferencesEvenWithoutService() {
        assertThatThrownBy(() -> jdbc.update("""
                INSERT INTO financial_transaction(id,user_id,account_id,category_id,currency,type,amount,transaction_date,description,created_at,updated_at)
                VALUES (?,?,?,?,?,'EXPENSE',1,CURRENT_DATE,'',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
                """, UUID.randomUUID(), alice.getId(), foreign.getId(), expense.getId(), "GBP"))
                .isInstanceOf(org.springframework.dao.DataIntegrityViolationException.class);
    }
    @Test void allTransactionMethodsRequireAuthentication() throws Exception {
        mvc.perform(get("/api/v1/transactions")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/v1/transactions/" + UUID.randomUUID())).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/v1/transactions").contentType(MediaType.APPLICATION_JSON).content("{}")).andExpect(status().isUnauthorized());
        mvc.perform(put("/api/v1/transactions/" + UUID.randomUUID()).contentType(MediaType.APPLICATION_JSON).content("{}")).andExpect(status().isUnauthorized());
        mvc.perform(delete("/api/v1/transactions/" + UUID.randomUUID())).andExpect(status().isUnauthorized());
    }
    private Map<String,Object> payload(Account account, Category category, String amount, String type) {
        return new HashMap<>(Map.of("accountId",account.getId(), "categoryId",category.getId(),
                "amount",amount, "type",type, "date","2026-01-01", "description","Test entry"));
    }
    private String create(Account account, Category category, String amount, String type, String auth) throws Exception {
        var result = send(post("/api/v1/transactions"), payload(account, category, amount, type), auth)
                .andExpect(status().isCreated()).andReturn();
        return json.readTree(result.getResponse().getContentAsString()).get("id").asText();
    }
    private void balance(Account account, String expected) throws Exception {
        perform(get("/api/v1/accounts/" + account.getId()), token)
                .andExpect(status().isOk()).andExpect(jsonPath("$.currentBalance").value(expected));
    }
    private ResultActions send(MockHttpServletRequestBuilder request, Object input, String auth) throws Exception {
        return perform(request.contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(input)), auth);
    }
    private ResultActions perform(MockHttpServletRequestBuilder request, String auth) throws Exception {
        return mvc.perform(request.header("Authorization","Bearer " + auth));
    }
}
