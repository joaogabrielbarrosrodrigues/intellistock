package br.com.intellistock.intellistock_backend.repository;

import br.com.intellistock.intellistock_backend.entity.Produto;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Título: Consultas da tabela produtos
 * Explicação: Repositório da tabela produtos.
 */
public interface ProdutoRepository extends JpaRepository<Produto, UUID>, JpaSpecificationExecutor<Produto> {

    /**
     * Título: Consulta: busca pelo id travando a linha (SELECT ... FOR UPDATE)
     * Explicação: Executa a consulta JPQL escrita acima. Recebe id (UUID). Devolve Optional<Produto>. Usada
     *   por MovimentacaoService e ProdutoService.
     *
     * Bloqueia a linha do produto ate o fim da transacao, evitando que duas saidas
     * simultaneas leiam o mesmo saldo e deixem o estoque negativo.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Produto p where p.id = :id")
    Optional<Produto> findByIdForUpdate(@Param("id") UUID id);

    /**
     * Título: Consulta: produtos ativos em ordem alfabética
     * Explicação: O Spring Data gera o SQL sozinho a partir do nome do método. Devolve List<Produto>. Usada
     *   por AnaliseService e EstoqueService.
     */
    @EntityGraph(attributePaths = "fornecedor")
    List<Produto> findByAtivoTrueOrderByNomeAsc();

    /**
     * Título: Consulta: produtos ativos, sem ordenação nem fornecedor, para as análises
     * Explicação: Executa a consulta JPQL escrita acima. Devolve List<Produto>. Usada por AnaliseService.
     */
    // A contagem analitica nao precisa de ordenacao nem de fornecedores.
    @Query("select p from Produto p where p.ativo = true")
    List<Produto> findAtivosParaAnalise();

    /**
     * Título: Consulta: busca com filtros, trazendo os relacionamentos junto
     * Explicação: Substitui o findAll padrão do Spring Data para já trazer os relacionamentos (EntityGraph) e
     *   evitar várias consultas extras. Recebe spec (Specification<Produto>) e sort (Sort). Devolve
     *   List<Produto>. Usada por ProdutoService.
     */
    @Override
    @EntityGraph(attributePaths = "fornecedor")
    List<Produto> findAll(Specification<Produto> spec, Sort sort);

    /**
     * Título: Consulta: produtos ativos com saldo menor ou igual ao mínimo
     * Explicação: Executa a consulta JPQL escrita acima. Devolve List<Produto>. Usada por EstoqueService.
     */
    @Query("select p from Produto p where p.ativo = true and p.quantidade <= p.estoqueMinimo order by p.nome")
    List<Produto> findEstoqueBaixo();

    /**
     * Título: Consulta: conta os produtos ativos
     * Explicação: O Spring Data gera o SQL sozinho a partir do nome do método. Devolve long. Usada por
     *   DashboardService.
     */
    long countByAtivoTrue();

    /**
     * Título: Consulta: conta os produtos com estoque baixo
     * Explicação: Executa a consulta JPQL escrita acima. Devolve long. Usada por DashboardService.
     */
    @Query("select count(p) from Produto p where p.ativo = true and p.quantidade <= p.estoqueMinimo")
    long countEstoqueBaixo();

    /**
     * Título: Consulta: conta os produtos com saldo zero
     * Explicação: Executa a consulta JPQL escrita acima. Devolve long. Usada por DashboardService.
     */
    @Query("select count(p) from Produto p where p.ativo = true and p.quantidade = 0")
    long countSemEstoque();

    /**
     * Título: Consulta: soma saldo × preço dos produtos ativos
     * Explicação: Executa a consulta JPQL escrita acima. Devolve BigDecimal. Usada por DashboardService.
     */
    @Query("select coalesce(sum(p.quantidade * p.preco), 0) from Produto p where p.ativo = true")
    BigDecimal sumValorEstoque();

    /**
     * Título: Consulta: verifica se algum registro aponta para o fornecedor
     * Explicação: O Spring Data gera o SQL sozinho a partir do nome do método. Recebe fornecedorId (UUID).
     *   Devolve boolean. Usada por FornecedorService.
     */
    boolean existsByFornecedorId(UUID fornecedorId);
}
