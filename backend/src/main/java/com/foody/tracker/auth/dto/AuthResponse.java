package com.foody.tracker.auth.dto;

import com.foody.tracker.user.User;

public record AuthResponse(String token, UserSummary user) {

    public record UserSummary(Long id, String name, String email) {
        public static UserSummary from(User user) {
            return new UserSummary(user.getId(), user.getName(), user.getEmail());
        }
    }
}
