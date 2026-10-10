package br.com.intellistock.intellistock_backend.controller;

import br.com.intellistock.intellistock_backend.dto.ConsumoResponse;
import br.com.intellistock.intellistock_backend.dto.ConsumoSerieResponse;
import br.com.intellistock.intellistock_backend.dto.ConsumoSerieResponse.Agrupamento;
import br.com.intellistock.intellistock_backend.dto.ReposicaoResponse;
import br.com.intellistock.intellistock_backend.service.AnaliseService;
import br.com.intellistock.intellistock_backend.service.AnaliseService.ParametrosReposicao;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/analises")
public class AnaliseController {

    private final AnaliseService analiseService;

    public AnaliseController(AnaliseService analiseService) {
        this.analiseService = analiseService;
    }

    /**
     * Consumo medio diario, semanal e mensal e tendencia. Sem produtoId retorna todos os produtos ativos.
     */
    @GetMapping("/consumo")
    public List<ConsumoResponse> consumo(
            @RequestParam(required = false) UUID produtoId,
            @RequestParam(required = false) @Min(value = 1, message = "Minimo de 1 dia.")
            @Max(value = 365, message = "Maximo de 365 dias.") Integer dias) {
        return analiseService.consumo(produtoId, dias);
    }

    /**
     * Serie temporal do consumo para graficos. Sem produtoId consolida todos os produtos.
     */
    @GetMapping("/consumo/serie")
    public ConsumoSerieResponse serie(
            @RequestParam(required = false) UUID produtoId,
            @RequestParam(defaultValue = "DIARIO") Agrupamento agrupamento,
            @RequestParam(required = false) @Min(value = 1, message = "Minimo de 1 dia.")
            @Max(value = 730, message = "Maximo de 730 dias.") Integer dias) {
        return analiseService.serie(produtoId, agrupamento, dias);
    }

    /**
     * Sugestoes de reposicao. Por padrao retorna apenas produtos que precisam ser repostos;
     * use todos=true para ver o calculo de todos os produtos ativos.
     */
    @GetMapping("/reposicao")
    public List<ReposicaoResponse> reposicao(
            @RequestParam(required = false) @Min(value = 1, message = "Minimo de 1 dia.")
            @Max(value = 365, message = "Maximo de 365 dias.") Integer dias,
            @RequestParam(required = false) @Min(value = 1, message = "Minimo de 1 dia.")
            @Max(value = 365, message = "Maximo de 365 dias.") Integer diasCobertura,
            @RequestParam(required = false) @Min(value = 0, message = "Prazo nao pode ser negativo.")
            @Max(value = 365, message = "Maximo de 365 dias.") Integer prazoEntregaDias,
            @RequestParam(required = false) @Min(value = 0, message = "Dias de seguranca nao pode ser negativo.")
            @Max(value = 365, message = "Maximo de 365 dias.") Integer diasSeguranca,
            @RequestParam(defaultValue = "false") boolean todos) {
        return analiseService.reposicao(
                new ParametrosReposicao(dias, diasCobertura, prazoEntregaDias, diasSeguranca), todos);
    }
}
