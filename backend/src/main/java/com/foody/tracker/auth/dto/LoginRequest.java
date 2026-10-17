package com.foody.tracker.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        @NotBlank(message = "E-mail is required") @Email(message = "Invalid e-mail") String email,
        @NotBlank(message = "Password is required") String password
) {
}
