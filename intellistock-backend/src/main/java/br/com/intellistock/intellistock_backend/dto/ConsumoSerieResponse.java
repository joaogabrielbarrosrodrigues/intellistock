package br.com.intellistock.intellistock_backend.dto;

import br.com.intellistock.intellistock_backend.entity.UnidadeMedida;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Título: Dados devolvidos pela API: ConsumoSerie
 * Explicação: DTO de saída de uma série de consumo para gráficos.
 *
 * Serie temporal de consumo, pronta para graficos.
 *
 * @param produtoId null quando a serie consolida produtos de uma mesma unidade de medida
 */
public record ConsumoSerieResponse(
        UUID produtoId,
        String produtoNome,
        UnidadeMedida unidadeMedida,
        Agrupamento agrupamento,
        List<Ponto> pontos
) {

    public enum Agrupamento {
        DIARIO,
        SEMANAL,
        MENSAL
    }

    public record Ponto(LocalDate inicio, LocalDate fim, BigDecimal quantidade) {
    }
}
