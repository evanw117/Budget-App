package com.example.finance.auth;

import com.example.finance.user.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import java.util.Optional;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {
    @Mock UserRepository users;
    @Mock PasswordEncoder passwords;
    @Mock TokenService tokens;
    @Mock com.example.finance.category.DefaultCategoryService defaults;
    AuthService auth;

    @BeforeEach
    void setUp() {
        when(passwords.encode(anyString())).thenReturn("encoded-password");
        auth = new AuthService(users, passwords, tokens, defaults);
    }

    @Test
    void registrationNormalizesIdentityAndStoresOnlyEncodedPassword() {
        when(users.saveAndFlush(any())).thenAnswer(call -> call.getArgument(0));
        var result = auth.register(new RegisterRequest(" Alice@Example.com ", "long-password-123", " Alice "));
        var captor = ArgumentCaptor.forClass(User.class);
        verify(users).saveAndFlush(captor.capture());
        verify(defaults).createFor(captor.getValue());
        assertThat(captor.getValue().getPasswordHash()).isEqualTo("encoded-password");
        verify(passwords).encode("long-password-123");
        assertThat(result.email()).isEqualTo("alice@example.com");
        assertThat(result.displayName()).isEqualTo("Alice");
        assertThat(result.role()).isEqualTo(Role.ROLE_USER);
    }

    @Test
    void duplicateEmailDoesNotWriteAnotherUser() {
        when(users.existsByEmail("alice@example.com")).thenReturn(true);
        assertThatThrownBy(() -> auth.register(new RegisterRequest("alice@example.com", "long-password-123", "Alice")))
                .isInstanceOf(DuplicateEmailException.class);
        verify(users, never()).saveAndFlush(any());
    }

    @Test
    void unknownEmailStillChecksPasswordAndNeverIssuesToken() {
        when(users.findByEmail("missing@example.com")).thenReturn(Optional.empty());
        assertThatThrownBy(() -> auth.login(new LoginRequest("missing@example.com", "wrong-password")))
                .isInstanceOf(BadCredentialsException.class);
        verify(passwords).matches("wrong-password", "encoded-password");
        verifyNoInteractions(tokens);
    }

    @Test
    void invalidPasswordNeverIssuesToken() {
        var user = new User("alice@example.com", "stored-hash", "Alice");
        when(users.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        assertThatThrownBy(() -> auth.login(new LoginRequest(user.getEmail(), "wrong-password")))
                .isInstanceOf(BadCredentialsException.class);
        verifyNoInteractions(tokens);
    }

    @Test
    void successfulLoginIssuesTokenForStoredUser() {
        var user = new User("alice@example.com", "stored-hash", "Alice");
        when(users.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        when(passwords.matches("long-password-123", "stored-hash")).thenReturn(true);
        var expected = new TokenResponse("signed-token", "Bearer", 900);
        when(tokens.issue(user)).thenReturn(expected);
        assertThat(auth.login(new LoginRequest(user.getEmail(), "long-password-123"))).isEqualTo(expected);
    }
}
