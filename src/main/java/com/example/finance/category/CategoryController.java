package com.example.finance.category;

import jakarta.validation.Valid;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import java.net.URI;
import java.util.*;

@RestController
@RequestMapping("/api/v1/categories")
public class CategoryController {
    private final CategoryService categories;
    public CategoryController(CategoryService categories) { this.categories = categories; }
    @GetMapping public List<CategoryResponse> list(@AuthenticationPrincipal Jwt jwt) { return categories.list(owner(jwt)); }
    @GetMapping("/{id}") public CategoryResponse get(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        return categories.get(owner(jwt), id);
    }
    @PostMapping public ResponseEntity<CategoryResponse> create(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody CategoryRequest request) {
        var result = categories.create(owner(jwt), request);
        return ResponseEntity.created(URI.create("/api/v1/categories/" + result.id())).body(result);
    }
    @PatchMapping("/{id}") public CategoryResponse update(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id, @Valid @RequestBody CategoryPatch request) {
        return categories.update(owner(jwt), id, request);
    }
    @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void archive(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) { categories.archive(owner(jwt), id); }
    private UUID owner(Jwt jwt) { return UUID.fromString(jwt.getSubject()); }
}
