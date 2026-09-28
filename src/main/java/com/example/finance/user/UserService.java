package com.example.finance.user;

import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.UUID;

@Service
public class UserService {
    private final UserRepository users;
    public UserService(UserRepository users) { this.users = users; }

    @Transactional(readOnly = true)
    public UserResponse currentUser(UUID id) {
        return users.findById(id).map(UserResponse::from)
                .orElseThrow(() -> new BadCredentialsException("Invalid authentication"));
    }
}
