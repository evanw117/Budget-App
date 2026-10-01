package com.example.finance.account;

import com.example.finance.common.ResourceNotFoundException;
import com.example.finance.user.*;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import java.math.BigDecimal;
import java.util.*;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.any;

@ExtendWith(MockitoExtension.class)
class AccountServiceTest {
    @Mock AccountRepository accounts;
    @Mock UserRepository users;
    @Mock com.example.finance.transaction.TransactionRepository transactions;
    AccountService service;
    final User owner = new User("owner@example.com", "hash", "Owner");
    @BeforeEach void setup() { service = new AccountService(accounts, users, transactions); }
    @Test void createsWithAuthenticatedOwnerAndExactOpeningBalance() {
        when(users.findById(owner.getId())).thenReturn(Optional.of(owner));
        when(accounts.saveAndFlush(any())).thenAnswer(call -> call.getArgument(0));
        var result = service.create(owner.getId(), new AccountRequest(" Checking ", AccountType.CHECKING, "eur", new BigDecimal("123.4567")));
        assertThat(result.name()).isEqualTo("Checking");
        assertThat(result.currency()).isEqualTo("EUR");
        assertThat(result.openingBalance()).isEqualByComparingTo("123.4567");
        assertThat(result.active()).isTrue();
        verify(users).findById(owner.getId());
    }
    @Test void listsOnlyOwnerScopedResults() {
        when(accounts.findAllByUserIdOrderByCreatedAtAscIdAsc(owner.getId())).thenReturn(List.of());
        assertThat(service.list(owner.getId())).isEmpty();
        verify(accounts).findAllByUserIdOrderByCreatedAtAscIdAsc(owner.getId());
    }
    @Test void deniesForeignIdBeforeModification() {
        UUID foreignId = UUID.randomUUID();
        when(accounts.findByIdAndUserId(foreignId, owner.getId())).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.update(owner.getId(), foreignId, new AccountPatch())).isInstanceOf(ResourceNotFoundException.class);
        verify(accounts, never()).saveAndFlush(any());
    }
    @Test void partialUpdatePreservesUnspecifiedFinancialFields() {
        var account = new Account(owner, "Old", AccountType.CREDIT_CARD, "GBP", new BigDecimal("-50.0001"));
        when(accounts.findByIdAndUserId(account.getId(), owner.getId())).thenReturn(Optional.of(account));
        when(accounts.saveAndFlush(account)).thenReturn(account);
        when(transactions.netAmount(owner.getId(), account.getId())).thenReturn(BigDecimal.ZERO);
        var patch = new AccountPatch(); patch.setName("New");
        var result = service.update(owner.getId(), account.getId(), patch);
        assertThat(result.name()).isEqualTo("New");
        assertThat(result.currency()).isEqualTo("GBP");
        assertThat(result.openingBalance()).isEqualByComparingTo("-50.0001");
    }
    @Test void archivesWithoutDeletingOrChangingBalance() {
        var account = new Account(owner, "Cash", AccountType.CASH, "USD", new BigDecimal("20"));
        when(accounts.findByIdAndUserId(account.getId(), owner.getId())).thenReturn(Optional.of(account));
        service.archive(owner.getId(), account.getId());
        assertThat(account.isActive()).isFalse();
        assertThat(account.getOpeningBalance()).isEqualByComparingTo("20");
        verify(accounts, never()).delete(any());
    }
}
