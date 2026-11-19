package br.com.intellistock.intellistock_backend.service;

import br.com.intellistock.intellistock_backend.dto.ProdutoRequest;
import br.com.intellistock.intellistock_backend.dto.ProdutoResponse;
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
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

/**
 * Título: Regras de negócio dos produtos
 * Explicação: Service com as regras de negócio dos produtos.
 */
@Service
public class ProdutoService {

    private final ProdutoRepository produtoRepository;
    private final MovimentacaoRepository movimentacaoRepository;
    private final UserRepository userRepository;
    private final FornecedorService fornecedorService;
    private final Clock clock;

    /**
     * Título: Construtor
     * Explicação: O Spring chama ao criar o objeto e entrega pronto o que ele precisa: produtoRepository
     *   (ProdutoRepository), movimentacaoRepository (MovimentacaoRepository), userRepository (UserRepository),
     *   fornecedorService (FornecedorService) e clock (Clock).
     */
    public ProdutoService(ProdutoRepository produtoRepository, MovimentacaoRepository movimentacaoRepository,
                          UserRepository userRepository, FornecedorService fornecedorService, Clock clock) {
        this.produtoRepository = produtoRepository;
        this.movimentacaoRepository = movimentacaoRepository;
        this.userRepository = userRepository;
        this.fornecedorService = fornecedorService;
        this.clock = clock;
    }

    /**
     * Título: Monta a consulta com os filtros informados e devolve os produtos em ordem alfabética
     * Explicação: Recebe busca (String), fornecedorId (UUID) e incluirInativos (boolean). Monta a consulta só
     *   com os filtros enviados (ativos, nome, fornecedor) e ordena por nome. Devolve List<ProdutoResponse>.
     *   Chamado por ProdutoController.
     */
    @Transactional(readOnly = true)
    public List<ProdutoResponse> listar(String busca, UUID fornecedorId, boolean incluirInativos) {
        Specification<Produto> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (!incluirInativos) {
                predicates.add(cb.isTrue(root.get("ativo")));
            }
            if (busca != null && !busca.isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("nome")), "%" + busca.trim().toLowerCase(Locale.ROOT) + "%"));
            }
            if (fornecedorId != null) {
                predicates.add(cb.equal(root.get("fornecedor").get("id"), fornecedorId));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return produtoRepository.findAll(spec, Sort.by("nome")).stream()
                .map(ProdutoResponse::from)
                .toList();
    }

    /**
     * Título: Devolve um produto como DTO
     * Explicação: Recebe id (UUID). Devolve ProdutoResponse. Chamado por ProdutoController.
     */
    @Transactional(readOnly = true)
    public ProdutoResponse buscar(UUID id) {
        return ProdutoResponse.from(buscarEntidade(id));
    }

    /**
     * Título: Grava o produto e, se houver quantidade inicial, a primeira movimentação
     * Explicação: Recebe request (ProdutoRequest) e usuario (User). Grava o produto com saldo zero; se veio
     *   quantidade inicial maior que zero, cria também uma movimentação de ENTRADA chamada "Estoque inicial" e
     *   ajusta o saldo, tudo na mesma transação. Devolve ProdutoResponse. Chamado por ProdutoController.
     */
    @Transactional
    public ProdutoResponse criar(ProdutoRequest request, User usuario) {
        Produto produto = new Produto();
        preencher(produto, request);
        produtoRepository.save(produto);

        BigDecimal quantidadeInicial = request.quantidadeInicial();
        if (quantidadeInicial != null && quantidadeInicial.signum() > 0) {
            produto.setQuantidade(quantidadeInicial);

            Movimentacao movimentacao = new Movimentacao();
            movimentacao.setProduto(produto);
            movimentacao.setTipo(TipoMovimentacao.ENTRADA);
            movimentacao.setQuantidade(quantidadeInicial);
            movimentacao.setSaldoResultante(quantidadeInicial);
            movimentacao.setData(OffsetDateTime.now(clock));
            movimentacao.setObservacao("Estoque inicial");
            movimentacao.setUsuario(usuario == null ? null : userRepository.getReferenceById(usuario.getId()));
            movimentacaoRepository.save(movimentacao);
        }

        return ProdutoResponse.from(produto);
    }

    /**
     * Título: Edita o produto, bloqueando troca de unidade quando já há movimentações
     * Explicação: Recebe id (UUID) e request (ProdutoRequest). Trava o produto e recusa (422) a troca de
     *   unidade de medida se ele já tiver movimentações; senão atualiza os dados. O saldo nunca muda por aqui.
     *   Devolve ProdutoResponse. Chamado por ProdutoController.
     */
    @Transactional
    public ProdutoResponse atualizar(UUID id, ProdutoRequest request) {
        Produto produto = buscarParaAtualizar(id);
        if (produto.getUnidadeMedida() != request.unidadeMedida()
                && movimentacaoRepository.existsByProdutoId(id)) {
            throw new BusinessException(
                    "Unidade de medida nao pode ser alterada depois que o produto possui movimentacoes.");
        }
        preencher(produto, request);
        return ProdutoResponse.from(produto);
    }

    /**
     * Título: Desativa o produto (exclusão lógica)
     * Explicação: Recebe id (UUID). Exclusão lógica, só marca ativo = false; o histórico continua. Não devolve
     *   nada. Chamado por ProdutoController.
     *
     * Exclusao logica: o produto deixa de aparecer nas listagens e nao aceita novas
     * movimentacoes, mas o historico de movimentacoes e preservado.
     */
    @Transactional
    public void excluir(UUID id) {
        buscarParaAtualizar(id).setAtivo(false);
    }

    /**
     * Título: Reativa o produto
     * Explicação: Recebe id (UUID). Marca ativo = true. Devolve ProdutoResponse. Chamado por
     *   ProdutoController.
     */
    @Transactional
    public ProdutoResponse reativar(UUID id) {
        Produto produto = buscarParaAtualizar(id);
        produto.setAtivo(true);
        return ProdutoResponse.from(produto);
    }

    /**
     * Título: Busca a entidade (usada por outros services)
     * Explicação: Recebe id (UUID). Busca o produto para outros services (404 se não existir). Devolve
     *   Produto. Chamado por AnaliseService e EstoqueService.
     */
    @Transactional(readOnly = true)
    public Produto buscarEntidade(UUID id) {
        return produtoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Produto nao encontrado."));
    }

    /**
     * Título: Busca o produto travando a linha no banco
     * Explicação: Recebe id (UUID). Busca travando a linha no banco (SELECT ... FOR UPDATE), a mesma trava das
     *   movimentações. Devolve Produto.
     */
    // Usa o mesmo bloqueio das movimentacoes para revalidar unidade e estado apos o commit anterior.
    private Produto buscarParaAtualizar(UUID id) {
        return produtoRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new ResourceNotFoundException("Produto nao encontrado."));
    }

    /**
     * Título: Copia os dados do pedido para a entidade
     * Explicação: Recebe produto (Produto) e request (ProdutoRequest). Não devolve nada.
     */
    private void preencher(Produto produto, ProdutoRequest request) {
        produto.setNome(request.nome().trim());
        produto.setDescricao(request.descricao() == null || request.descricao().isBlank()
                ? null : request.descricao().trim());
        produto.setEstoqueMinimo(request.estoqueMinimo());
        produto.setUnidadeMedida(request.unidadeMedida());
        produto.setPreco(request.preco());
        produto.setFornecedor(request.fornecedorId() == null
                ? null : fornecedorService.buscarEntidade(request.fornecedorId()));
    }
}
