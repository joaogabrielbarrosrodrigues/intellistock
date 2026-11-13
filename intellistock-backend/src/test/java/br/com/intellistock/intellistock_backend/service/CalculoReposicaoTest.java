package br.com.intellistock.intellistock_backend.service;

import br.com.intellistock.intellistock_backend.dto.ReposicaoResponse.Prioridade;
import br.com.intellistock.intellistock_backend.dto.Tendencia;
import br.com.intellistock.intellistock_backend.entity.UnidadeMedida;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

class CalculoReposicaoTest {
    @Test
    void calculaExemploEstavelComSegurancaBaseadaNoConsumo() {
        var calculo = calcular("20", "10", "2", "2", Tendencia.ESTAVEL);
        assertThat(calculo.estoqueSeguranca()).isEqualByComparingTo("14");
        assertThat(calculo.pontoPedido()).isEqualByComparingTo("28");
        assertThat(calculo.quantidadeSugerida(UnidadeMedida.UN)).isEqualByComparingTo("68");
        assertThat(calculo.diasRestantes(decimal("20"))).isEqualByComparingTo("10.0");
        assertThat(calculo.prioridade(decimal("20"), 7)).isEqualTo(Prioridade.BAIXA);
    }

    @Test
    void tendenciaDeAltaUsaAMaiorMediaSemReduzirABase() {
        assertThat(calcular("80", "10", "4", "6", Tendencia.ALTA).consumoBase())
                .isEqualByComparingTo("6");
        assertThat(calcular("80", "10", "6", "4", Tendencia.ALTA).consumoBase())
                .isEqualByComparingTo("6");
        assertThat(calcular("80", "10", "4", "6", Tendencia.ESTAVEL).consumoBase())
                .isEqualByComparingTo("4");
    }

    @Test
    void semConsumoRepoeApenasOQueFaltaAteOMinimo() {
        var abaixo = calcular("1", "5", "0", "0", Tendencia.ESTAVEL);
        assertThat(abaixo.quantidadeSugerida(UnidadeMedida.UN)).isEqualByComparingTo("4");
        assertThat(abaixo.diasRestantes(decimal("1"))).isNull();
        assertThat(abaixo.prioridade(decimal("1"), 7)).isEqualTo(Prioridade.MEDIA);
        var noMinimo = calcular("5", "5", "0", "0", Tendencia.ESTAVEL);
        assertThat(noMinimo.precisaRepor()).isFalse();
        assertThat(noMinimo.quantidadeSugerida(UnidadeMedida.UN)).isEqualByComparingTo("0");
    }

    @Test
    void arredondaParaCimaDeAcordoComAUnidade() {
        var calculo = CalculoReposicao.calcular(decimal("0.667"), decimal("1"), decimal("0.3334"),
                decimal("0.3334"), Tendencia.ESTAVEL, 1, 0, 0);
        assertThat(calculo.quantidadeSugerida(UnidadeMedida.UN)).isEqualByComparingTo("1");
        assertThat(calculo.quantidadeSugerida(UnidadeMedida.KG)).isEqualByComparingTo("0.667");
    }

    @Test
    void naoSugereCompraAntesDoPontoDePedidoMesmoComNecessidadeFutura() {
        var calculo = calcular("40", "10", "2", "2", Tendencia.ESTAVEL);
        assertThat(calculo.necessidade()).isPositive();
        assertThat(calculo.precisaRepor()).isFalse();
        assertThat(calculo.quantidadeSugerida(UnidadeMedida.UN)).isEqualByComparingTo("0");
        assertThat(calculo.prioridade(decimal("40"), 7)).isEqualTo(Prioridade.NENHUMA);
    }

    @Test
    void priorizaFaltaDeEstoqueOuCoberturaMenorQuePrazoDeEntrega() {
        assertThat(calcular("0", "10", "2", "2", Tendencia.ESTAVEL)
                .prioridade(BigDecimal.ZERO, 7)).isEqualTo(Prioridade.ALTA);
        assertThat(calcular("14", "10", "2", "2", Tendencia.ESTAVEL)
                .prioridade(decimal("14"), 7)).isEqualTo(Prioridade.ALTA);
    }

    private static CalculoReposicao calcular(String estoque, String minimo, String media, String recente,
                                              Tendencia tendencia) {
        return CalculoReposicao.calcular(decimal(estoque), decimal(minimo), decimal(media), decimal(recente),
                tendencia, 30, 7, 7);
    }

    private static BigDecimal decimal(String valor) {
        return new BigDecimal(valor);
    }
}
