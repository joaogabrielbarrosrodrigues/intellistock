package br.com.intellistock.intellistock_backend.repository;

import br.com.intellistock.intellistock_backend.entity.Fornecedor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface FornecedorRepository extends JpaRepository<Fornecedor, UUID> {

    boolean existsByCnpj(String cnpj);

    boolean existsByCnpjAndIdNot(String cnpj, UUID id);

    List<Fornecedor> findAllByOrderByNomeAsc();

    List<Fornecedor> findByNomeContainingIgnoreCaseOrderByNomeAsc(String nome);
}
