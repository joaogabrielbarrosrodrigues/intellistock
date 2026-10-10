package br.com.intellistock.intellistock_backend.controller;

import br.com.intellistock.intellistock_backend.dto.EstoqueResponse;
import br.com.intellistock.intellistock_backend.service.EstoqueService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/estoque")
public class EstoqueController {

    private final EstoqueService estoqueService;

    public EstoqueController(EstoqueService estoqueService) {
        this.estoqueService = estoqueService;
    }

    @GetMapping
    public List<EstoqueResponse> listar() {
        return estoqueService.listar();
    }

    @GetMapping("/baixo")
    public List<EstoqueResponse> listarBaixo() {
        return estoqueService.listarBaixo();
    }

    @GetMapping("/{produtoId}")
    public EstoqueResponse buscar(@PathVariable UUID produtoId) {
        return estoqueService.buscar(produtoId);
    }
}
