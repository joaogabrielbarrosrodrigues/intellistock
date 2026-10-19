package br.com.intellistock.intellistock_backend;

import br.com.intellistock.intellistock_backend.support.IntegrationTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.OffsetDateTime;

import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.startsWith;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class EstoqueIntegrationTest extends IntegrationTest {

    private String token;

    @BeforeEach
    void setUp() throws Exception {
        token = registrarEAutenticar();
    }

    @Test
    void fornecedorValidaENormalizaCnpj() throws Exception {
        String id = criarFornecedor(token, "Laticinios Bom Leite", CNPJ_VALIDO);

        getJson(token, "/api/fornecedores/{id}", id)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cnpj").value("11222333000181"));

        criarFornecedor(token, "Fornecedor Alfanumerico", CNPJ_ALFANUMERICO);

        postJson(token, "/api/fornecedores", """
                {"nome": "Outro", "cnpj": "11.222.333/0001-81"}
                """).andExpect(status().isConflict());

        postJson(token, "/api/fornecedores", """
                {"nome": "Invalido", "cnpj": "11.222.333/0001-00"}
                """).andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.message").value("CNPJ invalido."));
    }

    @Test
    void cadastroDeProdutoComQuantidadeInicialGeraEntrada() throws Exception {
        String fornecedorId = criarFornecedor(token, "Distribuidora", null);

        String body = postJson(token, "/api/produtos", """
                {
                  "nome": "Leite Integral",
                  "quantidadeInicial": 40,
                  "estoqueMinimo": 50,
                  "unidadeMedida": "L",
                  "preco": 4.99,
                  "fornecedorId": "%s"
                }
                """.formatted(fornecedorId))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.quantidade").value(40.0))
                .andExpect(jsonPath("$.estoqueBaixo").value(true))
                .andExpect(jsonPath("$.fornecedor.nome").value("Distribuidora"))
                .andReturn().getResponse().getContentAsString();
        String produtoId = com.jayway.jsonpath.JsonPath.read(body, "$.id");

        getJson(token, "/api/movimentacoes?produtoId={id}", produtoId)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].tipo").value("ENTRADA"))
                .andExpect(jsonPath("$[0].observacao").value("Estoque inicial"));

        getJson(token, "/api/estoque/baixo")
                .andExpect(jsonPath("$[*].produtoId", hasItem(produtoId)));
    }

    @Test
    void produtoComDadosInvalidosRetorna400() throws Exception {
        postJson(token, "/api/produtos", """
                {"nome": "", "estoqueMinimo": -1, "unidadeMedida": "UN", "preco": 1}
                """)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields.nome").exists())
                .andExpect(jsonPath("$.fields.estoqueMinimo").exists());

        postJson(token, "/api/produtos", """
                {"nome": "X", "estoqueMinimo": 1, "unidadeMedida": "LITRO", "preco": 1}
                """)
                .andExpect(status().isBadRequest());
    }

    @Test
    void entradasESaidasAtualizamOSaldo() throws Exception {
        String produtoId = criarProduto(token, "Arroz 5kg", "10", "5");

        movimentar(token, produtoId, "ENTRADA", "5", null)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.saldoResultante").value(15.0));

        movimentar(token, produtoId, "SAIDA", "12.5", null)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.saldoResultante").value(2.5))
                .andExpect(jsonPath("$.usuarioNome").value("Usuario Teste"));

        getJson(token, "/api/estoque/{id}", produtoId)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.quantidade").value(2.5))
                .andExpect(jsonPath("$.situacao").value("BAIXO"))
                .andExpect(jsonPath("$.valorEmEstoque").value(6.25));

        getJson(token, "/api/movimentacoes?produtoId={id}&tipo=SAIDA", produtoId)
                .andExpect(jsonPath("$", hasSize(1)));
    }

    @Test
    void saidaMaiorQueOEstoqueERecusada() throws Exception {
        String produtoId = criarProduto(token, "Feijao", "3", "1");

        movimentar(token, produtoId, "SAIDA", "4", null)
                .andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.message", startsWith("Estoque insuficiente")));

        getJson(token, "/api/estoque/{id}", produtoId)
                .andExpect(jsonPath("$.quantidade").value(3.0));
    }

    @Test
    void saidaZeradaENegativaSaoInvalidasEDataFuturaERecusada() throws Exception {
        String produtoId = criarProduto(token, "Cafe", "3", "1");

        movimentar(token, produtoId, "SAIDA", "0", null).andExpect(status().isBadRequest());
        movimentar(token, produtoId, "SAIDA", "-1", null).andExpect(status().isBadRequest());
        movimentar(token, produtoId, "ENTRADA", "1", OffsetDateTime.now().plusDays(2).toString())
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields.data").exists());
    }

    @Test
    void exclusaoDeProdutoELogica() throws Exception {
        String produtoId = criarProduto(token, "Acucar", "5", "1");

        deleteJson(token, "/api/produtos/{id}", produtoId).andExpect(status().isNoContent());

        getJson(token, "/api/produtos")
                .andExpect(jsonPath("$[*].id", not(hasItem(produtoId))));
        getJson(token, "/api/produtos?incluirInativos=true")
                .andExpect(jsonPath("$[*].id", hasItem(produtoId)));
        getJson(token, "/api/produtos/{id}", produtoId)
                .andExpect(jsonPath("$.ativo").value(false));

        movimentar(token, produtoId, "ENTRADA", "1", null).andExpect(status().isUnprocessableContent());

        patchJson(token, "/api/produtos/{id}/reativar", produtoId)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ativo").value(true));
    }

    @Test
    void atualizacaoDeProdutoNaoAlteraSaldo() throws Exception {
        String produtoId = criarProduto(token, "Oleo", "8", "2");

        putJson(token, "/api/produtos/{id}", """
                {"nome": "Oleo de Soja", "quantidadeInicial": 999, "estoqueMinimo": 3, "unidadeMedida": "UN", "preco": 7.9}
                """, produtoId)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nome").value("Oleo de Soja"))
                .andExpect(jsonPath("$.quantidade").value(8.0))
                .andExpect(jsonPath("$.estoqueMinimo").value(3.0));
    }

    @Test
    void unidadeDeMedidaNaoMudaDepoisDeExistirHistorico() throws Exception {
        String produtoId = criarProduto(token, "Oleo", "8", "2");

        putJson(token, "/api/produtos/{id}", """
                {"nome": "Oleo", "estoqueMinimo": 2, "unidadeMedida": "L", "preco": 7.9}
                """, produtoId)
                .andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.message").value(
                        "Unidade de medida nao pode ser alterada depois que o produto possui movimentacoes."));

        getJson(token, "/api/produtos/{id}", produtoId)
                .andExpect(jsonPath("$.unidadeMedida").value("UN"));
    }

    @Test
    void fornecedorComProdutoVinculadoNaoPodeSerExcluido() throws Exception {
        String fornecedorId = criarFornecedor(token, "Fornecedor Vinculado", null);
        postJson(token, "/api/produtos", """
                {"nome": "Sal", "estoqueMinimo": 1, "unidadeMedida": "KG", "preco": 2, "fornecedorId": "%s"}
                """.formatted(fornecedorId)).andExpect(status().isCreated());

        deleteJson(token, "/api/fornecedores/{id}", fornecedorId).andExpect(status().isConflict());

        String livre = criarFornecedor(token, "Fornecedor Livre", null);
        deleteJson(token, "/api/fornecedores/{id}", livre).andExpect(status().isNoContent());
        getJson(token, "/api/fornecedores/{id}", livre).andExpect(status().isNotFound());
    }

    @Test
    void recursoInexistenteEParametroInvalidoRetornamErrosPadronizados() throws Exception {
        getJson(token, "/api/produtos/{id}", "00000000-0000-0000-0000-000000000000")
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Produto nao encontrado."));

        getJson(token, "/api/produtos/nao-e-uuid").andExpect(status().isBadRequest());
        getJson(token, "/api/rota-inexistente").andExpect(status().isNotFound());
    }
}
