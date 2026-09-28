package com.example.finance.user;

import java.util.UUID;

public record UserResponse(UUID id, String email, String displayName, Role role) {
    public static UserResponse from(User user) {
        return new UserResponse(user.getId(), user.getEmail(), user.getDisplayName(), user.getRole());
    }
}
