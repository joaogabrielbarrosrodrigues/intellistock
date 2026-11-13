package br.com.intellistock.intellistock_backend.service;

import br.com.intellistock.intellistock_backend.dto.ContaPagarRequest;
import br.com.intellistock.intellistock_backend.dto.ContaPagarResponse;
import br.com.intellistock.intellistock_backend.dto.PagamentoRequest;
import br.com.intellistock.intellistock_backend.entity.ContaPagar;
import br.com.intellistock.intellistock_backend.entity.StatusConta;
import br.com.intellistock.intellistock_backend.exception.BusinessException;
import br.com.intellistock.intellistock_backend.exception.ResourceNotFoundException;
import br.com.intellistock.intellistock_backend.repository.ContaPagarRepository;
import br.com.intellistock.intellistock_backend.util.TextoUtils;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class ContaPagarService {

    private final ContaPagarRepository contaPagarRepository;
    private final FornecedorService fornecedorService;
    private final Clock clock;

    public ContaPagarService(ContaPagarRepository contaPagarRepository, FornecedorService fornecedorService,
                             Clock clock) {
        this.contaPagarRepository = contaPagarRepository;
        this.fornecedorService = fornecedorService;
        this.clock = clock;
    }

    /**
     * Filtro por status usa o status efetivo: PENDENTE retorna apenas contas em aberto ainda
     * nao vencidas e VENCIDA retorna contas em aberto com vencimento anterior a hoje.
     */
    @Transactional(readOnly = true)
    public List<ContaPagarResponse> listar(StatusConta status, UUID fornecedorId, LocalDate vencimentoInicio,
                                           LocalDate vencimentoFim) {
        if (vencimentoInicio != null && vencimentoFim != null && vencimentoInicio.isAfter(vencimentoFim)) {
            throw new BusinessException("Data inicial deve ser anterior ou igual a data final.");
        }

        LocalDate hoje = hoje();
        Specification<ContaPagar> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (status != null) {
                switch (status) {
                    case PENDENTE -> {
                        predicates.add(cb.equal(root.get("status"), StatusConta.PENDENTE));
                        predicates.add(cb.greaterThanOrEqualTo(root.get("dataVencimento"), hoje));
                    }
                    case VENCIDA -> {
                        predicates.add(cb.equal(root.get("status"), StatusConta.PENDENTE));
                        predicates.add(cb.lessThan(root.get("dataVencimento"), hoje));
                    }
                    default -> predicates.add(cb.equal(root.get("status"), status));
                }
            }
            if (fornecedorId != null) {
                predicates.add(cb.equal(root.get("fornecedor").get("id"), fornecedorId));
            }
            if (vencimentoInicio != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("dataVencimento"), vencimentoInicio));
            }
            if (vencimentoFim != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("dataVencimento"), vencimentoFim));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return contaPagarRepository.findAll(spec, Sort.by(ContaPagar::getDataVencimento, ContaPagar::getDescricao)).stream()
                .map(conta -> ContaPagarResponse.from(conta, hoje))
                .toList();
    }

    @Transactional(readOnly = true)
    public ContaPagarResponse buscar(UUID id) {
        return ContaPagarResponse.from(buscarEntidade(id), hoje());
    }

    @Transactional
    public ContaPagarResponse criar(ContaPagarRequest request) {
        ContaPagar conta = new ContaPagar();
        preencher(conta, request);
        return ContaPagarResponse.from(contaPagarRepository.save(conta), hoje());
    }

    @Transactional
    public ContaPagarResponse atualizar(UUID id, ContaPagarRequest request) {
        ContaPagar conta = buscarParaAtualizar(id);
        exigirEmAberto(conta, "Somente contas em aberto podem ser editadas.");
        preencher(conta, request);
        return ContaPagarResponse.from(conta, hoje());
    }

    @Transactional
    public void excluir(UUID id) {
        contaPagarRepository.delete(buscarParaAtualizar(id));
    }

    @Transactional
    public ContaPagarResponse pagar(UUID id, PagamentoRequest request) {
        ContaPagar conta = buscarParaAtualizar(id);
        exigirEmAberto(conta, "Somente contas em aberto podem ser pagas.");
        conta.setStatus(StatusConta.PAGA);
        conta.setDataPagamento(request == null || request.dataPagamento() == null ? hoje() : request.dataPagamento());
        return ContaPagarResponse.from(conta, hoje());
    }

    @Transactional
    public ContaPagarResponse cancelar(UUID id) {
        ContaPagar conta = buscarParaAtualizar(id);
        exigirEmAberto(conta, "Somente contas em aberto podem ser canceladas.");
        conta.setStatus(StatusConta.CANCELADA);
        return ContaPagarResponse.from(conta, hoje());
    }

    /**
     * Desfaz um pagamento ou cancelamento, devolvendo a conta para PENDENTE.
     */
    @Transactional
    public ContaPagarResponse reabrir(UUID id) {
        ContaPagar conta = buscarParaAtualizar(id);
        if (conta.getStatus() == StatusConta.PENDENTE) {
            throw new BusinessException("A conta ja esta em aberto.");
        }
        conta.setStatus(StatusConta.PENDENTE);
        conta.setDataPagamento(null);
        return ContaPagarResponse.from(conta, hoje());
    }

    private ContaPagar buscarEntidade(UUID id) {
        return contaPagarRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Conta nao encontrada."));
    }

    // A segunda operacao deve ler o status ja confirmado pela primeira.
    private ContaPagar buscarParaAtualizar(UUID id) {
        return contaPagarRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new ResourceNotFoundException("Conta nao encontrada."));
    }

    private void exigirEmAberto(ContaPagar conta, String mensagem) {
        if (conta.getStatus() != StatusConta.PENDENTE) {
            throw new BusinessException(mensagem);
        }
    }

    private void preencher(ContaPagar conta, ContaPagarRequest request) {
        conta.setFornecedor(fornecedorService.buscarEntidade(request.fornecedorId()));
        conta.setDescricao(request.descricao().trim());
        conta.setValor(request.valor());
        conta.setDataVencimento(request.dataVencimento());
        conta.setObservacao(TextoUtils.blankToNull(request.observacao()));
    }

    private LocalDate hoje() {
        return LocalDate.now(clock);
    }
}
