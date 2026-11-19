package br.com.intellistock.intellistock_backend.repository;

import br.com.intellistock.intellistock_backend.entity.Fornecedor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

/**
 * Título: Consultas da tabela fornecedores
 * Explicação: Repositório da tabela fornecedores. Todas as consultas são geradas pelo Spring a partir do
 *   nome do método.
 */
public interface FornecedorRepository extends JpaRepository<Fornecedor, UUID> {

    /**
     * Título: Consulta: verifica se o CNPJ já existe
     * Explicação: O Spring Data gera o SQL sozinho a partir do nome do método. Recebe cnpj (String). Devolve
     *   boolean. Usada por FornecedorService.
     */
    boolean existsByCnpj(String cnpj);

    /**
     * Título: Consulta: verifica se o CNPJ existe em outro fornecedor
     * Explicação: O Spring Data gera o SQL sozinho a partir do nome do método. Recebe cnpj (String) e id
     *   (UUID). Devolve boolean. Usada por FornecedorService.
     */
    boolean existsByCnpjAndIdNot(String cnpj, UUID id);

    /**
     * Título: Consulta: todos em ordem alfabética
     * Explicação: O Spring Data gera o SQL sozinho a partir do nome do método. Devolve List<Fornecedor>. Usada
     *   por FornecedorService.
     */
    List<Fornecedor> findAllByOrderByNomeAsc();

    /**
     * Título: Consulta: busca por parte do nome, sem diferenciar maiúsculas
     * Explicação: O Spring Data gera o SQL sozinho a partir do nome do método. Recebe nome (String). Devolve
     *   List<Fornecedor>. Usada por FornecedorService.
     */
    List<Fornecedor> findByNomeContainingIgnoreCaseOrderByNomeAsc(String nome);
}
