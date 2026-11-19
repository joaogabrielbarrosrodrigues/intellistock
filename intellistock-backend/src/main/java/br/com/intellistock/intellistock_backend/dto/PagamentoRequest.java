package br.com.intellistock.intellistock_backend.dto;

import jakarta.validation.constraints.PastOrPresent;

import java.time.LocalDate;

/**
 * Título: Dados recebidos pela API: Pagamento
 * Explicação: DTO de entrada opcional do pagamento.
 *
 * @param dataPagamento opcional; quando omitida usa a data atual.
 */
public record PagamentoRequest(
        @PastOrPresent(message = "Data de pagamento nao pode estar no futuro.")
        LocalDate dataPagamento
) {
}
