package br.com.intellistock.intellistock_backend.dto;

import br.com.intellistock.intellistock_backend.entity.UnidadeMedida;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Sugestao de reposicao de um produto.
 *
 * @param consumoBaseDiario       consumo diario usado no calculo (media recente quando a tendencia e de ALTA)
 * @param estoqueMinimoCalculado  consumoBaseDiario x diasSeguranca
 * @param estoqueSeguranca        maior valor entre o minimo cadastrado e o calculado
 * @param pontoPedido             consumoBaseDiario x prazoEntrega + estoqueSeguranca
 * @param diasRestantes           estimativa de dias ate zerar; null quando nao ha consumo
 * @param quantidadeSugerida      consumoBaseDiario x (diasCobertura + prazoEntrega) + estoqueSeguranca - estoqueAtual,
 *                                arredondada para cima
 * @param totalConsumido          saidas registradas na janela analisada
 * @param periodoAnaliseDias      tamanho da janela; nao garante historico representativo
 * @param diasCobertura           dias de consumo planejados alem do prazo de entrega
 * @param prazoEntregaDias        prazo de entrega usado nesta sugestao
 * @param diasSeguranca           dias usados no calculo do estoque de seguranca
 */
public record ReposicaoResponse(
        UUID produtoId,
        String produtoNome,
        UnidadeMedida unidadeMedida,
        FornecedorResumo fornecedor,
        BigDecimal estoqueAtual,
        BigDecimal estoqueMinimoCadastrado,
        BigDecimal consumoMedioDiario,
        BigDecimal consumoBaseDiario,
        Tendencia tendencia,
        BigDecimal estoqueMinimoCalculado,
        BigDecimal estoqueSeguranca,
        BigDecimal pontoPedido,
        BigDecimal diasRestantes,
        boolean precisaRepor,
        BigDecimal quantidadeSugerida,
        BigDecimal custoEstimado,
        Prioridade prioridade,
        BigDecimal totalConsumido,
        int periodoAnaliseDias,
        int diasCobertura,
        int prazoEntregaDias,
        int diasSeguranca
) {

    public enum Prioridade {
        ALTA,
        MEDIA,
        BAIXA,
        NENHUMA
    }
}
