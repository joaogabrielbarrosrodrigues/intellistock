package br.com.intellistock.intellistock_backend.config;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;
import org.springframework.validation.annotation.Validated;

/**
 * Parametros padrao das analises de consumo e da sugestao de reposicao.
 * Janela, cobertura, entrega e seguranca podem ser sobrescritos por query params.
 *
 * @param diasAnalise               janela de historico usada para calcular o consumo medio
 * @param diasCobertura             quantos dias de consumo a compra sugerida deve cobrir
 * @param prazoEntregaDias          tempo medio entre o pedido e a chegada do produto
 * @param diasSeguranca             dias de consumo mantidos como estoque de seguranca
 * @param limiarTendenciaPercentual variacao minima (%) entre as metades do periodo para indicar ALTA ou BAIXA
 */
@ConfigurationProperties(prefix = "app.analise")
@Validated
public record AnaliseProperties(
        @DefaultValue("30") @Min(1) @Max(365) int diasAnalise,
        @DefaultValue("30") @Min(1) @Max(365) int diasCobertura,
        @DefaultValue("7") @Min(0) @Max(365) int prazoEntregaDias,
        @DefaultValue("7") @Min(0) @Max(365) int diasSeguranca,
        @DefaultValue("10") @Min(1) int limiarTendenciaPercentual
) {
}
