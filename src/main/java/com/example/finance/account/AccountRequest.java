package com.example.finance.account;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.util.Locale;

public record AccountRequest(
        @NotBlank @Size(max = 100) String name,
        @NotNull AccountType accountType,
        @NotBlank @Pattern(regexp = "[A-Z]{3}") String currency,
        @NotNull @Digits(integer = 15, fraction = 4) BigDecimal openingBalance) {
    @Override public String toString() { return "AccountRequest[redacted]"; }
    public AccountRequest {
        name = name == null ? null : name.strip();
        currency = currency == null ? null : currency.strip().toUpperCase(Locale.ROOT);
    }
}
