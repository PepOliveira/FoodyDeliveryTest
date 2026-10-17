package com.foody.tracker.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank(message = "Name is required") @Size(max = 100) String name,
        @NotBlank(message = "E-mail is required") @Email(message = "Invalid e-mail") String email,
        @NotBlank(message = "Password is required")
        @Size(min = 6, max = 72, message = "Password must have 6 to 72 characters") String password
) {
}
