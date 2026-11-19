package br.com.intellistock.intellistock_backend.dto;

import br.com.intellistock.intellistock_backend.entity.ContaPagar;
import br.com.intellistock.intellistock_backend.entity.StatusConta;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

/**
 * Título: Dados devolvidos pela API: ContaPagar
 * Explicação: DTO de saída de uma conta.
 *
 * @param diasParaVencimento negativo quando vencida; null para contas pagas ou canceladas.
 */
public record ContaPagarResponse(
        UUID id,
        FornecedorResumo fornecedor,
        String descricao,
        BigDecimal valor,
        LocalDate dataVencimento,
        LocalDate dataPagamento,
        StatusConta status,
        Long diasParaVencimento,
        String observacao,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {

    /**
     * Título: Converte a entidade neste DTO
     * Explicação: Recebe conta (ContaPagar) e hoje (LocalDate). Devolve ContaPagarResponse.
     */
    public static ContaPagarResponse from(ContaPagar conta, LocalDate hoje) {
        boolean emAberto = conta.getStatus() == StatusConta.PENDENTE;
        return new ContaPagarResponse(
                conta.getId(),
                FornecedorResumo.from(conta.getFornecedor()),
                conta.getDescricao(),
                conta.getValor(),
                conta.getDataVencimento(),
                conta.getDataPagamento(),
                conta.getStatusEfetivo(hoje),
                emAberto ? ChronoUnit.DAYS.between(hoje, conta.getDataVencimento()) : null,
                conta.getObservacao(),
                conta.getCreatedAt(),
                conta.getUpdatedAt()
        );
    }
}
