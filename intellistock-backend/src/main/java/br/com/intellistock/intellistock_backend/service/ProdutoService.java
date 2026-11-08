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

@Service
public class ProdutoService {

    private final ProdutoRepository produtoRepository;
    private final MovimentacaoRepository movimentacaoRepository;
    private final UserRepository userRepository;
    private final FornecedorService fornecedorService;
    private final Clock clock;

    public ProdutoService(ProdutoRepository produtoRepository, MovimentacaoRepository movimentacaoRepository,
                          UserRepository userRepository, FornecedorService fornecedorService, Clock clock) {
        this.produtoRepository = produtoRepository;
        this.movimentacaoRepository = movimentacaoRepository;
        this.userRepository = userRepository;
        this.fornecedorService = fornecedorService;
        this.clock = clock;
    }

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

    @Transactional(readOnly = true)
    public ProdutoResponse buscar(UUID id) {
        return ProdutoResponse.from(buscarEntidade(id));
    }

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

    @Transactional
    public ProdutoResponse atualizar(UUID id, ProdutoRequest request) {
        Produto produto = buscarEntidade(id);
        if (produto.getUnidadeMedida() != request.unidadeMedida()
                && movimentacaoRepository.existsByProdutoId(id)) {
            throw new BusinessException(
                    "Unidade de medida nao pode ser alterada depois que o produto possui movimentacoes.");
        }
        preencher(produto, request);
        return ProdutoResponse.from(produto);
    }

    /**
     * Exclusao logica: o produto deixa de aparecer nas listagens e nao aceita novas
     * movimentacoes, mas o historico de movimentacoes e preservado.
     */
    @Transactional
    public void excluir(UUID id) {
        buscarEntidade(id).setAtivo(false);
    }

    @Transactional
    public ProdutoResponse reativar(UUID id) {
        Produto produto = buscarEntidade(id);
        produto.setAtivo(true);
        return ProdutoResponse.from(produto);
    }

    @Transactional(readOnly = true)
    public Produto buscarEntidade(UUID id) {
        return produtoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Produto nao encontrado."));
    }

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
