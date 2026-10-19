package br.com.intellistock.intellistock_backend.repository;

import br.com.intellistock.intellistock_backend.entity.Movimentacao;
import br.com.intellistock.intellistock_backend.entity.TipoMovimentacao;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public interface MovimentacaoRepository extends JpaRepository<Movimentacao, UUID>, JpaSpecificationExecutor<Movimentacao> {

    boolean existsByProdutoId(UUID produtoId);

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

    @Query("select m from Movimentacao m join fetch m.produto left join fetch m.usuario order by m.data desc")
    List<Movimentacao> findRecentes(Pageable pageable);
}
