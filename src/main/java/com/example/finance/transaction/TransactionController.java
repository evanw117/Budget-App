package com.example.finance.transaction;

import com.example.finance.category.CategoryType;
import jakarta.validation.Valid;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import java.net.URI;
import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/transactions")
public class TransactionController {
    private final TransactionService service;
    public TransactionController(TransactionService service) { this.service = service; }
    @GetMapping public TransactionService.TransactionPage list(@AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false) UUID accountId, @RequestParam(required = false) CategoryType type,
            @RequestParam(required = false) LocalDate from, @RequestParam(required = false) LocalDate to,
            @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        return service.list(owner(jwt), accountId, type, from, to, page, size);
    }
    @GetMapping("/{id}") public TransactionResponse get(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        return service.get(owner(jwt), id);
    }
    @PostMapping public ResponseEntity<TransactionResponse> create(@AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody TransactionRequest request) {
        var result = service.create(owner(jwt), request);
        return ResponseEntity.created(URI.create("/api/v1/transactions/" + result.id())).body(result);
    }
    @PutMapping("/{id}") public TransactionResponse update(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id,
            @Valid @RequestBody TransactionRequest request) { return service.update(owner(jwt), id, request); }
    @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) { service.delete(owner(jwt), id); }
    private UUID owner(Jwt jwt) { return UUID.fromString(jwt.getSubject()); }
}
