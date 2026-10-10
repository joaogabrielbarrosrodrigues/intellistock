package br.com.intellistock.intellistock_backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank(message = "Nome e obrigatorio.")
        @Size(max = 120, message = "Nome deve ter no maximo 120 caracteres.")
        String nome,

        @NotBlank(message = "E-mail e obrigatorio.")
        @Email(message = "E-mail deve ser valido.")
        @Size(max = 180, message = "E-mail deve ter no maximo 180 caracteres.")
        String email,

        @NotBlank(message = "Senha e obrigatoria.")
        @Size(min = 8, max = 72, message = "Senha deve ter entre 8 e 72 caracteres.")
        String senha
) {
}
