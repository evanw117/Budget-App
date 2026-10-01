package com.example.finance.category;

import com.example.finance.user.User;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "category")
public class Category {
    @Id private UUID id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, updatable = false) private User user;
    @Column(nullable = false, length = 100) private String name;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10) private CategoryType type;
    @Column(name = "is_default", nullable = false, updatable = false) private boolean defaultCategory;
    @Column(nullable = false) private boolean active;
    @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt;
    @Column(name = "updated_at", nullable = false) private Instant updatedAt;

    protected Category() {}
    public Category(User user, String name, CategoryType type, boolean defaultCategory) {
        this.id = UUID.randomUUID(); this.user = user; this.name = name; this.type = type;
        this.defaultCategory = defaultCategory; this.active = true;
        this.createdAt = Instant.now(); this.updatedAt = createdAt;
    }
    public void update(CategoryPatch request) {
        if (request.getName() != null) name = request.getName();
        if (request.getType() != null) type = request.getType();
        if (request.getActive() != null) active = request.getActive();
    }
    public void archive() { active = false; }
    @PreUpdate void updated() { updatedAt = Instant.now(); }
    public UUID getId() { return id; }
    public String getName() { return name; }
    public CategoryType getType() { return type; }
    public boolean isDefaultCategory() { return defaultCategory; }
    public boolean isActive() { return active; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
