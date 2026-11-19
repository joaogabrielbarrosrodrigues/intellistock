package br.com.intellistock.intellistock_backend.controller;

import br.com.intellistock.intellistock_backend.dto.DashboardResponse;
import br.com.intellistock.intellistock_backend.service.DashboardService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Título: Rota do resumo da tela inicial
 * Explicação: Controller REST da tela inicial do app. Tem uma única rota que devolve o resumo inteiro de
 *   uma vez, para o app não precisar fazer várias chamadas.
 */
@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    /**
     * Título: Construtor
     * Explicação: O Spring chama ao criar o objeto e entrega pronto o que ele precisa: dashboardService
     *   (DashboardService).
     */
    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    /**
     * Título: Devolve o resumo; <code>diasVencimento</code> define o que conta como "próximo do vencimento"
     * Explicação: Recebe diasVencimento (int). Devolve o DashboardResponse. diasVencimento (padrão 7, até 90)
     *   define quantos dias à frente contam como "próximo do vencimento". Devolve DashboardResponse.
     */
    @GetMapping
    public DashboardResponse resumo(
            @RequestParam(defaultValue = "7") @Min(value = 0, message = "Nao pode ser negativo.")
            @Max(value = 90, message = "Maximo de 90 dias.") int diasVencimento) {
        return dashboardService.resumo(diasVencimento);
    }
}
