package com.example.finance.common;

public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException() { super("Resource not found"); }
}
