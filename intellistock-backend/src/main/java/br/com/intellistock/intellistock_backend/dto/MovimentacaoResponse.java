package br.com.intellistock.intellistock_backend.dto;

import br.com.intellistock.intellistock_backend.entity.Movimentacao;
import br.com.intellistock.intellistock_backend.entity.TipoMovimentacao;
import br.com.intellistock.intellistock_backend.entity.User;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Título: Dados devolvidos pela API: Movimentacao
 * Explicação: DTO de saída de uma movimentação.
 */
public record MovimentacaoResponse(
        UUID id,
        UUID produtoId,
        String produtoNome,
        TipoMovimentacao tipo,
        BigDecimal quantidade,
        BigDecimal saldoResultante,
        OffsetDateTime data,
        String observacao,
        UUID usuarioId,
        String usuarioNome
) {

    /**
     * Título: Converte a entidade neste DTO
     * Explicação: Recebe movimentacao (Movimentacao). Devolve MovimentacaoResponse.
     */
    public static MovimentacaoResponse from(Movimentacao movimentacao) {
        User usuario = movimentacao.getUsuario();
        return new MovimentacaoResponse(
                movimentacao.getId(),
                movimentacao.getProduto().getId(),
                movimentacao.getProduto().getNome(),
                movimentacao.getTipo(),
                movimentacao.getQuantidade(),
                movimentacao.getSaldoResultante(),
                movimentacao.getData(),
                movimentacao.getObservacao(),
                usuario == null ? null : usuario.getId(),
                usuario == null ? null : usuario.getNome()
        );
    }
}
