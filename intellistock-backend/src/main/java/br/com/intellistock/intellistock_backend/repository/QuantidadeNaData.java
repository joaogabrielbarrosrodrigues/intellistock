package br.com.intellistock.intellistock_backend.repository;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

/**
 * Título: Molde de resultado: data e quantidade
 * Explicação: Record simples usado como molde para receber o resultado de uma consulta: uma data e uma
 *   quantidade.
 */
public record QuantidadeNaData(OffsetDateTime data, BigDecimal quantidade) {
}
