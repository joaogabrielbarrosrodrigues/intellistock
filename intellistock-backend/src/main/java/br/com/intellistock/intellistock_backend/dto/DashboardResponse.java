package br.com.intellistock.intellistock_backend.dto;

import java.math.BigDecimal;
import java.util.List;

public record DashboardResponse(
        Estoque estoque,
        Financeiro financeiro,
        long sugestoesReposicao,
        List<MovimentacaoResponse> movimentacoesRecentes,
        List<ContaPagarResponse> contasProximasVencimento,
        List<ConsumoPorUnidadeResponse> consumoMensal
) {

    public record Estoque(
            long totalProdutos,
            long produtosEstoqueBaixo,
            long produtosSemEstoque,
            BigDecimal valorTotalEstoque,
            long totalFornecedores
    ) {
    }

    /**
     * @param contasPendentes contas em aberto que ainda nao venceram
     * @param valorEmAberto   soma de pendentes + vencidas
     */
    public record Financeiro(
            long contasPendentes,
            long contasVencidas,
            BigDecimal valorEmAberto,
            BigDecimal valorVencido,
            long contasProximasVencimento,
            BigDecimal valorProximasVencimento
    ) {
    }
}
