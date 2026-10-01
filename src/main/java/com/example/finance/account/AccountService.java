package com.example.finance.account;

import com.example.finance.common.ResourceNotFoundException;
import com.example.finance.user.UserRepository;
import com.example.finance.transaction.TransactionRepository;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class AccountService {
    private final AccountRepository accounts;
    private final UserRepository users;
    private final TransactionRepository transactions;
    public AccountService(AccountRepository accounts, UserRepository users, TransactionRepository transactions) {
        this.accounts = accounts; this.users = users; this.transactions = transactions;
    }
    public List<AccountResponse> list(UUID owner) {
        var totals = transactions.totalsByOwner(owner).stream().collect(Collectors.toMap(
                TransactionRepository.AccountTotal::getAccountId, TransactionRepository.AccountTotal::getNetAmount));
        return accounts.findAllByUserIdOrderByCreatedAtAscIdAsc(owner).stream()
                .map(a -> AccountResponse.from(a, totals.getOrDefault(a.getId(), BigDecimal.ZERO))).toList();
    }
    public AccountResponse get(UUID owner, UUID id) {
        var account = owned(owner, id);
        return AccountResponse.from(account, transactions.netAmount(owner, id));
    }
    @Transactional
    public AccountResponse create(UUID owner, AccountRequest request) {
        var user = users.findById(owner).orElseThrow(() -> new BadCredentialsException("Invalid authentication"));
        return AccountResponse.from(accounts.saveAndFlush(new Account(user, request.name(), request.accountType(),
                request.currency(), request.openingBalance())));
    }
    @Transactional
    public AccountResponse update(UUID owner, UUID id, AccountPatch request) {
        var account = owned(owner, id);
        account.update(request);
        return AccountResponse.from(accounts.saveAndFlush(account), transactions.netAmount(owner, id));
    }
    @Transactional
    public void archive(UUID owner, UUID id) { owned(owner, id).archive(); }
    private Account owned(UUID owner, UUID id) {
        return accounts.findByIdAndUserId(id, owner).orElseThrow(ResourceNotFoundException::new);
    }
}
