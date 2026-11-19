package br.com.intellistock.intellistock_backend.dto;

import br.com.intellistock.intellistock_backend.entity.UnidadeMedida;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Título: Dados devolvidos pela API: Consumo
 * Explicação: DTO de saída da análise de consumo de um produto.
 *
 * Consumo (soma das SAIDAS) de um produto em uma janela de dias.
 *
 * @param mediaDiaria        totalConsumido / periodoDias
 * @param mediaSemanal       mediaDiaria x 7
 * @param mediaMensal        mediaDiaria x 30
 * @param mediaDiariaRecente media diaria apenas na metade mais recente do periodo
 * @param variacaoPercentual variacao da media diaria da metade recente sobre a metade antiga;
 *                           null quando a metade antiga nao teve consumo
 */
public record ConsumoResponse(
        UUID produtoId,
        String produtoNome,
        UnidadeMedida unidadeMedida,
        int periodoDias,
        LocalDate dataInicio,
        LocalDate dataFim,
        BigDecimal totalConsumido,
        BigDecimal mediaDiaria,
        BigDecimal mediaSemanal,
        BigDecimal mediaMensal,
        BigDecimal mediaDiariaRecente,
        Tendencia tendencia,
        BigDecimal variacaoPercentual
) {
}
