package br.com.intellistock.intellistock_backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

/**
 * Parametros padrao das analises de consumo e da sugestao de reposicao.
 * Todos podem ser sobrescritos por query params nos endpoints de analise.
 *
 * @param diasAnalise               janela de historico usada para calcular o consumo medio
 * @param diasCobertura             quantos dias de consumo a compra sugerida deve cobrir
 * @param prazoEntregaDias          tempo medio entre o pedido e a chegada do produto
 * @param diasSeguranca             dias de consumo mantidos como estoque de seguranca
 * @param limiarTendenciaPercentual variacao minima (%) entre as metades do periodo para indicar ALTA ou BAIXA
 */
@ConfigurationProperties(prefix = "app.analise")
public record AnaliseProperties(
        @DefaultValue("30") int diasAnalise,
        @DefaultValue("30") int diasCobertura,
        @DefaultValue("7") int prazoEntregaDias,
        @DefaultValue("7") int diasSeguranca,
        @DefaultValue("10") int limiarTendenciaPercentual
) {
}
