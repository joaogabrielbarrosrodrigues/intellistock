package br.com.intellistock.intellistock_backend.controller;

import br.com.intellistock.intellistock_backend.dto.FornecedorRequest;
import br.com.intellistock.intellistock_backend.dto.FornecedorResponse;
import br.com.intellistock.intellistock_backend.service.FornecedorService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
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
 * Título: Rotas de fornecedores
 * Explicação: Controller REST dos fornecedores. Recebe os pedidos HTTP sobre fornecedores e repassa ao
 *   FornecedorService, onde estão as regras.
 */
@RestController
@RequestMapping("/api/fornecedores")
public class FornecedorController {

    private final FornecedorService fornecedorService;

    /**
     * Título: Construtor
     * Explicação: O Spring chama ao criar o objeto e entrega pronto o que ele precisa: fornecedorService
     *   (FornecedorService).
     */
    public FornecedorController(FornecedorService fornecedorService) {
        this.fornecedorService = fornecedorService;
    }

    /**
     * Título: Lista os fornecedores, com busca opcional por nome
     * Explicação: Recebe busca (String). Lista os fornecedores em ordem alfabética; com ?busca=, filtra por
     *   parte do nome. Devolve List<FornecedorResponse>.
     */
    @GetMapping
    public List<FornecedorResponse> listar(@RequestParam(required = false) String busca) {
        return fornecedorService.listar(busca);
    }

    /**
     * Título: Devolve um fornecedor pelo id
     * Explicação: Recebe id (UUID). Devolve um fornecedor (404 se não existir). Devolve FornecedorResponse.
     */
    @GetMapping("/{id}")
    public FornecedorResponse buscar(@PathVariable UUID id) {
        return fornecedorService.buscar(id);
    }

    /**
     * Título: Cadastra um fornecedor
     * Explicação: Recebe request (FornecedorRequest). Valida o FornecedorRequest e cadastra; responde 201.
     *   Devolve FornecedorResponse.
     */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public FornecedorResponse criar(@Valid @RequestBody FornecedorRequest request) {
        return fornecedorService.criar(request);
    }

    /**
     * Título: Edita um fornecedor
     * Explicação: Recebe id (UUID) e request (FornecedorRequest). Edita um fornecedor existente. Devolve
     *   FornecedorResponse.
     */
    @PutMapping("/{id}")
    public FornecedorResponse atualizar(@PathVariable UUID id, @Valid @RequestBody FornecedorRequest request) {
        return fornecedorService.atualizar(id, request);
    }

    /**
     * Título: Exclui um fornecedor sem vínculos
     * Explicação: Recebe id (UUID). Apaga o fornecedor se ele não tiver produtos nem contas; responde 204. Não
     *   devolve nada.
     */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@PathVariable UUID id) {
        fornecedorService.excluir(id);
    }
}
