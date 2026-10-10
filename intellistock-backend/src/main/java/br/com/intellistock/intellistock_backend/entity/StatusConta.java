package br.com.intellistock.intellistock_backend.entity;

/**
 * Apenas PENDENTE, PAGA e CANCELADA sao persistidos.
 * VENCIDA e derivado: conta PENDENTE com vencimento anterior a data atual.
 */
public enum StatusConta {
    PENDENTE,
    VENCIDA,
    PAGA,
    CANCELADA
}
