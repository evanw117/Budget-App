package com.example.finance.category;

import jakarta.validation.constraints.*;

public record CategoryRequest(@NotBlank @Size(max = 100) String name, @NotNull CategoryType type) {
    @Override public String toString() { return "CategoryRequest[redacted]"; }
    public CategoryRequest { name = name == null ? null : name.strip(); }
}
