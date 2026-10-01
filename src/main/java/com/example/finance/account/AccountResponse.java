package com.example.finance.account;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record AccountResponse(UUID id, String name, AccountType accountType, String currency,
        @JsonSerialize(using = ToStringSerializer.class) BigDecimal openingBalance,
        @JsonSerialize(using = ToStringSerializer.class) BigDecimal currentBalance,
        boolean active, Instant createdAt, Instant updatedAt) {
    @Override public String toString() { return "AccountResponse[redacted]"; }
    public static AccountResponse from(Account account) { return from(account, BigDecimal.ZERO); }
    public static AccountResponse from(Account account, BigDecimal netAmount) {
        return new AccountResponse(account.getId(), account.getName(), account.getAccountType(), account.getCurrency(),
                account.getOpeningBalance(), account.getOpeningBalance().add(netAmount),
                account.isActive(), account.getCreatedAt(), account.getUpdatedAt());
    }
}
