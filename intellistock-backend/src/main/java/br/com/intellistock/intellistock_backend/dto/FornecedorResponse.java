package br.com.intellistock.intellistock_backend.dto;

import br.com.intellistock.intellistock_backend.entity.Fornecedor;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Título: Dados devolvidos pela API: Fornecedor
 * Explicação: DTO de saída com um fornecedor completo.
 */
public record FornecedorResponse(UUID id, String nome, String cnpj, String telefone, String email,
                                 OffsetDateTime createdAt) {

    /**
     * Título: Converte a entidade neste DTO
     * Explicação: Recebe fornecedor (Fornecedor). Devolve FornecedorResponse.
     */
    public static FornecedorResponse from(Fornecedor fornecedor) {
        return new FornecedorResponse(
                fornecedor.getId(),
                fornecedor.getNome(),
                fornecedor.getCnpj(),
                fornecedor.getTelefone(),
                fornecedor.getEmail(),
                fornecedor.getCreatedAt()
        );
    }
}
