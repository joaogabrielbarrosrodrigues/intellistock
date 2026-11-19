package br.com.intellistock.intellistock_backend.controller;

import br.com.intellistock.intellistock_backend.dto.ContaPagarRequest;
import br.com.intellistock.intellistock_backend.dto.ContaPagarResponse;
import br.com.intellistock.intellistock_backend.dto.PagamentoRequest;
import br.com.intellistock.intellistock_backend.entity.StatusConta;
import br.com.intellistock.intellistock_backend.service.ContaPagarService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
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

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Título: Rotas de contas a pagar
 * Explicação: Controller REST das contas a pagar. Recebe os pedidos de cadastro e de mudança de situação
 *   das contas e repassa ao ContaPagarService.
 */
@RestController
@RequestMapping("/api/contas")
public class ContaPagarController {

    private final ContaPagarService contaPagarService;

    /**
     * Título: Construtor
     * Explicação: O Spring chama ao criar o objeto e entrega pronto o que ele precisa: contaPagarService
     *   (ContaPagarService).
     */
    public ContaPagarController(ContaPagarService contaPagarService) {
        this.contaPagarService = contaPagarService;
    }

    /**
     * Título: Lista contas por estado, fornecedor e faixa de vencimento
     * Explicação: Recebe status (StatusConta), fornecedorId (UUID), vencimentoInicio (LocalDate) e
     *   vencimentoFim (LocalDate). Lista contas por ordem de vencimento, com filtros opcionais. Devolve
     *   List<ContaPagarResponse>.
     */
    @GetMapping
    public List<ContaPagarResponse> listar(
            @RequestParam(required = false) StatusConta status,
            @RequestParam(required = false) UUID fornecedorId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate vencimentoInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate vencimentoFim) {
        return contaPagarService.listar(status, fornecedorId, vencimentoInicio, vencimentoFim);
    }

    /**
     * Título: Devolve uma conta pelo id
     * Explicação: Recebe id (UUID). Devolve uma conta. Devolve ContaPagarResponse.
     */
    @GetMapping("/{id}")
    public ContaPagarResponse buscar(@PathVariable UUID id) {
        return contaPagarService.buscar(id);
    }

    /**
     * Título: Cadastra uma conta
     * Explicação: Recebe request (ContaPagarRequest). Cadastra uma conta; responde 201. Devolve
     *   ContaPagarResponse.
     */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ContaPagarResponse criar(@Valid @RequestBody ContaPagarRequest request) {
        return contaPagarService.criar(request);
    }

    /**
     * Título: Edita uma conta em aberto
     * Explicação: Recebe id (UUID) e request (ContaPagarRequest). Edita uma conta em aberto. Devolve
     *   ContaPagarResponse.
     */
    @PutMapping("/{id}")
    public ContaPagarResponse atualizar(@PathVariable UUID id, @Valid @RequestBody ContaPagarRequest request) {
        return contaPagarService.atualizar(id, request);
    }

    /**
     * Título: Exclui uma conta definitivamente
     * Explicação: Recebe id (UUID). Apaga a conta definitivamente; responde 204. Não devolve nada.
     */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@PathVariable UUID id) {
        contaPagarService.excluir(id);
    }

    /**
     * Título: Marca a conta como paga, com data opcional
     * Explicação: Recebe id (UUID) e request (PagamentoRequest). Marca como paga, com a data enviada
     *   (opcional, PagamentoRequest) ou a de hoje. Devolve ContaPagarResponse.
     */
    @PatchMapping("/{id}/pagar")
    public ContaPagarResponse pagar(@PathVariable UUID id,
                                    @Valid @RequestBody(required = false) PagamentoRequest request) {
        return contaPagarService.pagar(id, request);
    }

    /**
     * Título: Cancela uma conta em aberto
     * Explicação: Recebe id (UUID). Marca como cancelada. Devolve ContaPagarResponse.
     */
    @PatchMapping("/{id}/cancelar")
    public ContaPagarResponse cancelar(@PathVariable UUID id) {
        return contaPagarService.cancelar(id);
    }

    /**
     * Título: Volta uma conta paga ou cancelada para pendente
     * Explicação: Recebe id (UUID). Volta uma conta paga ou cancelada para pendente. Devolve
     *   ContaPagarResponse.
     */
    @PatchMapping("/{id}/reabrir")
    public ContaPagarResponse reabrir(@PathVariable UUID id) {
        return contaPagarService.reabrir(id);
    }
}
