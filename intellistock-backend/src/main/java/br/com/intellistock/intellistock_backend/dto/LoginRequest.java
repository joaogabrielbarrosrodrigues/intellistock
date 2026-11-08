package br.com.intellistock.intellistock_backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        @NotBlank(message = "E-mail e obrigatorio.")
        @Email(message = "E-mail deve ser valido.")
        String email,

        @NotBlank(message = "Senha e obrigatoria.")
        String senha
) {

    @Override
    public String toString() {
        return "LoginRequest[email=" + email + ", senha=<redigida>]";
    }
}
