package com.example.finance.transaction;

import com.example.finance.account.*;
import com.example.finance.category.*;
import com.example.finance.common.ResourceNotFoundException;
import com.example.finance.user.User;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TransactionServiceTest {
    @Mock TransactionRepository transactions;
    @Mock AccountRepository accounts;
    @Mock CategoryRepository categories;
    @InjectMocks TransactionService service;
    User user = new User("test@example.com", "hash", "Test");
    Account account = new Account(user, "Cash", AccountType.CASH, "EUR", BigDecimal.ZERO);
    Category category = new Category(user, "Food", CategoryType.EXPENSE, false);
    TransactionRequest request() {
        return new TransactionRequest(account.getId(), category.getId(), CategoryType.EXPENSE,
                new BigDecimal("1.2345"), LocalDate.of(2026,1,1), " Food ");
    }
    @Test void currencyComesFromOwnedAccountAndAmountRetainsPrecision() {
        when(accounts.findByIdAndUserId(account.getId(), user.getId())).thenReturn(Optional.of(account));
        when(categories.findByIdAndUserId(category.getId(), user.getId())).thenReturn(Optional.of(category));
        when(transactions.saveAndFlush(any())).thenAnswer(call -> call.getArgument(0));
        var response = service.create(user.getId(), request());
        assertThat(response.currency()).isEqualTo("EUR");
        assertThat(response.amount()).isEqualByComparingTo("1.2345");
        assertThat(response.description()).isEqualTo("Food");
    }
    @Test void foreignTransactionRejectedBeforeLookingUpReferences() {
        var id = UUID.randomUUID();
        assertThatThrownBy(() -> service.update(user.getId(), id, request())).isInstanceOf(ResourceNotFoundException.class);
        verifyNoInteractions(accounts, categories);
        verify(transactions, never()).saveAndFlush(any());
    }
    @Test void archivedAccountCannotReceiveNewTransaction() {
        account.archive();
        when(accounts.findByIdAndUserId(account.getId(), user.getId())).thenReturn(Optional.of(account));
        when(categories.findByIdAndUserId(category.getId(), user.getId())).thenReturn(Optional.of(category));
        assertThatThrownBy(() -> service.create(user.getId(), request())).isInstanceOf(ResponseStatusException.class);
        verify(transactions, never()).saveAndFlush(any());
    }
    @Test void invalidPaginationRejectedBeforeQuery() {
        assertThatThrownBy(() -> service.list(user.getId(), null, null, null, null, -1, 20)).isInstanceOf(ResponseStatusException.class);
        assertThatThrownBy(() -> service.list(user.getId(), null, null, null, null, 0, 101)).isInstanceOf(ResponseStatusException.class);
        verifyNoInteractions(transactions);
    }
}
