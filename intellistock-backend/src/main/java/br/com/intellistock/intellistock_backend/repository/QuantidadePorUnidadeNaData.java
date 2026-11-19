package br.com.intellistock.intellistock_backend.repository;

import br.com.intellistock.intellistock_backend.entity.UnidadeMedida;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

/**
 * Título: Molde de resultado: data, unidade e quantidade
 * Explicação: Record molde com data, unidade de medida e quantidade de uma saída.
 */
public record QuantidadePorUnidadeNaData(
        OffsetDateTime data,
        UnidadeMedida unidadeMedida,
        BigDecimal quantidade
) {
}
