package br.com.intellistock.intellistock_backend.dto;

import br.com.intellistock.intellistock_backend.entity.Produto;
import br.com.intellistock.intellistock_backend.entity.UnidadeMedida;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Título: Dados devolvidos pela API: Produto
 * Explicação: DTO de saída com um produto.
 */
public record ProdutoResponse(
        UUID id,
        String nome,
        String descricao,
        BigDecimal quantidade,
        BigDecimal estoqueMinimo,
        UnidadeMedida unidadeMedida,
        BigDecimal preco,
        FornecedorResumo fornecedor,
        boolean ativo,
        boolean estoqueBaixo,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {

    /**
     * Título: Converte a entidade neste DTO
     * Explicação: Recebe produto (Produto). Devolve ProdutoResponse.
     */
    public static ProdutoResponse from(Produto produto) {
        return new ProdutoResponse(
                produto.getId(),
                produto.getNome(),
                produto.getDescricao(),
                produto.getQuantidade(),
                produto.getEstoqueMinimo(),
                produto.getUnidadeMedida(),
                produto.getPreco(),
                FornecedorResumo.from(produto.getFornecedor()),
                produto.isAtivo(),
                produto.isEstoqueBaixo(),
                produto.getCreatedAt(),
                produto.getUpdatedAt()
        );
    }
}
