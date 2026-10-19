package br.com.intellistock.intellistock_backend.support;

import com.jayway.jsonpath.JsonPath;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Base dos testes de integracao: sobe a aplicacao com H2, executa as requisicoes via MockMvc
 * (passando pelo filtro JWT real) e desfaz o que cada teste gravou ao final.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public abstract class IntegrationTest {

    /** CNPJs validos para os testes. */
    protected static final String CNPJ_VALIDO = "11.222.333/0001-81";
    protected static final String CNPJ_ALFANUMERICO = "12.ABC.345/01DE-35";

    @Autowired
    protected MockMvc mockMvc;

    protected String registrarEAutenticar() throws Exception {
        String email = "user-" + UUID.randomUUID() + "@example.com";
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"nome": "Usuario Teste", "email": "%s", "senha": "senha1234"}
                                """.formatted(email)))
                .andExpect(status().isCreated());

        String body = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email": "%s", "senha": "senha1234"}
                                """.formatted(email)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(body, "$.token");
    }

    protected ResultActions getJson(String token, String url, Object... vars) throws Exception {
        return mockMvc.perform(get(url, vars).header("Authorization", "Bearer " + token));
    }

    protected ResultActions postJson(String token, String url, String json, Object... vars) throws Exception {
        return mockMvc.perform(post(url, vars)
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json));
    }

    protected ResultActions putJson(String token, String url, String json, Object... vars) throws Exception {
        return mockMvc.perform(put(url, vars)
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json));
    }

    protected ResultActions patchJson(String token, String url, Object... vars) throws Exception {
        return mockMvc.perform(patch(url, vars).header("Authorization", "Bearer " + token));
    }

    protected ResultActions deleteJson(String token, String url, Object... vars) throws Exception {
        return mockMvc.perform(delete(url, vars).header("Authorization", "Bearer " + token));
    }

    protected String criarFornecedor(String token, String nome, String cnpj) throws Exception {
        String cnpjJson = cnpj == null ? "null" : "\"" + cnpj + "\"";
        String body = postJson(token, "/api/fornecedores", """
                {"nome": "%s", "cnpj": %s, "telefone": "(11) 99999-0000", "email": "contato@fornecedor.com"}
                """.formatted(nome, cnpjJson))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(body, "$.id");
    }

    protected String criarProduto(String token, String nome, String quantidadeInicial, String estoqueMinimo)
            throws Exception {
        return criarProduto(token, nome, quantidadeInicial, estoqueMinimo, "UN");
    }

    protected String criarProduto(String token, String nome, String quantidadeInicial, String estoqueMinimo,
                                  String unidadeMedida) throws Exception {
        String body = postJson(token, "/api/produtos", """
                {
                  "nome": "%s",
                  "descricao": "Produto de teste",
                  "quantidadeInicial": %s,
                  "estoqueMinimo": %s,
                  "unidadeMedida": "%s",
                  "preco": 2.50
                }
                """.formatted(nome, quantidadeInicial, estoqueMinimo, unidadeMedida))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(body, "$.id");
    }

    protected ResultActions movimentar(String token, String produtoId, String tipo, String quantidade, String data)
            throws Exception {
        String dataJson = data == null ? "null" : "\"" + data + "\"";
        return postJson(token, "/api/movimentacoes", """
                {"produtoId": "%s", "tipo": "%s", "quantidade": %s, "data": %s}
                """.formatted(produtoId, tipo, quantidade, dataJson));
    }
}
