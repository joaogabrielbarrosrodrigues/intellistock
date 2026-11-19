package br.com.intellistock.intellistock_backend.repository;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Título: Molde de resultado: total de saídas por produto
 * Explicação: Record molde com o id de um produto e a soma das saídas dele num intervalo.
 */
public record TotalPorProduto(UUID produtoId, BigDecimal total) {
}
