package br.com.intellistock.intellistock_backend.dto;

import br.com.intellistock.intellistock_backend.entity.UnidadeMedida;

import java.util.List;

/**
 * Título: Dados devolvidos pela API: ConsumoPorUnidade
 * Explicação: DTO de saída com a série mensal de consumo de uma unidade de medida.
 *
 * Serie temporal de consumo de produtos que compartilham a mesma unidade de medida.
 * Quantidades de unidades incompatíveis nunca são somadas entre si.
 */
public record ConsumoPorUnidadeResponse(
        UnidadeMedida unidadeMedida,
        List<ConsumoSerieResponse.Ponto> pontos
) {
}
