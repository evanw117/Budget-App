package com.example.finance.account;

import com.fasterxml.jackson.annotation.JsonSetter;
import com.fasterxml.jackson.annotation.Nulls;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.util.Locale;

// Missing fields are unchanged; explicit null is rejected during deserialization.
public class AccountPatch {
    @Size(min = 1, max = 100) private String name;
    private AccountType accountType;
    @Pattern(regexp = "[A-Z]{3}") private String currency;
    @Digits(integer = 15, fraction = 4) private BigDecimal openingBalance;
    private Boolean active;
    public String getName() { return name; }
    public AccountType getAccountType() { return accountType; }
    public String getCurrency() { return currency; }
    public BigDecimal getOpeningBalance() { return openingBalance; }
    public Boolean getActive() { return active; }
    @JsonSetter(nulls = Nulls.FAIL) public void setName(String value) { name = value.strip(); }
    @JsonSetter(nulls = Nulls.FAIL) public void setAccountType(AccountType value) { accountType = value; }
    @JsonSetter(nulls = Nulls.FAIL) public void setCurrency(String value) { currency = value.strip().toUpperCase(Locale.ROOT); }
    @JsonSetter(nulls = Nulls.FAIL) public void setOpeningBalance(BigDecimal value) { openingBalance = value; }
    @JsonSetter(nulls = Nulls.FAIL) public void setActive(Boolean value) { active = value; }
}
