package br.com.intellistock.intellistock_backend.security;

import br.com.intellistock.intellistock_backend.dto.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

/**
 * Título: Respostas JSON para os erros de segurança 401 e 403
 * Explicação: Componente que escreve as respostas de erro do Spring Security (401 e 403) no mesmo formato
 *   JSON dos outros erros da API.
 *
 * Garante que erros de autenticacao (401) e autorizacao (403) gerados pelo Spring Security
 * sigam o mesmo formato JSON dos demais erros da API.
 */
@Component
public class JsonSecurityErrorHandler implements AuthenticationEntryPoint, AccessDeniedHandler {

    private final ObjectMapper objectMapper;

    /**
     * Título: Construtor
     * Explicação: O Spring chama ao criar o objeto e entrega pronto o que ele precisa: objectMapper
     *   (ObjectMapper).
     */
    public JsonSecurityErrorHandler(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    /**
     * Título: Chamado quando falta autenticação: responde 401
     * Explicação: Recebe request (HttpServletRequest), response (HttpServletResponse) e authException
     *   (AuthenticationException). Chamado quando o pedido não tem autenticação válida; responde 401 "Token de
     *   acesso ausente, invalido ou expirado.". Não devolve nada.
     */
    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response,
                         AuthenticationException authException) throws IOException {
        write(response, request, HttpStatus.UNAUTHORIZED, "Token de acesso ausente, invalido ou expirado.");
    }

    /**
     * Título: Chamado quando falta permissão: responde 403
     * Explicação: Recebe request (HttpServletRequest), response (HttpServletResponse) e accessDeniedException
     *   (AccessDeniedException). Chamado quando falta permissão; responde 403 "Acesso negado.". Não devolve
     *   nada.
     */
    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response,
                       AccessDeniedException accessDeniedException) throws IOException {
        write(response, request, HttpStatus.FORBIDDEN, "Acesso negado.");
    }

    /**
     * Título: Escreve o JSON de erro na resposta
     * Explicação: Recebe response (HttpServletResponse), request (HttpServletRequest), status (HttpStatus) e
     *   message (String). Monta um ErrorResponse e o converte em JSON na resposta. Não devolve nada.
     */
    private void write(HttpServletResponse response, HttpServletRequest request, HttpStatus status, String message)
            throws IOException {
        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        objectMapper.writeValue(response.getOutputStream(),
                ErrorResponse.of(status, message, request.getRequestURI(), null));
    }
}
