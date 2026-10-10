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

@RestController
@RequestMapping("/api/fornecedores")
public class FornecedorController {

    private final FornecedorService fornecedorService;

    public FornecedorController(FornecedorService fornecedorService) {
        this.fornecedorService = fornecedorService;
    }

    @GetMapping
    public List<FornecedorResponse> listar(@RequestParam(required = false) String busca) {
        return fornecedorService.listar(busca);
    }

    @GetMapping("/{id}")
    public FornecedorResponse buscar(@PathVariable UUID id) {
        return fornecedorService.buscar(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public FornecedorResponse criar(@Valid @RequestBody FornecedorRequest request) {
        return fornecedorService.criar(request);
    }

    @PutMapping("/{id}")
    public FornecedorResponse atualizar(@PathVariable UUID id, @Valid @RequestBody FornecedorRequest request) {
        return fornecedorService.atualizar(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@PathVariable UUID id) {
        fornecedorService.excluir(id);
    }
}
