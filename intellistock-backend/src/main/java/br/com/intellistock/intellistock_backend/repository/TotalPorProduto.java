package br.com.intellistock.intellistock_backend.repository;

import java.math.BigDecimal;
import java.util.UUID;

public record TotalPorProduto(UUID produtoId, BigDecimal total) {
}
