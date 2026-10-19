package br.com.intellistock.intellistock_backend.dto;

import br.com.intellistock.intellistock_backend.entity.UnidadeMedida;

import java.util.List;

/**
 * Serie temporal de consumo de produtos que compartilham a mesma unidade de medida.
 * Quantidades de unidades incompatíveis nunca são somadas entre si.
 */
public record ConsumoPorUnidadeResponse(
        UnidadeMedida unidadeMedida,
        List<ConsumoSerieResponse.Ponto> pontos
) {
}
