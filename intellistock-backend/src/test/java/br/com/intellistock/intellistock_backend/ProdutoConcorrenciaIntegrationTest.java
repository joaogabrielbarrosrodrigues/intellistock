package br.com.intellistock.intellistock_backend;

import br.com.intellistock.intellistock_backend.dto.MovimentacaoRequest;
import br.com.intellistock.intellistock_backend.dto.ProdutoRequest;
import br.com.intellistock.intellistock_backend.entity.Produto;
import br.com.intellistock.intellistock_backend.entity.TipoMovimentacao;
import br.com.intellistock.intellistock_backend.entity.UnidadeMedida;
import br.com.intellistock.intellistock_backend.exception.BusinessException;
import br.com.intellistock.intellistock_backend.repository.ProdutoRepository;
import br.com.intellistock.intellistock_backend.service.MovimentacaoService;
import br.com.intellistock.intellistock_backend.service.ProdutoService;
import br.com.intellistock.intellistock_backend.support.IntegrationTest;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

import static org.junit.jupiter.api.Assertions.*;

@Transactional(propagation = Propagation.NOT_SUPPORTED)
class ProdutoConcorrenciaIntegrationTest extends IntegrationTest {
    @Autowired private ProdutoRepository produtos;
    @Autowired private ProdutoService produtoService;
    @Autowired private MovimentacaoService movimentacaoService;
    @Autowired private PlatformTransactionManager transactionManager;
    @Autowired private EntityManager entityManager;

    @Test
    void alteracaoDeUnidadeEsperaMovimentacaoERevalidaHistorico() throws Exception {
        TransactionTemplate transaction = new TransactionTemplate(transactionManager);
        var produtoId = transaction.execute(status -> {
            Produto produto = new Produto();
            produto.setNome("Produto concorrente");
            produto.setUnidadeMedida(UnidadeMedida.UN);
            return produtos.save(produto).getId();
        });

        CountDownLatch movimentacaoIniciada = new CountDownLatch(1);
        CountDownLatch liberarMovimentacao = new CountDownLatch(1);
        CountDownLatch alteracaoIniciada = new CountDownLatch(1);
        var executor = Executors.newFixedThreadPool(2);
        try {
            var movimentacao = executor.submit(() -> transaction.executeWithoutResult(status -> {
                movimentacaoService.registrar(new MovimentacaoRequest(produtoId, TipoMovimentacao.ENTRADA,
                        BigDecimal.ONE, null, null), null);
                movimentacaoIniciada.countDown();
                try {
                    assertTrue(liberarMovimentacao.await(5, TimeUnit.SECONDS));
                } catch (InterruptedException ex) {
                    Thread.currentThread().interrupt();
                    throw new IllegalStateException(ex);
                }
            }));
            assertTrue(movimentacaoIniciada.await(5, TimeUnit.SECONDS));

            var alteracao = executor.submit(() -> {
                alteracaoIniciada.countDown();
                return produtoService.atualizar(produtoId, new ProdutoRequest("Produto concorrente", null, null,
                        BigDecimal.ZERO, UnidadeMedida.KG, BigDecimal.ZERO, null));
            });
            assertTrue(alteracaoIniciada.await(5, TimeUnit.SECONDS));
            assertThrows(TimeoutException.class, () -> alteracao.get(300, TimeUnit.MILLISECONDS));

            liberarMovimentacao.countDown();
            movimentacao.get(5, TimeUnit.SECONDS);
            ExecutionException erro = assertThrows(ExecutionException.class, () -> alteracao.get(5, TimeUnit.SECONDS));
            assertInstanceOf(BusinessException.class, erro.getCause());
            assertEquals(UnidadeMedida.UN, produtoService.buscar(produtoId).unidadeMedida());
        } finally {
            liberarMovimentacao.countDown();
            executor.shutdownNow();
            assertTrue(executor.awaitTermination(5, TimeUnit.SECONDS));
            transaction.executeWithoutResult(status -> {
                entityManager.createQuery("delete from Movimentacao m where m.produto.id = :id")
                        .setParameter("id", produtoId).executeUpdate();
                produtos.deleteById(produtoId);
            });
        }
    }
}
