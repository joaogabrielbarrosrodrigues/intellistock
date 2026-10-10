package br.com.intellistock.intellistock_backend.dto;

import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record ContaPagarRequest(
        @NotNull(message = "Fornecedor e obrigatorio.")
        UUID fornecedorId,

        @NotBlank(message = "Descricao e obrigatoria.")
        @Size(max = 255, message = "Descricao deve ter no maximo 255 caracteres.")
        String descricao,

        @NotNull(message = "Valor e obrigatorio.")
        @Positive(message = "Valor deve ser maior que zero.")
        @Digits(integer = 13, fraction = 2, message = "Valor deve ter no maximo 2 casas decimais.")
        BigDecimal valor,

        @NotNull(message = "Data de vencimento e obrigatoria.")
        LocalDate dataVencimento,

        @Size(max = 500, message = "Observacao deve ter no maximo 500 caracteres.")
        String observacao
) {
}
