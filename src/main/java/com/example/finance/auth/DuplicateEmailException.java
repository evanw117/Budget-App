package com.example.finance.auth;

public class DuplicateEmailException extends RuntimeException {
    public DuplicateEmailException() { super("Email is already registered"); }
}
