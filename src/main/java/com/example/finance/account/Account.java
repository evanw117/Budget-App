package com.example.finance.account;

import com.example.finance.user.User;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "financial_account")
public class Account {
    @Id private UUID id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, updatable = false)
    private User user;
    @Column(nullable = false, length = 100) private String name;
    @Enumerated(EnumType.STRING)
    @Column(name = "account_type", nullable = false, length = 20) private AccountType accountType;
    @Column(nullable = false, length = 3) private String currency;
    @Column(name = "opening_balance", nullable = false, precision = 19, scale = 4) private BigDecimal openingBalance;
    @Column(nullable = false) private boolean active;
    @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt;
    @Column(name = "updated_at", nullable = false) private Instant updatedAt;

    protected Account() {}
    public Account(User user, String name, AccountType accountType, String currency, BigDecimal openingBalance) {
        this.id = UUID.randomUUID(); this.user = user; this.name = name; this.accountType = accountType;
        this.currency = currency; this.openingBalance = openingBalance; this.active = true;
        this.createdAt = Instant.now(); this.updatedAt = createdAt;
    }
    public void update(AccountPatch request) {
        if (request.getName() != null) name = request.getName();
        if (request.getAccountType() != null) accountType = request.getAccountType();
        if (request.getCurrency() != null) currency = request.getCurrency();
        if (request.getOpeningBalance() != null) openingBalance = request.getOpeningBalance();
        if (request.getActive() != null) active = request.getActive();
    }
    public void archive() { active = false; }
    @PreUpdate void updated() { updatedAt = Instant.now(); }
    public UUID getId() { return id; }
    public String getName() { return name; }
    public AccountType getAccountType() { return accountType; }
    public String getCurrency() { return currency; }
    public BigDecimal getOpeningBalance() { return openingBalance; }
    public boolean isActive() { return active; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
