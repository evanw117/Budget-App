package com.example.finance.transaction;

import com.example.finance.category.CategoryType;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record TransactionRequest(
        @NotNull UUID accountId,
        @NotNull UUID categoryId,
        @NotNull CategoryType type,
        @NotNull @DecimalMin(value = "0", inclusive = false) @Digits(integer = 15, fraction = 4) BigDecimal amount,
        @NotNull @PastOrPresent LocalDate date,
        @Size(max = 500) String description) {
    public TransactionRequest { description = description == null ? "" : description.strip(); }
    @Override public String toString() { return "TransactionRequest[redacted]"; }
}
