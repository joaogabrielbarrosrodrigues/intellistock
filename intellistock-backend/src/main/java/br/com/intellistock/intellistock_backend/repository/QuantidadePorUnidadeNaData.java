package br.com.intellistock.intellistock_backend.repository;

import br.com.intellistock.intellistock_backend.entity.UnidadeMedida;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record QuantidadePorUnidadeNaData(
        OffsetDateTime data,
        UnidadeMedida unidadeMedida,
        BigDecimal quantidade
) {
}
