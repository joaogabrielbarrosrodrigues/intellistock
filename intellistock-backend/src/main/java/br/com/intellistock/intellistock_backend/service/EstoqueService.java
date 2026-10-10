package br.com.intellistock.intellistock_backend.service;

import br.com.intellistock.intellistock_backend.dto.EstoqueResponse;
import br.com.intellistock.intellistock_backend.repository.ProdutoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class EstoqueService {

    private final ProdutoRepository produtoRepository;
    private final ProdutoService produtoService;

    public EstoqueService(ProdutoRepository produtoRepository, ProdutoService produtoService) {
        this.produtoRepository = produtoRepository;
        this.produtoService = produtoService;
    }

    @Transactional(readOnly = true)
    public List<EstoqueResponse> listar() {
        return produtoRepository.findByAtivoTrueOrderByNomeAsc().stream()
                .map(EstoqueResponse::from)
                .toList();
    }

    /**
     * Produtos ativos com quantidade menor ou igual ao estoque minimo cadastrado.
     */
    @Transactional(readOnly = true)
    public List<EstoqueResponse> listarBaixo() {
        return produtoRepository.findEstoqueBaixo().stream()
                .map(EstoqueResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public EstoqueResponse buscar(UUID produtoId) {
        return EstoqueResponse.from(produtoService.buscarEntidade(produtoId));
    }
}
