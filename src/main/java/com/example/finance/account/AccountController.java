package com.example.finance.account;

import jakarta.validation.Valid;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import java.net.URI;
import java.util.*;

@RestController
@RequestMapping("/api/v1/accounts")
public class AccountController {
    private final AccountService accounts;
    public AccountController(AccountService accounts) { this.accounts = accounts; }
    @GetMapping public List<AccountResponse> list(@AuthenticationPrincipal Jwt jwt) { return accounts.list(owner(jwt)); }
    @GetMapping("/{id}") public AccountResponse get(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        return accounts.get(owner(jwt), id);
    }
    @PostMapping public ResponseEntity<AccountResponse> create(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody AccountRequest request) {
        var result = accounts.create(owner(jwt), request);
        return ResponseEntity.created(URI.create("/api/v1/accounts/" + result.id())).body(result);
    }
    @PatchMapping("/{id}") public AccountResponse update(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id, @Valid @RequestBody AccountPatch request) {
        return accounts.update(owner(jwt), id, request);
    }
    @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void archive(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) { accounts.archive(owner(jwt), id); }
    private UUID owner(Jwt jwt) { return UUID.fromString(jwt.getSubject()); }
}
