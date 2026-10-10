package br.com.intellistock.intellistock_backend.dto;

import br.com.intellistock.intellistock_backend.entity.UnidadeMedida;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * @param quantidadeInicial usado apenas no cadastro; gera uma movimentacao de ENTRADA.
 *                          Na atualizacao e ignorado, pois o saldo so muda via movimentacoes.
 */
public record ProdutoRequest(
        @NotBlank(message = "Nome e obrigatorio.")
        @Size(max = 150, message = "Nome deve ter no maximo 150 caracteres.")
        String nome,

        @Size(max = 500, message = "Descricao deve ter no maximo 500 caracteres.")
        String descricao,

        @PositiveOrZero(message = "Quantidade inicial nao pode ser negativa.")
        @Digits(integer = 12, fraction = 3, message = "Quantidade inicial deve ter no maximo 3 casas decimais.")
        BigDecimal quantidadeInicial,

        @NotNull(message = "Estoque minimo e obrigatorio.")
        @PositiveOrZero(message = "Estoque minimo nao pode ser negativo.")
        @Digits(integer = 12, fraction = 3, message = "Estoque minimo deve ter no maximo 3 casas decimais.")
        BigDecimal estoqueMinimo,

        @NotNull(message = "Unidade de medida e obrigatoria.")
        UnidadeMedida unidadeMedida,

        @NotNull(message = "Preco e obrigatorio.")
        @PositiveOrZero(message = "Preco nao pode ser negativo.")
        @Digits(integer = 13, fraction = 2, message = "Preco deve ter no maximo 2 casas decimais.")
        BigDecimal preco,

        UUID fornecedorId
) {
}
