package br.com.intellistock.intellistock_backend.controller;

import br.com.intellistock.intellistock_backend.dto.DashboardResponse;
import br.com.intellistock.intellistock_backend.service.DashboardService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping
    public DashboardResponse resumo(
            @RequestParam(defaultValue = "7") @Min(value = 0, message = "Nao pode ser negativo.")
            @Max(value = 90, message = "Maximo de 90 dias.") int diasVencimento) {
        return dashboardService.resumo(diasVencimento);
    }
}
