package br.com.intellistock.intellistock_backend.service;

import br.com.intellistock.intellistock_backend.dto.ContaPagarRequest;
import br.com.intellistock.intellistock_backend.dto.ContaPagarResponse;
import br.com.intellistock.intellistock_backend.dto.PagamentoRequest;
import br.com.intellistock.intellistock_backend.entity.ContaPagar;
import br.com.intellistock.intellistock_backend.entity.StatusConta;
import br.com.intellistock.intellistock_backend.exception.BusinessException;
import br.com.intellistock.intellistock_backend.exception.ResourceNotFoundException;
import br.com.intellistock.intellistock_backend.repository.ContaPagarRepository;
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

/**
 * Título: Regras de negócio das contas a pagar
 * Explicação: Service com as regras de negócio das contas a pagar.
 */
@Service
public class ContaPagarService {

    private final ContaPagarRepository contaPagarRepository;
    private final FornecedorService fornecedorService;
    private final Clock clock;

    /**
     * Título: Construtor
     * Explicação: O Spring chama ao criar o objeto e entrega pronto o que ele precisa: contaPagarRepository
     *   (ContaPagarRepository), fornecedorService (FornecedorService) e clock (Clock).
     */
    public ContaPagarService(ContaPagarRepository contaPagarRepository, FornecedorService fornecedorService,
                             Clock clock) {
        this.contaPagarRepository = contaPagarRepository;
        this.fornecedorService = fornecedorService;
        this.clock = clock;
    }

    /**
     * Título: Monta a consulta com os filtros; trata PENDENTE e VENCIDA pela data
     * Explicação: Recebe status (StatusConta), fornecedorId (UUID), vencimentoInicio (LocalDate) e
     *   vencimentoFim (LocalDate). Monta a consulta com os filtros. PENDENTE traz as contas em aberto que ainda
     *   não venceram; VENCIDA traz as em aberto com vencimento antes de hoje (VENCIDA não é gravada, é calculada
     *   pela data); PAGA e CANCELADA comparam com o valor gravado. Devolve List<ContaPagarResponse>. Chamado por
     *   ContaPagarController.
     *
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

        return contaPagarRepository.findAll(spec, Sort.by("dataVencimento", "descricao")).stream()
                .map(conta -> ContaPagarResponse.from(conta, hoje))
                .toList();
    }

    /**
     * Título: Devolve uma conta como DTO
     * Explicação: Recebe id (UUID). Devolve ContaPagarResponse. Chamado por ContaPagarController.
     */
    @Transactional(readOnly = true)
    public ContaPagarResponse buscar(UUID id) {
        return ContaPagarResponse.from(buscarEntidade(id), hoje());
    }

    /**
     * Título: Grava uma conta nova
     * Explicação: Recebe request (ContaPagarRequest). Copiam os dados do pedido (fornecedor obrigatório);
     *   editar só é permitido com a conta em aberto. Devolve ContaPagarResponse. Chamado por
     *   ContaPagarController.
     */
    @Transactional
    public ContaPagarResponse criar(ContaPagarRequest request) {
        ContaPagar conta = new ContaPagar();
        preencher(conta, request);
        return ContaPagarResponse.from(contaPagarRepository.save(conta), hoje());
    }

    /**
     * Título: Edita uma conta em aberto
     * Explicação: Recebe id (UUID) e request (ContaPagarRequest). Devolve ContaPagarResponse. Chamado por
     *   ContaPagarController.
     */
    @Transactional
    public ContaPagarResponse atualizar(UUID id, ContaPagarRequest request) {
        ContaPagar conta = buscarParaAtualizar(id);
        exigirEmAberto(conta, "Somente contas em aberto podem ser editadas.");
        preencher(conta, request);
        return ContaPagarResponse.from(conta, hoje());
    }

    /**
     * Título: Apaga a conta
     * Explicação: Recebe id (UUID). Apaga a conta. Não devolve nada. Chamado por ContaPagarController.
     */
    @Transactional
    public void excluir(UUID id) {
        contaPagarRepository.delete(buscarParaAtualizar(id));
    }

    /**
     * Título: Marca como paga com a data informada ou a de hoje
     * Explicação: Recebe id (UUID) e request (PagamentoRequest). Só para conta em aberto; marca PAGA com a
     *   data enviada ou a de hoje. Devolve ContaPagarResponse. Chamado por ContaPagarController.
     */
    @Transactional
    public ContaPagarResponse pagar(UUID id, PagamentoRequest request) {
        ContaPagar conta = buscarParaAtualizar(id);
        exigirEmAberto(conta, "Somente contas em aberto podem ser pagas.");
        conta.setStatus(StatusConta.PAGA);
        conta.setDataPagamento(request == null || request.dataPagamento() == null ? hoje() : request.dataPagamento());
        return ContaPagarResponse.from(conta, hoje());
    }

    /**
     * Título: Marca como cancelada
     * Explicação: Recebe id (UUID). Só para conta em aberto; marca CANCELADA. Devolve ContaPagarResponse.
     *   Chamado por ContaPagarController.
     */
    @Transactional
    public ContaPagarResponse cancelar(UUID id) {
        ContaPagar conta = buscarParaAtualizar(id);
        exigirEmAberto(conta, "Somente contas em aberto podem ser canceladas.");
        conta.setStatus(StatusConta.CANCELADA);
        return ContaPagarResponse.from(conta, hoje());
    }

    /**
     * Título: Volta para pendente e apaga a data de pagamento
     * Explicação: Recebe id (UUID). Volta PAGA ou CANCELADA para PENDENTE e apaga a data de pagamento. Devolve
     *   ContaPagarResponse. Chamado por ContaPagarController.
     *
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

    /**
     * Título: Busca a conta sem travar
     * Explicação: Recebe id (UUID). Devolve ContaPagar.
     */
    private ContaPagar buscarEntidade(UUID id) {
        return contaPagarRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Conta nao encontrada."));
    }

    /**
     * Título: Busca a conta travando a linha
     * Explicação: Recebe id (UUID). Devolve ContaPagar.
     */
    // A segunda operacao deve ler o status ja confirmado pela primeira.
    private ContaPagar buscarParaAtualizar(UUID id) {
        return contaPagarRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new ResourceNotFoundException("Conta nao encontrada."));
    }

    /**
     * Título: Recusa a operação se a conta não estiver pendente
     * Explicação: Recebe conta (ContaPagar) e mensagem (String). Não devolve nada.
     */
    private void exigirEmAberto(ContaPagar conta, String mensagem) {
        if (conta.getStatus() != StatusConta.PENDENTE) {
            throw new BusinessException(mensagem);
        }
    }

    /**
     * Título: Copia os dados do pedido para a entidade
     * Explicação: Recebe conta (ContaPagar) e request (ContaPagarRequest). Não devolve nada.
     */
    private void preencher(ContaPagar conta, ContaPagarRequest request) {
        conta.setFornecedor(fornecedorService.buscarEntidade(request.fornecedorId()));
        conta.setDescricao(request.descricao().trim());
        conta.setValor(request.valor());
        conta.setDataVencimento(request.dataVencimento());
        conta.setObservacao(request.observacao() == null || request.observacao().isBlank()
                ? null : request.observacao().trim());
    }

    /**
     * Título: Data de hoje pelo relógio injetado
     * Explicação: Devolve LocalDate.
     */
    private LocalDate hoje() {
        return LocalDate.now(clock);
    }
}
