package br.com.intellistock.intellistock_backend.repository;

import br.com.intellistock.intellistock_backend.entity.ContaPagar;
import br.com.intellistock.intellistock_backend.entity.StatusConta;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Título: Consultas da tabela contas_pagar
 * Explicação: Repositório (interface do Spring Data) da tabela contas_pagar. O Spring cria a implementação
 *   e o SQL sozinho.
 */
public interface ContaPagarRepository extends JpaRepository<ContaPagar, UUID>, JpaSpecificationExecutor<ContaPagar> {

    /**
     * Título: Consulta: busca com filtros, trazendo os relacionamentos junto
     * Explicação: Substitui o findAll padrão do Spring Data para já trazer os relacionamentos (EntityGraph) e
     *   evitar várias consultas extras. Recebe spec (Specification<ContaPagar>) e sort (Sort). Devolve
     *   List<ContaPagar>. Usada por ContaPagarService.
     */
    @Override
    @EntityGraph(attributePaths = "fornecedor")
    List<ContaPagar> findAll(Specification<ContaPagar> spec, Sort sort);

    /**
     * Título: Consulta: verifica se algum registro aponta para o fornecedor
     * Explicação: O Spring Data gera o SQL sozinho a partir do nome do método. Recebe fornecedorId (UUID).
     *   Devolve boolean. Usada por FornecedorService.
     */
    boolean existsByFornecedorId(UUID fornecedorId);

    /**
     * Título: Consulta: busca pelo id travando a linha (SELECT ... FOR UPDATE)
     * Explicação: Executa a consulta JPQL escrita acima. Recebe id (UUID). Devolve Optional<ContaPagar>. Usada
     *   por ContaPagarService.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from ContaPagar c where c.id = :id")
    Optional<ContaPagar> findByIdForUpdate(@Param("id") UUID id);

    /**
     * Título: Consulta: contas de uma situação com vencimento entre duas datas
     * Explicação: Executa a consulta JPQL escrita acima. Recebe status (StatusConta), inicio (LocalDate) e fim
     *   (LocalDate). Devolve List<ContaPagar>. Usada por DashboardService.
     */
    @Query("""
            select c from ContaPagar c join fetch c.fornecedor
            where c.status = :status and c.dataVencimento >= :inicio and c.dataVencimento <= :fim
            order by c.dataVencimento
            """)
    List<ContaPagar> findByStatusAndVencimentoEntre(@Param("status") StatusConta status,
                                                    @Param("inicio") LocalDate inicio,
                                                    @Param("fim") LocalDate fim);

    /**
     * Título: Consulta: conta contas de uma situação vencidas antes de uma data
     * Explicação: Executa a consulta JPQL escrita acima. Recebe status (StatusConta) e data (LocalDate).
     *   Devolve long. Usada por DashboardService.
     */
    @Query("select count(c) from ContaPagar c where c.status = :status and c.dataVencimento < :data")
    long countByStatusAndVencimentoAntes(@Param("status") StatusConta status, @Param("data") LocalDate data);

    /**
     * Título: Consulta: conta contas de uma situação com vencimento a partir de uma data
     * Explicação: Executa a consulta JPQL escrita acima. Recebe status (StatusConta) e data (LocalDate).
     *   Devolve long. Usada por DashboardService.
     */
    @Query("select count(c) from ContaPagar c where c.status = :status and c.dataVencimento >= :data")
    long countByStatusAndVencimentoAPartirDe(@Param("status") StatusConta status, @Param("data") LocalDate data);

    /**
     * Título: Consulta: soma o valor das contas de uma situação
     * Explicação: Executa a consulta JPQL escrita acima. Recebe status (StatusConta). Devolve BigDecimal.
     *   Usada por DashboardService.
     */
    @Query("select coalesce(sum(c.valor), 0) from ContaPagar c where c.status = :status")
    BigDecimal sumValorByStatus(@Param("status") StatusConta status);

    /**
     * Título: Consulta: soma o valor das contas de uma situação vencidas antes de uma data
     * Explicação: Executa a consulta JPQL escrita acima. Recebe status (StatusConta) e data (LocalDate).
     *   Devolve BigDecimal. Usada por DashboardService.
     */
    @Query("select coalesce(sum(c.valor), 0) from ContaPagar c where c.status = :status and c.dataVencimento < :data")
    BigDecimal sumValorByStatusAndVencimentoAntes(@Param("status") StatusConta status, @Param("data") LocalDate data);
}
