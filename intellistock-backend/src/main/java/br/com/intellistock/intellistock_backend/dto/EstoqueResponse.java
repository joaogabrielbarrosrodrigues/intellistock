package br.com.intellistock.intellistock_backend.dto;

import br.com.intellistock.intellistock_backend.entity.Produto;
import br.com.intellistock.intellistock_backend.entity.UnidadeMedida;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.UUID;

/**
 * Título: Dados devolvidos pela API: Estoque
 * Explicação: DTO de saída com uma linha da visão de estoque.
 */
public record EstoqueResponse(
        UUID produtoId,
        String produtoNome,
        UnidadeMedida unidadeMedida,
        BigDecimal quantidade,
        BigDecimal estoqueMinimo,
        SituacaoEstoque situacao,
        BigDecimal valorEmEstoque
) {

    public enum SituacaoEstoque {
        NORMAL,
        BAIXO,
        ZERADO
    }

    /**
     * Título: Converte a entidade neste DTO
     * Explicação: Recebe produto (Produto). Devolve EstoqueResponse.
     */
    public static EstoqueResponse from(Produto produto) {
        return new EstoqueResponse(
                produto.getId(),
                produto.getNome(),
                produto.getUnidadeMedida(),
                produto.getQuantidade(),
                produto.getEstoqueMinimo(),
                situacao(produto),
                produto.getQuantidade().multiply(produto.getPreco()).setScale(2, RoundingMode.HALF_UP)
        );
    }

    /**
     * Título: situacao
     * Explicação: Recebe produto (Produto). Devolve SituacaoEstoque.
     */
    private static SituacaoEstoque situacao(Produto produto) {
        if (produto.getQuantidade().signum() == 0) {
            return SituacaoEstoque.ZERADO;
        }
        return produto.isEstoqueBaixo() ? SituacaoEstoque.BAIXO : SituacaoEstoque.NORMAL;
    }
}
