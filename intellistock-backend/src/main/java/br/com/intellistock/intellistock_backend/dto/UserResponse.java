package br.com.intellistock.intellistock_backend.dto;

import br.com.intellistock.intellistock_backend.entity.User;

import java.time.OffsetDateTime;
import java.util.UUID;

public record UserResponse(UUID id, String nome, String email, OffsetDateTime createdAt) {

    public static UserResponse from(User user) {
        return new UserResponse(user.getId(), user.getNome(), user.getEmail(), user.getCreatedAt());
    }
}
