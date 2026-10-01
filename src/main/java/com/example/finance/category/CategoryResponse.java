package com.example.finance.category;

import java.time.Instant;
import java.util.UUID;

public record CategoryResponse(UUID id, String name, CategoryType type, boolean defaultCategory,
        boolean active, Instant createdAt, Instant updatedAt) {
    @Override public String toString() { return "CategoryResponse[redacted]"; }
    public static CategoryResponse from(Category category) {
        return new CategoryResponse(category.getId(), category.getName(), category.getType(), category.isDefaultCategory(),
                category.isActive(), category.getCreatedAt(), category.getUpdatedAt());
    }
}
