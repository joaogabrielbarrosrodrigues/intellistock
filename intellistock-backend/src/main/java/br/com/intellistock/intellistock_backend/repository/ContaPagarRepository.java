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

public interface ContaPagarRepository extends JpaRepository<ContaPagar, UUID>, JpaSpecificationExecutor<ContaPagar> {

    @Override
    @EntityGraph(attributePaths = "fornecedor")
    List<ContaPagar> findAll(Specification<ContaPagar> spec, Sort sort);

    boolean existsByFornecedorId(UUID fornecedorId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from ContaPagar c where c.id = :id")
    Optional<ContaPagar> findByIdForUpdate(@Param("id") UUID id);

    @Query("""
            select c from ContaPagar c join fetch c.fornecedor
            where c.status = :status and c.dataVencimento >= :inicio and c.dataVencimento <= :fim
            order by c.dataVencimento
            """)
    List<ContaPagar> findByStatusAndVencimentoEntre(@Param("status") StatusConta status,
                                                    @Param("inicio") LocalDate inicio,
                                                    @Param("fim") LocalDate fim);

    @Query("select count(c) from ContaPagar c where c.status = :status and c.dataVencimento < :data")
    long countByStatusAndVencimentoAntes(@Param("status") StatusConta status, @Param("data") LocalDate data);

    @Query("select count(c) from ContaPagar c where c.status = :status and c.dataVencimento >= :data")
    long countByStatusAndVencimentoAPartirDe(@Param("status") StatusConta status, @Param("data") LocalDate data);

    @Query("select coalesce(sum(c.valor), 0) from ContaPagar c where c.status = :status")
    BigDecimal sumValorByStatus(@Param("status") StatusConta status);

    @Query("select coalesce(sum(c.valor), 0) from ContaPagar c where c.status = :status and c.dataVencimento < :data")
    BigDecimal sumValorByStatusAndVencimentoAntes(@Param("status") StatusConta status, @Param("data") LocalDate data);
}
