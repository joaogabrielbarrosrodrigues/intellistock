package br.com.intellistock.intellistock_backend.dto;

import org.junit.jupiter.api.Test;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.json.JsonMapper;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

class SensitiveDtoTest {

    private final ObjectMapper mapper = JsonMapper.builder().build();

    @Test
    void loginOmiteSenhaDoTextoEPreservaContratoJson() {
        String senha = "senha-secreta-do-login";
        LoginRequest request = new LoginRequest("usuario@example.com", senha);

        assertFalse(request.toString().contains(senha));
        assertEquals(request, mapper.readValue(mapper.writeValueAsString(request), LoginRequest.class));
    }

    @Test
    void cadastroOmiteSenhaDoTextoEPreservaContratoJson() {
        String senha = "senha-secreta-do-cadastro";
        String codigo = "codigo-secreto";
        RegisterRequest request = new RegisterRequest("Usuario", "usuario@example.com", senha, codigo);

        assertFalse(request.toString().contains(senha));
        assertFalse(request.toString().contains(codigo));
        assertEquals(request, mapper.readValue(mapper.writeValueAsString(request), RegisterRequest.class));
    }

    @Test
    void respostaDeLoginOmiteTokenDoTextoEPreservaContratoJson() {
        String token = "cabecalho.conteudo.assinatura-secreta";
        AuthResponse response = new AuthResponse(token, "Bearer", null);

        assertFalse(response.toString().contains(token));
        assertEquals(response, mapper.readValue(mapper.writeValueAsString(response), AuthResponse.class));
    }
}
