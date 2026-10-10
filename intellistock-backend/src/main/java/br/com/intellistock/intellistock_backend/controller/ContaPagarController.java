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

@RestController
@RequestMapping("/api/contas")
public class ContaPagarController {

    private final ContaPagarService contaPagarService;

    public ContaPagarController(ContaPagarService contaPagarService) {
        this.contaPagarService = contaPagarService;
    }

    @GetMapping
    public List<ContaPagarResponse> listar(
            @RequestParam(required = false) StatusConta status,
            @RequestParam(required = false) UUID fornecedorId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate vencimentoInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate vencimentoFim) {
        return contaPagarService.listar(status, fornecedorId, vencimentoInicio, vencimentoFim);
    }

    @GetMapping("/{id}")
    public ContaPagarResponse buscar(@PathVariable UUID id) {
        return contaPagarService.buscar(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ContaPagarResponse criar(@Valid @RequestBody ContaPagarRequest request) {
        return contaPagarService.criar(request);
    }

    @PutMapping("/{id}")
    public ContaPagarResponse atualizar(@PathVariable UUID id, @Valid @RequestBody ContaPagarRequest request) {
        return contaPagarService.atualizar(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@PathVariable UUID id) {
        contaPagarService.excluir(id);
    }

    @PatchMapping("/{id}/pagar")
    public ContaPagarResponse pagar(@PathVariable UUID id,
                                    @Valid @RequestBody(required = false) PagamentoRequest request) {
        return contaPagarService.pagar(id, request);
    }

    @PatchMapping("/{id}/cancelar")
    public ContaPagarResponse cancelar(@PathVariable UUID id) {
        return contaPagarService.cancelar(id);
    }

    @PatchMapping("/{id}/reabrir")
    public ContaPagarResponse reabrir(@PathVariable UUID id) {
        return contaPagarService.reabrir(id);
    }
}
