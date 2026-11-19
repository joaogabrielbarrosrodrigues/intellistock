package br.com.intellistock.intellistock_backend.dto;

import br.com.intellistock.intellistock_backend.entity.Fornecedor;

import java.util.UUID;

/**
 * Título: Dados devolvidos pela API: Fornecedor
 * Explicação: DTO de saída curto com só o id e o nome do fornecedor.
 */
public record FornecedorResumo(UUID id, String nome) {

    /**
     * Título: Converte a entidade neste DTO
     * Explicação: Recebe fornecedor (Fornecedor). Devolve FornecedorResumo.
     */
    public static FornecedorResumo from(Fornecedor fornecedor) {
        return fornecedor == null ? null : new FornecedorResumo(fornecedor.getId(), fornecedor.getNome());
    }
}
