package br.com.intellistock.intellistock_backend.entity;

/**
 * Título: Situações possíveis de uma conta
 * Explicação: Enum (lista fixa de valores) com as situações possíveis de uma conta.
 *
 * Apenas PENDENTE, PAGA e CANCELADA sao persistidos.
 * VENCIDA e derivado: conta PENDENTE com vencimento anterior a data atual.
 */
public enum StatusConta {
    PENDENTE,
    VENCIDA,
    PAGA,
    CANCELADA
}
