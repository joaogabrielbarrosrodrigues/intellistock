package br.com.intellistock.intellistock_backend.dto;

import br.com.intellistock.intellistock_backend.entity.User;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Título: Dados devolvidos pela API: User
 * Explicação: DTO de saída com os dados de um usuário que podem ser mostrados.
 */
public record UserResponse(UUID id, String nome, String email, OffsetDateTime createdAt) {

    /**
     * Título: Converte a entidade neste DTO
     * Explicação: Recebe user (User). Devolve UserResponse.
     */
    public static UserResponse from(User user) {
        return new UserResponse(user.getId(), user.getNome(), user.getEmail(), user.getCreatedAt());
    }
}
