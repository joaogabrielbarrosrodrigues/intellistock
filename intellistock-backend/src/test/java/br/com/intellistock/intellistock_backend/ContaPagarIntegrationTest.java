package br.com.intellistock.intellistock_backend;

import br.com.intellistock.intellistock_backend.support.IntegrationTest;
import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import java.time.LocalDate;

import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ContaPagarIntegrationTest extends IntegrationTest {

    private String token;
    private String fornecedorId;

    @BeforeEach
    void setUp() throws Exception {
        token = registrarEAutenticar();
        fornecedorId = criarFornecedor(token, "Fornecedor Financeiro", null);
    }

    @Test
    void contaComVencimentoPassadoApareceComoVencida() throws Exception {
        String id = criarConta("Boleto atrasado", "150.00", LocalDate.now().minusDays(3));

        getJson(token, "/api/contas/{id}", id)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("VENCIDA"))
                .andExpect(jsonPath("$.diasParaVencimento").value(-3))
                .andExpect(jsonPath("$.fornecedor.nome").value("Fornecedor Financeiro"));

        getJson(token, "/api/contas?status=VENCIDA").andExpect(jsonPath("$[*].id", hasItem(id)));
        getJson(token, "/api/contas?status=PENDENTE").andExpect(jsonPath("$[*].id", not(hasItem(id))));
    }

    @Test
    void fluxoDePagamentoCancelamentoEReabertura() throws Exception {
        String id = criarConta("Energia", "320.40", LocalDate.now().plusDays(5));

        mockMvc.perform(patch("/api/contas/{id}/pagar", id)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"dataPagamento\": \"%s\"}".formatted(LocalDate.now())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PAGA"))
                .andExpect(jsonPath("$.diasParaVencimento").doesNotExist());

        patchJson(token, "/api/contas/{id}/pagar", id).andExpect(status().isUnprocessableContent());
        putJson(token, "/api/contas/{id}", contaJson("Alterada", "1", LocalDate.now()), id)
                .andExpect(status().isUnprocessableContent());

        patchJson(token, "/api/contas/{id}/reabrir", id)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PENDENTE"))
                .andExpect(jsonPath("$.dataPagamento").doesNotExist());

        patchJson(token, "/api/contas/{id}/cancelar", id)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELADA"));
    }

    @Test
    void filtraPorFornecedorEPeriodoDeVencimento() throws Exception {
        String outroFornecedor = criarFornecedor(token, "Outro Fornecedor", null);
        String dentro = criarConta("Dentro", "10", LocalDate.now().plusDays(10));
        String fora = criarConta("Fora", "10", LocalDate.now().plusDays(40));

        getJson(token, "/api/contas?fornecedorId={f}&vencimentoInicio={i}&vencimentoFim={f2}",
                fornecedorId, LocalDate.now(), LocalDate.now().plusDays(30))
                .andExpect(jsonPath("$[*].id", hasItem(dentro)))
                .andExpect(jsonPath("$[*].id", not(hasItem(fora))));

        getJson(token, "/api/contas?fornecedorId={f}", outroFornecedor)
                .andExpect(jsonPath("$[*].id", not(hasItem(dentro))));

        getJson(token, "/api/contas?vencimentoInicio={i}&vencimentoFim={f}",
                LocalDate.now().plusDays(5), LocalDate.now())
                .andExpect(status().isUnprocessableContent());
    }

    @Test
    void validaCamposObrigatorios() throws Exception {
        postJson(token, "/api/contas", """
                {"descricao": "", "valor": 0}
                """)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields.fornecedorId").exists())
                .andExpect(jsonPath("$.fields.descricao").exists())
                .andExpect(jsonPath("$.fields.valor").exists())
                .andExpect(jsonPath("$.fields.dataVencimento").exists());
    }

    @Test
    void dashboardMostraContasProximasEVencidas() throws Exception {
        String proxima = criarConta("Aluguel", "1000.00", LocalDate.now().plusDays(2));
        criarConta("Atrasada", "50.00", LocalDate.now().minusDays(1));

        getJson(token, "/api/dashboard?diasVencimento=7")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.financeiro.contasProximasVencimento").value(1))
                .andExpect(jsonPath("$.financeiro.valorProximasVencimento").value(1000.0))
                .andExpect(jsonPath("$.financeiro.contasVencidas").value(1))
                .andExpect(jsonPath("$.financeiro.valorVencido").value(50.0))
                .andExpect(jsonPath("$.financeiro.valorEmAberto").value(1050.0))
                .andExpect(jsonPath("$.contasProximasVencimento[0].id").value(proxima));
    }

    @Test
    void fornecedorComContaVinculadaNaoPodeSerExcluido() throws Exception {
        criarConta("Vinculada", "10", LocalDate.now());
        deleteJson(token, "/api/fornecedores/{id}", fornecedorId).andExpect(status().isConflict());
    }

    private String criarConta(String descricao, String valor, LocalDate vencimento) throws Exception {
        String body = postJson(token, "/api/contas", contaJson(descricao, valor, vencimento))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(body, "$.id");
    }

    private String contaJson(String descricao, String valor, LocalDate vencimento) {
        return """
                {"fornecedorId": "%s", "descricao": "%s", "valor": %s, "dataVencimento": "%s"}
                """.formatted(fornecedorId, descricao, valor, vencimento);
    }
}
