package br.com.intellistock.intellistock_backend.controller;

import br.com.intellistock.intellistock_backend.dto.MovimentacaoRequest;
import br.com.intellistock.intellistock_backend.dto.MovimentacaoResponse;
import br.com.intellistock.intellistock_backend.entity.TipoMovimentacao;
import br.com.intellistock.intellistock_backend.entity.User;
import br.com.intellistock.intellistock_backend.service.MovimentacaoService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Título: Rotas de entradas e saídas de estoque
 * Explicação: Controller REST das movimentações de estoque (entradas e saídas). É por aqui que o saldo dos
 *   produtos muda.
 */
@RestController
@RequestMapping("/api/movimentacoes")
public class MovimentacaoController {

    private final MovimentacaoService movimentacaoService;

    /**
     * Título: Construtor
     * Explicação: O Spring chama ao criar o objeto e entrega pronto o que ele precisa: movimentacaoService
     *   (MovimentacaoService).
     */
    public MovimentacaoController(MovimentacaoService movimentacaoService) {
        this.movimentacaoService = movimentacaoService;
    }

    /**
     * Título: Lista movimentações por produto, tipo, período e quantidade máxima
     * Explicação: Recebe produtoId (UUID), tipo (TipoMovimentacao), inicio (LocalDate), fim (LocalDate) e
     *   limite (int). Lista movimentações das mais recentes para as mais antigas, com filtros opcionais e no
     *   máximo limite itens (padrão 100, máximo 1000). Devolve List<MovimentacaoResponse>.
     */
    @GetMapping
    public List<MovimentacaoResponse> listar(
            @RequestParam(required = false) UUID produtoId,
            @RequestParam(required = false) TipoMovimentacao tipo,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate inicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fim,
            @RequestParam(defaultValue = "100") @Min(value = 1, message = "Limite minimo e 1.")
            @Max(value = 1000, message = "Limite maximo e 1000.") int limite) {
        return movimentacaoService.listar(produtoId, tipo, inicio, fim, limite);
    }

    /**
     * Título: Devolve uma movimentação pelo id
     * Explicação: Recebe id (UUID). Devolve uma movimentação. Devolve MovimentacaoResponse.
     */
    @GetMapping("/{id}")
    public MovimentacaoResponse buscar(@PathVariable UUID id) {
        return movimentacaoService.buscar(id);
    }

    /**
     * Título: Registra uma entrada ou saída, guardando quem lançou
     * Explicação: Recebe request (MovimentacaoRequest) e usuario (User). Recebe MovimentacaoRequest (produto,
     *   tipo, quantidade, data e observação opcionais) e o usuário logado, e repassa ao service, que atualiza o
     *   saldo. Responde 201 com o novo saldo. Devolve MovimentacaoResponse.
     */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MovimentacaoResponse registrar(@Valid @RequestBody MovimentacaoRequest request,
                                          @AuthenticationPrincipal User usuario) {
        return movimentacaoService.registrar(request, usuario);
    }
}
