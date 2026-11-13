package br.com.intellistock.intellistock_backend.service;

import br.com.intellistock.intellistock_backend.dto.ReposicaoResponse.Prioridade;
import br.com.intellistock.intellistock_backend.dto.Tendencia;
import br.com.intellistock.intellistock_backend.entity.UnidadeMedida;

import java.math.BigDecimal;
import java.math.RoundingMode;

/** Calculo puro compartilhado pela sugestao detalhada e pela contagem do dashboard. */
record CalculoReposicao(BigDecimal consumoBase, BigDecimal minimoCalculado, BigDecimal estoqueSeguranca,
                        BigDecimal pontoPedido, BigDecimal necessidade, boolean precisaRepor) {

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

    BigDecimal quantidadeSugerida(UnidadeMedida unidade) {
        if (!precisaRepor) return BigDecimal.ZERO;
        // Itens contaveis usam inteiros; medidas continuas preservam tres casas.
        int escala = switch (unidade) {
            case UN, CX, PCT, FD -> 0;
            case KG, G, L, ML, M -> 3;
        };
        return necessidade.setScale(escala, RoundingMode.CEILING);
    }

    BigDecimal diasRestantes(BigDecimal estoqueAtual) {
        return consumoBase.signum() > 0
                ? estoqueAtual.divide(consumoBase, 1, RoundingMode.HALF_UP) : null;
    }

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
