package br.com.intellistock.intellistock_backend.controller;

import br.com.intellistock.intellistock_backend.dto.ProdutoRequest;
import br.com.intellistock.intellistock_backend.dto.ProdutoResponse;
import br.com.intellistock.intellistock_backend.entity.User;
import br.com.intellistock.intellistock_backend.service.ProdutoService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

/**
 * Título: Rotas de produtos
 * Explicação: Controller REST dos produtos. Recebe os pedidos do app sobre o catálogo de produtos e
 *   repassa ao ProdutoService.
 */
@RestController
@RequestMapping("/api/produtos")
public class ProdutoController {

    private final ProdutoService produtoService;

    /**
     * Título: Construtor
     * Explicação: O Spring chama ao criar o objeto e entrega pronto o que ele precisa: produtoService
     *   (ProdutoService).
     */
    public ProdutoController(ProdutoService produtoService) {
        this.produtoService = produtoService;
    }

    /**
     * Título: Lista produtos, com busca por nome, filtro por fornecedor e opção de incluir inativos
     * Explicação: Recebe busca (String), fornecedorId (UUID) e incluirInativos (boolean). Lista produtos em
     *   ordem alfabética, com filtros opcionais por nome e por fornecedor; por padrão esconde os desativados.
     *   Devolve List<ProdutoResponse>.
     */
    @GetMapping
    public List<ProdutoResponse> listar(@RequestParam(required = false) String busca,
                                        @RequestParam(required = false) UUID fornecedorId,
                                        @RequestParam(defaultValue = "false") boolean incluirInativos) {
        return produtoService.listar(busca, fornecedorId, incluirInativos);
    }

    /**
     * Título: Devolve um produto pelo id
     * Explicação: Recebe id (UUID). Devolve um produto. Devolve ProdutoResponse.
     */
    @GetMapping("/{id}")
    public ProdutoResponse buscar(@PathVariable UUID id) {
        return produtoService.buscar(id);
    }

    /**
     * Título: Cadastra um produto
     * Explicação: Recebe request (ProdutoRequest) e usuario (User). Cadastra um produto. Recebe também o
     *   usuário logado, para registrar quem lançou o estoque inicial. Responde 201. Devolve ProdutoResponse.
     */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProdutoResponse criar(@Valid @RequestBody ProdutoRequest request, @AuthenticationPrincipal User usuario) {
        return produtoService.criar(request, usuario);
    }

    /**
     * Título: Edita um produto (o saldo não muda por aqui)
     * Explicação: Recebe id (UUID) e request (ProdutoRequest). Edita nome, descrição, mínimo, unidade, preço e
     *   fornecedor. O saldo não muda por aqui. Devolve ProdutoResponse.
     */
    @PutMapping("/{id}")
    public ProdutoResponse atualizar(@PathVariable UUID id, @Valid @RequestBody ProdutoRequest request) {
        return produtoService.atualizar(id, request);
    }

    /**
     * Título: Desativa o produto (exclusão lógica)
     * Explicação: Recebe id (UUID). Desativa o produto (não apaga do banco); responde 204. Não devolve nada.
     */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@PathVariable UUID id) {
        produtoService.excluir(id);
    }

    /**
     * Título: Reativa um produto desativado
     * Explicação: Recebe id (UUID). Volta a ativar um produto desativado. Devolve ProdutoResponse.
     */
    @PatchMapping("/{id}/reativar")
    public ProdutoResponse reativar(@PathVariable UUID id) {
        return produtoService.reativar(id);
    }
}
