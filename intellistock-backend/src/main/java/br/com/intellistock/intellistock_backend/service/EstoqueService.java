package br.com.intellistock.intellistock_backend.service;

import br.com.intellistock.intellistock_backend.dto.EstoqueResponse;
import br.com.intellistock.intellistock_backend.repository.ProdutoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Título: Montagem da visão de estoque
 * Explicação: Service que monta a visão de estoque. Não tem tabela própria nem regra de gravação:
 *   transforma produtos em linhas de estoque.
 */
@Service
public class EstoqueService {

    private final ProdutoRepository produtoRepository;
    private final ProdutoService produtoService;

    /**
     * Título: Construtor
     * Explicação: O Spring chama ao criar o objeto e entrega pronto o que ele precisa: produtoRepository
     *   (ProdutoRepository) e produtoService (ProdutoService).
     */
    public EstoqueService(ProdutoRepository produtoRepository, ProdutoService produtoService) {
        this.produtoRepository = produtoRepository;
        this.produtoService = produtoService;
    }

    /**
     * Título: Todos os produtos ativos com sua situação
     * Explicação: Busca os produtos ativos em ordem alfabética e converte cada um em EstoqueResponse, que
     *   calcula a situação e o valor em estoque. Devolve List<EstoqueResponse>. Chamado por EstoqueController.
     */
    @Transactional(readOnly = true)
    public List<EstoqueResponse> listar() {
        return produtoRepository.findByAtivoTrueOrderByNomeAsc().stream()
                .map(EstoqueResponse::from)
                .toList();
    }

    /**
     * Título: Só os de estoque baixo
     * Explicação: Usa a consulta de estoque baixo (saldo ≤ mínimo). Devolve List<EstoqueResponse>. Chamado por
     *   EstoqueController.
     *
     * Produtos ativos com quantidade menor ou igual ao estoque minimo cadastrado.
     */
    @Transactional(readOnly = true)
    public List<EstoqueResponse> listarBaixo() {
        return produtoRepository.findEstoqueBaixo().stream()
                .map(EstoqueResponse::from)
                .toList();
    }

    /**
     * Título: Um produto
     * Explicação: Recebe produtoId (UUID). Um produto, via ProdutoService.buscarEntidade. Devolve
     *   EstoqueResponse. Chamado por EstoqueController.
     */
    @Transactional(readOnly = true)
    public EstoqueResponse buscar(UUID produtoId) {
        return EstoqueResponse.from(produtoService.buscarEntidade(produtoId));
    }
}
