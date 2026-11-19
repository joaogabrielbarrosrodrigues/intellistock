package br.com.intellistock.intellistock_backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/**
 * Título: Dados recebidos pela API: Login
 * Explicação: DTO de entrada com os dados do login.
 */
public record LoginRequest(
        @NotBlank(message = "E-mail e obrigatorio.")
        @Email(message = "E-mail deve ser valido.")
        String email,

        @NotBlank(message = "Senha e obrigatoria.")
        String senha
) {

    /**
     * Título: Texto do objeto para logs
     * Explicação: Monta o texto usado em logs escondendo dados sensíveis (senha, código ou token).
     */
    @Override
    public String toString() {
        return "LoginRequest[email=" + email + ", senha=<redigida>]";
    }
}
