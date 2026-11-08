package br.com.intellistock.intellistock_backend;

import br.com.intellistock.intellistock_backend.entity.ContaPagar;
import br.com.intellistock.intellistock_backend.entity.Fornecedor;
import br.com.intellistock.intellistock_backend.entity.StatusConta;
import br.com.intellistock.intellistock_backend.exception.BusinessException;
import br.com.intellistock.intellistock_backend.repository.ContaPagarRepository;
import br.com.intellistock.intellistock_backend.repository.FornecedorRepository;
import br.com.intellistock.intellistock_backend.service.ContaPagarService;
import br.com.intellistock.intellistock_backend.support.IntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

@Transactional(propagation = Propagation.NOT_SUPPORTED)
class ContaConcorrenciaIntegrationTest extends IntegrationTest {

    @Autowired
    private ContaPagarService service;

    @Autowired
    private ContaPagarRepository contas;

    @Autowired
    private FornecedorRepository fornecedores;

    @Autowired
    private PlatformTransactionManager transactionManager;

    @Test
    void cancelamentoConcorrenteEsperaPagamentoERevalidaStatus() throws Exception {
        TransactionTemplate transaction = new TransactionTemplate(transactionManager);
        UUID[] ids = transaction.execute(status -> {
            Fornecedor fornecedor = new Fornecedor();
            fornecedor.setNome("Fornecedor de concorrencia");
            fornecedores.save(fornecedor);
            ContaPagar conta = new ContaPagar();
            conta.setFornecedor(fornecedor);
            conta.setDescricao("Conta de concorrencia");
            conta.setValor(BigDecimal.TEN);
            conta.setDataVencimento(LocalDate.now());
            contas.save(conta);
            return new UUID[]{conta.getId(), fornecedor.getId()};
        });

        CountDownLatch pagamentoIniciado = new CountDownLatch(1);
        CountDownLatch liberarPagamento = new CountDownLatch(1);
        CountDownLatch cancelamentoIniciado = new CountDownLatch(1);
        var executor = Executors.newFixedThreadPool(2);
        try {
            var pagamento = executor.submit(() -> transaction.executeWithoutResult(status -> {
                service.pagar(ids[0], null);
                pagamentoIniciado.countDown();
                try {
                    assertTrue(liberarPagamento.await(5, TimeUnit.SECONDS));
                } catch (InterruptedException ex) {
                    Thread.currentThread().interrupt();
                    throw new IllegalStateException(ex);
                }
            }));
            assertTrue(pagamentoIniciado.await(5, TimeUnit.SECONDS));

            var cancelamento = executor.submit(() -> {
                cancelamentoIniciado.countDown();
                return service.cancelar(ids[0]);
            });
            assertTrue(cancelamentoIniciado.await(5, TimeUnit.SECONDS));
            assertThrows(TimeoutException.class, () -> cancelamento.get(300, TimeUnit.MILLISECONDS));

            liberarPagamento.countDown();
            pagamento.get(5, TimeUnit.SECONDS);
            ExecutionException erro = assertThrows(ExecutionException.class,
                    () -> cancelamento.get(5, TimeUnit.SECONDS));
            assertInstanceOf(BusinessException.class, erro.getCause());
            assertEquals(StatusConta.PAGA, service.buscar(ids[0]).status());
        } finally {
            liberarPagamento.countDown();
            executor.shutdownNow();
            assertTrue(executor.awaitTermination(5, TimeUnit.SECONDS));
            transaction.executeWithoutResult(status -> {
                contas.deleteById(ids[0]);
                contas.flush();
                fornecedores.deleteById(ids[1]);
            });
        }
    }
}
