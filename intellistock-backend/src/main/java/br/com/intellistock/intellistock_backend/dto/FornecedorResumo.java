package br.com.intellistock.intellistock_backend.dto;

import br.com.intellistock.intellistock_backend.entity.Fornecedor;

import java.util.UUID;

public record FornecedorResumo(UUID id, String nome) {

    public static FornecedorResumo from(Fornecedor fornecedor) {
        return fornecedor == null ? null : new FornecedorResumo(fornecedor.getId(), fornecedor.getNome());
    }
}
