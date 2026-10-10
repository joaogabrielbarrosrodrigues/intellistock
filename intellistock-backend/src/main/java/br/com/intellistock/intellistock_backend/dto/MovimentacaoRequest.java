package br.com.intellistock.intellistock_backend.dto;

import br.com.intellistock.intellistock_backend.entity.TipoMovimentacao;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * @param data opcional; quando omitida usa o momento atual. Permite lancar movimentacoes retroativas.
 */
public record MovimentacaoRequest(
        @NotNull(message = "Produto e obrigatorio.")
        UUID produtoId,

        @NotNull(message = "Tipo e obrigatorio (ENTRADA ou SAIDA).")
        TipoMovimentacao tipo,

        @NotNull(message = "Quantidade e obrigatoria.")
        @Positive(message = "Quantidade deve ser maior que zero.")
        @Digits(integer = 12, fraction = 3, message = "Quantidade deve ter no maximo 3 casas decimais.")
        BigDecimal quantidade,

        @PastOrPresent(message = "Data nao pode estar no futuro.")
        OffsetDateTime data,

        @Size(max = 500, message = "Observacao deve ter no maximo 500 caracteres.")
        String observacao
) {
}
