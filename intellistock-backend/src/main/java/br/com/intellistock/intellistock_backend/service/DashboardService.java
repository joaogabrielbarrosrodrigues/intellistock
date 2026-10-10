package br.com.intellistock.intellistock_backend.service;

import br.com.intellistock.intellistock_backend.dto.ContaPagarResponse;
import br.com.intellistock.intellistock_backend.dto.DashboardResponse;
import br.com.intellistock.intellistock_backend.dto.MovimentacaoResponse;
import br.com.intellistock.intellistock_backend.entity.ContaPagar;
import br.com.intellistock.intellistock_backend.entity.StatusConta;
import br.com.intellistock.intellistock_backend.repository.ContaPagarRepository;
import br.com.intellistock.intellistock_backend.repository.FornecedorRepository;
import br.com.intellistock.intellistock_backend.repository.MovimentacaoRepository;
import br.com.intellistock.intellistock_backend.repository.ProdutoRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.LocalDate;
import java.util.List;

@Service
public class DashboardService {

    private static final int MOVIMENTACOES_RECENTES = 10;
    private static final int MESES_CONSUMO = 6;

    private final ProdutoRepository produtoRepository;
    private final FornecedorRepository fornecedorRepository;
    private final MovimentacaoRepository movimentacaoRepository;
    private final ContaPagarRepository contaPagarRepository;
    private final AnaliseService analiseService;
    private final Clock clock;

    public DashboardService(ProdutoRepository produtoRepository, FornecedorRepository fornecedorRepository,
                            MovimentacaoRepository movimentacaoRepository, ContaPagarRepository contaPagarRepository,
                            AnaliseService analiseService, Clock clock) {
        this.produtoRepository = produtoRepository;
        this.fornecedorRepository = fornecedorRepository;
        this.movimentacaoRepository = movimentacaoRepository;
        this.contaPagarRepository = contaPagarRepository;
        this.analiseService = analiseService;
        this.clock = clock;
    }

    /**
     * @param diasVencimento janela (a partir de hoje) para considerar uma conta "proxima do vencimento"
     */
    @Transactional(readOnly = true)
    public DashboardResponse resumo(int diasVencimento) {
        LocalDate hoje = LocalDate.now(clock);

        DashboardResponse.Estoque estoque = new DashboardResponse.Estoque(
                produtoRepository.countByAtivoTrue(),
                produtoRepository.countEstoqueBaixo(),
                produtoRepository.countSemEstoque(),
                produtoRepository.sumValorEstoque().setScale(2, RoundingMode.HALF_UP),
                fornecedorRepository.count()
        );

        List<ContaPagar> proximas = contaPagarRepository.findByStatusAndVencimentoEntre(
                StatusConta.PENDENTE, hoje, hoje.plusDays(diasVencimento));
        BigDecimal valorProximas = proximas.stream().map(ContaPagar::getValor).reduce(BigDecimal.ZERO, BigDecimal::add);

        DashboardResponse.Financeiro financeiro = new DashboardResponse.Financeiro(
                contaPagarRepository.countByStatusAndVencimentoAPartirDe(StatusConta.PENDENTE, hoje),
                contaPagarRepository.countByStatusAndVencimentoAntes(StatusConta.PENDENTE, hoje),
                contaPagarRepository.sumValorByStatus(StatusConta.PENDENTE).setScale(2, RoundingMode.HALF_UP),
                contaPagarRepository.sumValorByStatusAndVencimentoAntes(StatusConta.PENDENTE, hoje)
                        .setScale(2, RoundingMode.HALF_UP),
                proximas.size(),
                valorProximas.setScale(2, RoundingMode.HALF_UP)
        );

        List<MovimentacaoResponse> recentes = movimentacaoRepository
                .findRecentes(PageRequest.of(0, MOVIMENTACOES_RECENTES)).stream()
                .map(MovimentacaoResponse::from)
                .toList();

        return new DashboardResponse(
                estoque,
                financeiro,
                analiseService.contarSugestoesReposicao(),
                recentes,
                proximas.stream().map(conta -> ContaPagarResponse.from(conta, hoje)).toList(),
                analiseService.consumoMensal(MESES_CONSUMO)
        );
    }
}
