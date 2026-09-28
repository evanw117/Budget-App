package com.example.finance.auth;

public record TokenResponse(String accessToken, String tokenType, long expiresIn) {
    @Override public String toString() { return "TokenResponse[redacted]"; }
}
