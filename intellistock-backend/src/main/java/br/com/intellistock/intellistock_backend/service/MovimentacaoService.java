package br.com.intellistock.intellistock_backend.service;

import br.com.intellistock.intellistock_backend.dto.MovimentacaoRequest;
import br.com.intellistock.intellistock_backend.dto.MovimentacaoResponse;
import br.com.intellistock.intellistock_backend.entity.Movimentacao;
import br.com.intellistock.intellistock_backend.entity.Produto;
import br.com.intellistock.intellistock_backend.entity.TipoMovimentacao;
import br.com.intellistock.intellistock_backend.entity.User;
import br.com.intellistock.intellistock_backend.exception.BusinessException;
import br.com.intellistock.intellistock_backend.exception.ResourceNotFoundException;
import br.com.intellistock.intellistock_backend.repository.MovimentacaoRepository;
import br.com.intellistock.intellistock_backend.repository.ProdutoRepository;
import br.com.intellistock.intellistock_backend.repository.UserRepository;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class MovimentacaoService {

    private final MovimentacaoRepository movimentacaoRepository;
    private final ProdutoRepository produtoRepository;
    private final UserRepository userRepository;
    private final Clock clock;

    public MovimentacaoService(MovimentacaoRepository movimentacaoRepository, ProdutoRepository produtoRepository,
                               UserRepository userRepository, Clock clock) {
        this.movimentacaoRepository = movimentacaoRepository;
        this.produtoRepository = produtoRepository;
        this.userRepository = userRepository;
        this.clock = clock;
    }

    /**
     * Registra a movimentacao e atualiza o saldo do produto na mesma transacao.
     * A linha do produto fica bloqueada ate o commit, entao saidas concorrentes
     * sao processadas uma de cada vez e nunca deixam o estoque negativo.
     */
    @Transactional
    public MovimentacaoResponse registrar(MovimentacaoRequest request, User usuario) {
        Produto produto = produtoRepository.findByIdForUpdate(request.produtoId())
                .orElseThrow(() -> new ResourceNotFoundException("Produto nao encontrado."));

        if (!produto.isAtivo()) {
            throw new BusinessException("Produto inativo nao pode receber movimentacoes.");
        }

        BigDecimal saldoAtual = produto.getQuantidade();
        BigDecimal novoSaldo;
        if (request.tipo() == TipoMovimentacao.SAIDA) {
            if (request.quantidade().compareTo(saldoAtual) > 0) {
                throw new BusinessException("Estoque insuficiente. Disponivel: "
                        + saldoAtual.stripTrailingZeros().toPlainString() + " " + produto.getUnidadeMedida() + ".");
            }
            novoSaldo = saldoAtual.subtract(request.quantidade());
        } else {
            novoSaldo = saldoAtual.add(request.quantidade());
        }

        produto.setQuantidade(novoSaldo);

        Movimentacao movimentacao = new Movimentacao();
        movimentacao.setProduto(produto);
        movimentacao.setTipo(request.tipo());
        movimentacao.setQuantidade(request.quantidade());
        movimentacao.setSaldoResultante(novoSaldo);
        movimentacao.setData(request.data() == null ? OffsetDateTime.now(clock) : request.data());
        movimentacao.setObservacao(request.observacao() == null || request.observacao().isBlank()
                ? null : request.observacao().trim());
        movimentacao.setUsuario(usuario == null ? null : userRepository.getReferenceById(usuario.getId()));

        return MovimentacaoResponse.from(movimentacaoRepository.save(movimentacao));
    }

    @Transactional(readOnly = true)
    public List<MovimentacaoResponse> listar(UUID produtoId, TipoMovimentacao tipo, LocalDate inicio, LocalDate fim,
                                             int limite) {
        if (inicio != null && fim != null && inicio.isAfter(fim)) {
            throw new BusinessException("Data inicial deve ser anterior ou igual a data final.");
        }

        Specification<Movimentacao> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (produtoId != null) {
                predicates.add(cb.equal(root.get("produto").get("id"), produtoId));
            }
            if (tipo != null) {
                predicates.add(cb.equal(root.get("tipo"), tipo));
            }
            if (inicio != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("data"), inicioDoDia(inicio)));
            }
            if (fim != null) {
                predicates.add(cb.lessThan(root.get("data"), inicioDoDia(fim.plusDays(1))));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return movimentacaoRepository.findAll(spec, PageRequest.of(0, limite, Sort.by(Sort.Direction.DESC, "data")))
                .stream()
                .map(MovimentacaoResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public MovimentacaoResponse buscar(UUID id) {
        return movimentacaoRepository.findById(id)
                .map(MovimentacaoResponse::from)
                .orElseThrow(() -> new ResourceNotFoundException("Movimentacao nao encontrada."));
    }

    private OffsetDateTime inicioDoDia(LocalDate data) {
        return data.atStartOfDay(clock.getZone()).toOffsetDateTime();
    }
}
