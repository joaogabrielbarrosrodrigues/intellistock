package br.com.intellistock.intellistock_backend.controller;

import br.com.intellistock.intellistock_backend.dto.ConsumoResponse;
import br.com.intellistock.intellistock_backend.dto.ConsumoSerieResponse;
import br.com.intellistock.intellistock_backend.dto.ConsumoSerieResponse.Agrupamento;
import br.com.intellistock.intellistock_backend.dto.ReposicaoResponse;
import br.com.intellistock.intellistock_backend.entity.UnidadeMedida;
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

/**
 * Título: Rotas das análises de consumo e reposição
 * Explicação: Controller REST das análises de consumo e reposição. Responde com números calculados a
 *   partir do histórico de saídas; nada é gravado.
 */
@RestController
@RequestMapping("/api/analises")
public class AnaliseController {

    private final AnaliseService analiseService;

    /**
     * Título: Construtor
     * Explicação: O Spring chama ao criar o objeto e entrega pronto o que ele precisa: analiseService
     *   (AnaliseService).
     */
    public AnaliseController(AnaliseService analiseService) {
        this.analiseService = analiseService;
    }

    /**
     * Título: Consumo médio e tendência de um produto ou de todos
     * Explicação: Recebe produtoId (UUID) e dias (Integer). Consumo total, média diária, semanal e mensal e
     *   tendência de um produto ou de todos. dias vai de 1 a 365. Devolve List<ConsumoResponse>.
     *
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
     * Título: Série de consumo por dia, semana ou mês
     * Explicação: Recebe produtoId (UUID), unidadeMedida (UnidadeMedida), agrupamento (Agrupamento) e dias
     *   (Integer). Pontos de um gráfico de consumo por dia, semana ou mês, de um produto ou de uma unidade de
     *   medida. Devolve ConsumoSerieResponse.
     *
     * Serie temporal do consumo para graficos. Se produtoId for omitido, unidadeMedida
     * passa a ser obrigatoria para impedir a soma de unidades incompatíveis.
     */
    @GetMapping("/consumo/serie")
    public ConsumoSerieResponse serie(
            @RequestParam(required = false) UUID produtoId,
            @RequestParam(required = false) UnidadeMedida unidadeMedida,
            @RequestParam(defaultValue = "DIARIO") Agrupamento agrupamento,
            @RequestParam(required = false) @Min(value = 1, message = "Minimo de 1 dia.")
            @Max(value = 730, message = "Maximo de 730 dias.") Integer dias) {
        return analiseService.serie(produtoId, unidadeMedida, agrupamento, dias);
    }

    /**
     * Título: Sugestões de compra calculadas a partir do consumo
     * Explicação: Recebe dias (Integer), diasCobertura (Integer), prazoEntregaDias (Integer), diasSeguranca
     *   (Integer) e todos (boolean). Sugestões de compra. Os parâmetros são opcionais (sem eles, valem os
     *   padrões do AnaliseProperties); todos=true mostra também os produtos que não precisam de compra. Devolve
     *   List<ReposicaoResponse>.
     *
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
