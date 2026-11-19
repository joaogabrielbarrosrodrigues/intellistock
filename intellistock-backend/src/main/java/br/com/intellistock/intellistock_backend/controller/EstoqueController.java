package br.com.intellistock.intellistock_backend.controller;

import br.com.intellistock.intellistock_backend.dto.EstoqueResponse;
import br.com.intellistock.intellistock_backend.service.EstoqueService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

/**
 * Título: Rotas de consulta de estoque
 * Explicação: Controller REST de consulta de estoque. Não existe tabela "estoque" no banco: o saldo de
 *   cada produto fica na coluna quantidade da tabela produtos.
 */
@RestController
@RequestMapping("/api/estoque")
public class EstoqueController {

    private final EstoqueService estoqueService;

    /**
     * Título: Construtor
     * Explicação: O Spring chama ao criar o objeto e entrega pronto o que ele precisa: estoqueService
     *   (EstoqueService).
     */
    public EstoqueController(EstoqueService estoqueService) {
        this.estoqueService = estoqueService;
    }

    /**
     * Título: Saldo de todos os produtos ativos
     * Explicação: Devolve todos os produtos ativos com saldo, estoque mínimo, situação (NORMAL, BAIXO ou
     *   ZERADO) e valor em estoque (saldo × preço). Devolve List<EstoqueResponse>.
     */
    @GetMapping
    public List<EstoqueResponse> listar() {
        return estoqueService.listar();
    }

    /**
     * Título: Só os produtos com saldo menor ou igual ao mínimo
     * Explicação: Devolve só os produtos ativos com saldo menor ou igual ao mínimo. Devolve
     *   List<EstoqueResponse>.
     */
    @GetMapping("/baixo")
    public List<EstoqueResponse> listarBaixo() {
        return estoqueService.listarBaixo();
    }

    /**
     * Título: Saldo de um produto
     * Explicação: Recebe produtoId (UUID). Devolve o saldo de um produto. Devolve EstoqueResponse.
     */
    @GetMapping("/{produtoId}")
    public EstoqueResponse buscar(@PathVariable UUID produtoId) {
        return estoqueService.buscar(produtoId);
    }
}
