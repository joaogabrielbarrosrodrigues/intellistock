package br.com.intellistock.intellistock_backend;

import br.com.intellistock.intellistock_backend.support.IntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.emptyString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AuthIntegrationTest extends IntegrationTest {

    private static final String REGISTRO = """
            {"nome": "Joao Gabriel", "email": "Joao@Example.com", "senha": "senha1234", "codigoAcesso": "codigo-de-teste"}
            """;

    @Test
    void cadastroRetornaUsuarioSemSenhaENormalizaEmail() throws Exception {
        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(REGISTRO))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email").value("joao@example.com"))
                .andExpect(jsonPath("$.senha").doesNotExist());
    }

    @Test
    void cadastroSemCodigoRetorna400() throws Exception {
        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content("""
                        {"nome": "Ana", "email": "ana@example.com", "senha": "senha1234"}
                        """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields.codigoAcesso").exists());
    }

    @Test
    void cadastroComCodigoInvalidoNaoCriaUsuario() throws Exception {
        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content("""
                        {"nome": "Ana", "email": "ana@example.com", "senha": "senha1234", "codigoAcesso": "errado"}
                        """))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Codigo de acesso invalido."));

        mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content("""
                        {"email": "ana@example.com", "senha": "senha1234"}
                        """))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void cadastroComEmailDuplicadoRetorna409() throws Exception {
        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(REGISTRO))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(REGISTRO))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("E-mail ja cadastrado."));
    }

    @Test
    void cadastroComSenhaCurtaRetorna400ComCampo() throws Exception {
        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content("""
                        {"nome": "Ana", "email": "ana@example.com", "senha": "123", "codigoAcesso": "codigo-de-teste"}
                        """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields.senha").exists());
    }

    @Test
    void senhaMultibyteAcimaDoLimiteNaoCausaErroInterno() throws Exception {
        String senha = "\u00e9".repeat(40);
        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content("""
                        {"nome": "Ana", "email": "ana@example.com", "senha": "%s", "codigoAcesso": "codigo-de-teste"}
                        """.formatted(senha)))
                .andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.message").value("Senha muito longa. Reduza a quantidade de caracteres."));

        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(REGISTRO))
                .andExpect(status().isCreated());
        mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content("""
                        {"email": "joao@example.com", "senha": "%s"}
                        """.formatted(senha)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void loginComSenhaErradaRetorna401() throws Exception {
        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(REGISTRO))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content("""
                        {"email": "joao@example.com", "senha": "senha-errada"}
                        """))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Credenciais invalidas."));
    }

    @Test
    void loginRetornaTokenQueDaAcessoAoUsuarioAutenticado() throws Exception {
        String token = registrarEAutenticar();

        getJson(token, "/api/users/me")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nome").value("Usuario Teste"))
                .andExpect(jsonPath("$.id", not(emptyString())));
    }

    @Test
    void endpointProtegidoSemTokenRetorna401EmJson() throws Exception {
        mockMvc.perform(get("/api/produtos"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.path").value("/api/produtos"));
    }

    @Test
    void tokenAdulteradoRetorna401() throws Exception {
        String token = registrarEAutenticar();
        String adulterado = token.substring(0, token.length() - 3) + "abc";

        getJson(adulterado, "/api/users/me").andExpect(status().isUnauthorized());
        getJson("lixo", "/api/users/me").andExpect(status().isUnauthorized());
    }
}
