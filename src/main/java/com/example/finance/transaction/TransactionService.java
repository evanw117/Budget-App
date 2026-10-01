package com.example.finance.transaction;

import com.example.finance.account.*;
import com.example.finance.category.*;
import com.example.finance.common.ResourceNotFoundException;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.time.LocalDate;
import java.util.*;

@Service
@Transactional(readOnly = true)
public class TransactionService {
    private final TransactionRepository transactions;
    private final AccountRepository accounts;
    private final CategoryRepository categories;
    public TransactionService(TransactionRepository transactions, AccountRepository accounts, CategoryRepository categories) {
        this.transactions = transactions; this.accounts = accounts; this.categories = categories;
    }
    public record TransactionPage(List<TransactionResponse> items, int page, int size, long totalElements, int totalPages) {}
    public TransactionPage list(UUID owner, UUID accountId, CategoryType type, LocalDate from, LocalDate to, int page, int size) {
        if (page < 0 || size < 1 || size > 100 || (from != null && to != null && from.isAfter(to)))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
        if (accountId != null)
            accounts.findByIdAndUserId(accountId, owner).orElseThrow(ResourceNotFoundException::new);
        Specification<FinancialTransaction> spec = (root, query, cb) -> {
            var predicates = new ArrayList<jakarta.persistence.criteria.Predicate>();
            predicates.add(cb.equal(root.get("userId"), owner));
            if (accountId != null) predicates.add(cb.equal(root.get("account").get("id"), accountId));
            if (type != null) predicates.add(cb.equal(root.get("type"), type));
            if (from != null) predicates.add(cb.greaterThanOrEqualTo(root.get("date"), from));
            if (to != null) predicates.add(cb.lessThanOrEqualTo(root.get("date"), to));
            return cb.and(predicates.toArray(jakarta.persistence.criteria.Predicate[]::new));
        };
        var result = transactions.findAll(spec, PageRequest.of(page, size,
                Sort.by(Sort.Order.desc("date"), Sort.Order.desc("id"))));
        return new TransactionPage(result.map(TransactionResponse::from).getContent(),
                page, size, result.getTotalElements(), result.getTotalPages());
    }
    public TransactionResponse get(UUID owner, UUID id) { return TransactionResponse.from(owned(owner, id)); }
    @Transactional public TransactionResponse create(UUID owner, TransactionRequest request) { return save(owner, null, request); }
    @Transactional public TransactionResponse update(UUID owner, UUID id, TransactionRequest request) {
        return save(owner, owned(owner, id), request);
    }
    private TransactionResponse save(UUID owner, FinancialTransaction existing, TransactionRequest request) {
        var account = accounts.findByIdAndUserId(request.accountId(), owner).orElseThrow(ResourceNotFoundException::new);
        var category = categories.findByIdAndUserId(request.categoryId(), owner).orElseThrow(ResourceNotFoundException::new);
        // Editing historical entries may retain archived references; new assignments must be active.
        if ((!account.isActive() && (existing == null || !existing.getAccount().getId().equals(account.getId()))) ||
                (!category.isActive() && (existing == null || !existing.getCategory().getId().equals(category.getId()))) ||
                category.getType() != request.type())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
        if (existing == null) existing = new FinancialTransaction(owner, account, category, request);
        else existing.update(account, category, request);
        return TransactionResponse.from(transactions.saveAndFlush(existing));
    }
    @Transactional public void delete(UUID owner, UUID id) { transactions.delete(owned(owner, id)); }
    private FinancialTransaction owned(UUID owner, UUID id) {
        return transactions.findByIdAndUserId(id, owner).orElseThrow(ResourceNotFoundException::new);
    }
}
