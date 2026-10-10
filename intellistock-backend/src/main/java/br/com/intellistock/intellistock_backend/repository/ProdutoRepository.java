package br.com.intellistock.intellistock_backend.repository;

import br.com.intellistock.intellistock_backend.entity.Produto;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProdutoRepository extends JpaRepository<Produto, UUID>, JpaSpecificationExecutor<Produto> {

    /**
     * Bloqueia a linha do produto ate o fim da transacao, evitando que duas saidas
     * simultaneas leiam o mesmo saldo e deixem o estoque negativo.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Produto p where p.id = :id")
    Optional<Produto> findByIdForUpdate(@Param("id") UUID id);

    List<Produto> findByAtivoTrueOrderByNomeAsc();

    @Query("select p from Produto p where p.ativo = true and p.quantidade <= p.estoqueMinimo order by p.nome")
    List<Produto> findEstoqueBaixo();

    long countByAtivoTrue();

    @Query("select count(p) from Produto p where p.ativo = true and p.quantidade <= p.estoqueMinimo")
    long countEstoqueBaixo();

    @Query("select count(p) from Produto p where p.ativo = true and p.quantidade = 0")
    long countSemEstoque();

    @Query("select coalesce(sum(p.quantidade * p.preco), 0) from Produto p where p.ativo = true")
    BigDecimal sumValorEstoque();

    boolean existsByFornecedorId(UUID fornecedorId);
}
