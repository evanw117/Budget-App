package com.example.finance.auth;

import com.example.finance.user.*;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
    private final UserRepository users;
    private final PasswordEncoder passwords;
    private final TokenService tokens;
    private final String dummyHash;
    private final com.example.finance.category.DefaultCategoryService defaults;

    public AuthService(UserRepository users, PasswordEncoder passwords, TokenService tokens, com.example.finance.category.DefaultCategoryService defaults) {
        this.users = users;
        this.defaults = defaults;
        this.passwords = passwords;
        this.tokens = tokens;
        this.dummyHash = passwords.encode(java.util.UUID.randomUUID().toString());
    }

    @Transactional
    public UserResponse register(RegisterRequest request) {
        if (users.existsByEmail(request.email())) { throw new DuplicateEmailException(); }
        User user = new User(request.email(), passwords.encode(request.password()), request.displayName());
        // The database unique constraint also protects concurrent registrations.
        user = users.saveAndFlush(user);
        defaults.createFor(user);
        return UserResponse.from(user);
    }

    @Transactional(readOnly = true)
    public TokenResponse login(LoginRequest request) {
        var user = users.findByEmail(request.email());
        boolean matches = passwords.matches(request.password(),
                user.map(User::getPasswordHash).orElse(dummyHash));
        if (user.isEmpty() || !matches) {
            throw new BadCredentialsException("Invalid email or password");
        }
        return tokens.issue(user.get());
    }
}
