package com.example.finance.transaction;

import com.example.finance.category.CategoryType;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import java.math.BigDecimal;
import java.time.*;
import java.util.UUID;

public record TransactionResponse(UUID id, UUID accountId, String accountName, UUID categoryId, String categoryName,
        String currency, CategoryType type,
        @JsonSerialize(using = ToStringSerializer.class) BigDecimal amount,
        LocalDate date, String description, Instant createdAt, Instant updatedAt) {
    public static TransactionResponse from(FinancialTransaction t) {
        return new TransactionResponse(t.getId(), t.getAccount().getId(), t.getAccount().getName(),
                t.getCategory().getId(), t.getCategory().getName(), t.getCurrency(), t.getType(),
                t.getAmount(), t.getDate(), t.getDescription(), t.getCreatedAt(), t.getUpdatedAt());
    }
    @Override public String toString() { return "TransactionResponse[redacted]"; }
}
