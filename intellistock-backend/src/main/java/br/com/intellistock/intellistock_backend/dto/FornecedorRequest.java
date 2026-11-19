package br.com.intellistock.intellistock_backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Título: Dados recebidos pela API: Fornecedor
 * Explicação: DTO de entrada para criar ou editar fornecedor.
 */
public record FornecedorRequest(
        @NotBlank(message = "Nome e obrigatorio.")
        @Size(max = 150, message = "Nome deve ter no maximo 150 caracteres.")
        String nome,

        @Size(max = 18, message = "CNPJ deve ter no maximo 18 caracteres.")
        String cnpj,

        @Size(max = 20, message = "Telefone deve ter no maximo 20 caracteres.")
        String telefone,

        @Email(message = "E-mail deve ser valido.")
        @Size(max = 180, message = "E-mail deve ter no maximo 180 caracteres.")
        String email
) {
}
