package br.com.intellistock.intellistock_backend;

import br.com.intellistock.intellistock_backend.support.IntegrationTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;

import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AnaliseIntegrationTest extends IntegrationTest {

    private String token;
    private String produtoId;

    /**
     * Cenario: 200 unidades iniciais, 30 consumidas ha 20 dias (metade antiga da janela de 30 dias)
     * e 90 consumidas ha 5 dias (metade recente). Saldo final: 80.
     */
    @BeforeEach
    void setUp() throws Exception {
        token = registrarEAutenticar();
        produtoId = criarProduto(token, "Leite", "200", "10");
        movimentar(token, produtoId, "SAIDA", "30", diasAtras(20)).andExpect(status().isCreated());
        movimentar(token, produtoId, "SAIDA", "90", diasAtras(5)).andExpect(status().isCreated());
    }

    @Test
    void calculaMediasETendenciaDeAlta() throws Exception {
        getJson(token, "/api/analises/consumo?produtoId={id}&dias=30", produtoId)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].totalConsumido").value(120.0))
                .andExpect(jsonPath("$[0].mediaDiaria").value(4.0))
                .andExpect(jsonPath("$[0].mediaSemanal").value(28.0))
                .andExpect(jsonPath("$[0].mediaMensal").value(120.0))
                .andExpect(jsonPath("$[0].mediaDiariaRecente").value(6.0))
                .andExpect(jsonPath("$[0].tendencia").value("ALTA"))
                .andExpect(jsonPath("$[0].variacaoPercentual").value(200.0));
    }

    @Test
    void sugereReposicaoUsandoConsumoRecenteQuandoHaTendenciaDeAlta() throws Exception {
        // base = 6/dia; seguranca = max(10, 6x7) = 42; ponto de pedido = 6x7 + 42 = 84 >= saldo 80
        // sugerido = 6 x (30 + 7) + 42 - 80 = 184
        String filtro = "$[?(@.produtoId == '" + produtoId + "')]";
        getJson(token, "/api/analises/reposicao")
                .andExpect(status().isOk())
                .andExpect(jsonPath(filtro + ".consumoBaseDiario", contains(6.0)))
                .andExpect(jsonPath(filtro + ".estoqueSeguranca", contains(42.0)))
                .andExpect(jsonPath(filtro + ".pontoPedido", contains(84.0)))
                .andExpect(jsonPath(filtro + ".precisaRepor", contains(true)))
                .andExpect(jsonPath(filtro + ".quantidadeSugerida", contains(184)))
                .andExpect(jsonPath(filtro + ".custoEstimado", contains(460.0)))
                .andExpect(jsonPath(filtro + ".diasRestantes", contains(13.3)))
                .andExpect(jsonPath(filtro + ".prioridade", contains("BAIXA")));
    }

    @Test
    void parametrosDeReposicaoPodemSerAjustados() throws Exception {
        // Prazo de 14 dias: 80 / 6 = 13,3 dias restantes, menos que o prazo => prioridade ALTA
        String filtro = "$[?(@.produtoId == '" + produtoId + "')]";
        getJson(token, "/api/analises/reposicao?prazoEntregaDias=14")
                .andExpect(jsonPath(filtro + ".prioridade", contains("ALTA")));

        getJson(token, "/api/analises/reposicao?diasCobertura=0").andExpect(status().isBadRequest());
    }

    @Test
    void serieDiariaTemUmPontoPorDiaESomaOConsumo() throws Exception {
        getJson(token, "/api/analises/consumo/serie?produtoId={id}&agrupamento=DIARIO&dias=30", produtoId)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.produtoNome").value("Leite"))
                .andExpect(jsonPath("$.pontos", hasSize(30)))
                .andExpect(jsonPath("$.pontos[24].quantidade").value(90.0))
                .andExpect(jsonPath("$.pontos[9].quantidade").value(30.0));

        getJson(token, "/api/analises/consumo/serie?agrupamento=MENSAL")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.produtoId").doesNotExist());
    }

    @Test
    void dashboardConsolidaIndicadores() throws Exception {
        getJson(token, "/api/dashboard")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estoque.totalProdutos", greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.sugestoesReposicao", greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.movimentacoesRecentes", hasSize(3)))
                .andExpect(jsonPath("$.consumoMensal", hasSize(6)));
    }

    private static String diasAtras(int dias) {
        return LocalDate.now().minusDays(dias).atTime(LocalTime.NOON)
                .atZone(ZoneId.systemDefault()).toOffsetDateTime().toString();
    }
}
