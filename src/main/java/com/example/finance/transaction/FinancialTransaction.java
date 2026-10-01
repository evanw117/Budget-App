package com.example.finance.transaction;

import com.example.finance.account.Account;
import com.example.finance.category.*;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.*;
import java.util.UUID;

@Entity
@Table(name = "financial_transaction")
public class FinancialTransaction {
    @Id private UUID id;
    @Column(name = "user_id", nullable = false, updatable = false) private UUID userId;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "account_id", nullable = false) private Account account;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "category_id", nullable = false) private Category category;
    @Column(nullable = false, length = 3) private String currency;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 10) private CategoryType type;
    @Column(nullable = false, precision = 19, scale = 4) private BigDecimal amount;
    @Column(name = "transaction_date", nullable = false) private LocalDate date;
    @Column(nullable = false, length = 500) private String description;
    @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt;
    @Column(name = "updated_at", nullable = false) private Instant updatedAt;

    protected FinancialTransaction() {}
    public FinancialTransaction(UUID owner, Account account, Category category, TransactionRequest request) {
        id = UUID.randomUUID(); userId = owner; createdAt = Instant.now();
        update(account, category, request);
    }
    public void update(Account account, Category category, TransactionRequest request) {
        this.account = account; this.category = category; currency = account.getCurrency();
        type = request.type(); amount = request.amount(); date = request.date();
        description = request.description(); updatedAt = Instant.now();
    }
    public UUID getId() { return id; }
    public Account getAccount() { return account; }
    public Category getCategory() { return category; }
    public String getCurrency() { return currency; }
    public CategoryType getType() { return type; }
    public BigDecimal getAmount() { return amount; }
    public LocalDate getDate() { return date; }
    public String getDescription() { return description; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
