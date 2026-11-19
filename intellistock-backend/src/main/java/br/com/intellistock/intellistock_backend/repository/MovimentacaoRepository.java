package br.com.intellistock.intellistock_backend.repository;

import br.com.intellistock.intellistock_backend.entity.Movimentacao;
import br.com.intellistock.intellistock_backend.entity.TipoMovimentacao;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.OffsetDateTime;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * Título: Consultas da tabela movimentacoes
 * Explicação: Repositório da tabela movimentacoes, com consultas escritas à mão (JPQL) para as somas das
 *   análises.
 */
public interface MovimentacaoRepository extends JpaRepository<Movimentacao, UUID>, JpaSpecificationExecutor<Movimentacao> {

    /**
     * Título: Consulta: verifica se o produto já teve movimentação
     * Explicação: O Spring Data gera o SQL sozinho a partir do nome do método. Recebe produtoId (UUID).
     *   Devolve boolean. Usada por ProdutoService.
     */
    boolean existsByProdutoId(UUID produtoId);

    /**
     * Título: Consulta: busca com filtros, trazendo os relacionamentos junto
     * Explicação: Substitui o findAll padrão do Spring Data para já trazer os relacionamentos (EntityGraph) e
     *   evitar várias consultas extras. Recebe spec (Specification<Movimentacao>) e pageable (Pageable). Devolve
     *   Page<Movimentacao>. Usada por MovimentacaoService.
     */
    // A resposta inclui produto e usuario; carregue-os na consulta para evitar consultas extras por item.
    @Override
    @EntityGraph(attributePaths = {"produto", "usuario"})
    Page<Movimentacao> findAll(Specification<Movimentacao> spec, Pageable pageable);

    /**
     * Título: Consulta: soma as movimentações de um tipo por produto num intervalo
     * Explicação: Executa a consulta JPQL escrita acima. Recebe tipo (TipoMovimentacao), inicio
     *   (OffsetDateTime) e fim (OffsetDateTime). Devolve List<TotalPorProduto>. Usada por AnaliseService.
     */
    @Query("""
            select new br.com.intellistock.intellistock_backend.repository.TotalPorProduto(
                m.produto.id, sum(m.quantidade))
            from Movimentacao m
            where m.tipo = :tipo and m.data >= :inicio and m.data < :fim
            group by m.produto.id
            """)
    List<TotalPorProduto> sumPorProduto(@Param("tipo") TipoMovimentacao tipo,
                                        @Param("inicio") OffsetDateTime inicio,
                                        @Param("fim") OffsetDateTime fim);

    /**
     * Título: Consulta: soma as movimentações de um tipo de um produto num intervalo
     * Explicação: Executa a consulta JPQL escrita acima. Recebe produtoId (UUID), tipo (TipoMovimentacao),
     *   inicio (OffsetDateTime) e fim (OffsetDateTime). Devolve BigDecimal. Usada por AnaliseService.
     */
    @Query("""
            select coalesce(sum(m.quantidade), 0) from Movimentacao m
            where m.produto.id = :produtoId and m.tipo = :tipo and m.data >= :inicio and m.data < :fim
            """)
    BigDecimal sumQuantidadeDoProduto(@Param("produtoId") UUID produtoId, @Param("tipo") TipoMovimentacao tipo,
                                      @Param("inicio") OffsetDateTime inicio, @Param("fim") OffsetDateTime fim);

    /**
     * Título: Consulta: movimentações com data e unidade de medida, para o consumo mensal
     * Explicação: Executa a consulta JPQL escrita acima. Recebe tipo (TipoMovimentacao), inicio
     *   (OffsetDateTime) e fim (OffsetDateTime). Devolve List<QuantidadePorUnidadeNaData>. Usada por
     *   AnaliseService.
     */
    @Query("""
            select new br.com.intellistock.intellistock_backend.repository.QuantidadePorUnidadeNaData(
                m.data, m.produto.unidadeMedida, m.quantidade)
            from Movimentacao m
            where m.tipo = :tipo and m.data >= :inicio and m.data < :fim
            """)
    List<QuantidadePorUnidadeNaData> findQuantidadesPorUnidade(
            @Param("tipo") TipoMovimentacao tipo,
            @Param("inicio") OffsetDateTime inicio,
            @Param("fim") OffsetDateTime fim);

    /**
     * Título: Consulta: movimentações de um produto com data, para gráficos
     * Explicação: Executa a consulta JPQL escrita acima. Recebe produtoId (UUID), tipo (TipoMovimentacao),
     *   inicio (OffsetDateTime) e fim (OffsetDateTime). Devolve List<QuantidadeNaData>. Usada por
     *   AnaliseService.
     */
    @Query("""
            select new br.com.intellistock.intellistock_backend.repository.QuantidadeNaData(
                m.data, m.quantidade)
            from Movimentacao m
            where m.produto.id = :produtoId and m.tipo = :tipo and m.data >= :inicio and m.data < :fim
            """)
    List<QuantidadeNaData> findQuantidadesPorProduto(@Param("produtoId") UUID produtoId,
                                                     @Param("tipo") TipoMovimentacao tipo,
                                                     @Param("inicio") OffsetDateTime inicio,
                                                     @Param("fim") OffsetDateTime fim);

    /**
     * Título: Consulta: movimentações de uma unidade de medida com data, para gráficos
     * Explicação: Executa a consulta JPQL escrita acima. Recebe unidadeMedida
     *   (br.com.intellistock.intellistock_backend.entity.UnidadeMedida), tipo (TipoMovimentacao), inicio
     *   (OffsetDateTime) e fim (OffsetDateTime). Devolve List<QuantidadeNaData>. Usada por AnaliseService.
     */
    @Query("""
            select new br.com.intellistock.intellistock_backend.repository.QuantidadeNaData(
                m.data, m.quantidade)
            from Movimentacao m
            where m.produto.unidadeMedida = :unidadeMedida
              and m.tipo = :tipo and m.data >= :inicio and m.data < :fim
            """)
    List<QuantidadeNaData> findQuantidadesPorUnidadeMedida(
            @Param("unidadeMedida") br.com.intellistock.intellistock_backend.entity.UnidadeMedida unidadeMedida,
            @Param("tipo") TipoMovimentacao tipo,
            @Param("inicio") OffsetDateTime inicio,
            @Param("fim") OffsetDateTime fim);

    /**
     * Título: Consulta: movimentações mais recentes, com produto e usuário
     * Explicação: Executa a consulta JPQL escrita acima. Recebe pageable (Pageable). Devolve
     *   List<Movimentacao>.
     */
    @Query("select m from Movimentacao m join fetch m.produto left join fetch m.usuario order by m.data desc")
    List<Movimentacao> findRecentes(Pageable pageable);
}
