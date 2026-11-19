package br.com.intellistock.intellistock_backend.service;

import br.com.intellistock.intellistock_backend.dto.ReposicaoResponse.Prioridade;
import br.com.intellistock.intellistock_backend.dto.Tendencia;
import br.com.intellistock.intellistock_backend.entity.UnidadeMedida;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Título: Cálculo da sugestão de compra
 * Explicação: Classe de cálculo puro (um record) com a matemática da sugestão de compra. Não acessa banco
 *   nem outras classes, o que a deixa fácil de testar.
 *
 * Calculo puro compartilhado pela sugestao detalhada e pela contagem do dashboard.
 */
record CalculoReposicao(BigDecimal consumoBase, BigDecimal minimoCalculado, BigDecimal estoqueSeguranca,
                        BigDecimal pontoPedido, BigDecimal necessidade, boolean precisaRepor) {

    /**
     * Título: Faz o cálculo principal e devolve todos os números
     * Explicação: Recebe estoqueAtual (BigDecimal), estoqueMinimo (BigDecimal), mediaDiaria (BigDecimal),
     *   mediaRecente (BigDecimal), tendencia (Tendencia), diasCobertura (int), prazoEntrega (int) e
     *   diasSeguranca (int). Consumo base = média diária (ou a recente, se o consumo está em alta e ela é
     *   maior); estoque de segurança = o maior entre o mínimo cadastrado e consumo × dias de segurança; ponto de
     *   pedido = consumo × prazo de entrega + segurança; necessidade = consumo × (cobertura + prazo) + segurança
     *   − saldo; precisa repor quando o saldo está no ponto de pedido ou abaixo. Devolve CalculoReposicao.
     */
    static CalculoReposicao calcular(BigDecimal estoqueAtual, BigDecimal estoqueMinimo,
                                     BigDecimal mediaDiaria, BigDecimal mediaRecente, Tendencia tendencia,
                                     int diasCobertura, int prazoEntrega, int diasSeguranca) {
        BigDecimal base = tendencia == Tendencia.ALTA ? mediaDiaria.max(mediaRecente) : mediaDiaria;
        BigDecimal minimoCalculado = base.multiply(BigDecimal.valueOf(diasSeguranca))
                .setScale(3, RoundingMode.HALF_UP);
        BigDecimal seguranca = estoqueMinimo.max(minimoCalculado);
        BigDecimal pontoPedido = base.multiply(BigDecimal.valueOf(prazoEntrega)).add(seguranca)
                .setScale(3, RoundingMode.HALF_UP);
        BigDecimal necessidade = base.multiply(BigDecimal.valueOf((long) diasCobertura + prazoEntrega))
                .add(seguranca).subtract(estoqueAtual).max(BigDecimal.ZERO);
        boolean precisaRepor = estoqueAtual.compareTo(pontoPedido) <= 0 && necessidade.signum() > 0;
        return new CalculoReposicao(base, minimoCalculado, seguranca, pontoPedido, necessidade, precisaRepor);
    }

    /**
     * Título: Arredonda a necessidade para cima: inteiro para itens contáveis, 3 casas para medidas
     * Explicação: Recebe unidade (UnidadeMedida). Arredonda a necessidade para cima; inteiro para UN, CX, PCT
     *   e FD, até 3 casas para KG, G, L, ML e M. Devolve BigDecimal.
     */
    BigDecimal quantidadeSugerida(UnidadeMedida unidade) {
        if (!precisaRepor) return BigDecimal.ZERO;
        // Itens contaveis usam inteiros; medidas continuas preservam tres casas.
        int escala = switch (unidade) {
            case UN, CX, PCT, FD -> 0;
            case KG, G, L, ML, M -> 3;
        };
        return necessidade.setScale(escala, RoundingMode.CEILING);
    }

    /**
     * Título: Quantos dias o saldo dura no ritmo atual
     * Explicação: Recebe estoqueAtual (BigDecimal). Saldo ÷ consumo diário; sem consumo, não há estimativa.
     *   Devolve BigDecimal.
     */
    BigDecimal diasRestantes(BigDecimal estoqueAtual) {
        return consumoBase.signum() > 0
                ? estoqueAtual.divide(consumoBase, 1, RoundingMode.HALF_UP) : null;
    }

    /**
     * Título: ALTA se vai faltar antes da entrega, MEDIA se abaixo da segurança, BAIXA nos demais casos
     * Explicação: Recebe estoqueAtual (BigDecimal) e prazoEntrega (int). ALTA se o saldo é zero ou acaba antes
     *   da entrega; MEDIA se já está abaixo da segurança; BAIXA nos demais casos que precisam de compra. Devolve
     *   Prioridade.
     */
    Prioridade prioridade(BigDecimal estoqueAtual, int prazoEntrega) {
        if (!precisaRepor) return Prioridade.NENHUMA;
        BigDecimal diasRestantes = diasRestantes(estoqueAtual);
        if (estoqueAtual.signum() == 0
                || (diasRestantes != null && diasRestantes.compareTo(BigDecimal.valueOf(prazoEntrega)) <= 0)) {
            return Prioridade.ALTA;
        }
        return estoqueAtual.compareTo(estoqueSeguranca) <= 0 ? Prioridade.MEDIA : Prioridade.BAIXA;
    }
}
