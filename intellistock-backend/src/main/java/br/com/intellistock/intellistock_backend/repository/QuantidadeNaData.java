package br.com.intellistock.intellistock_backend.repository;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record QuantidadeNaData(OffsetDateTime data, BigDecimal quantidade) {
}
