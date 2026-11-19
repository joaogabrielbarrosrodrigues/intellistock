package br.com.intellistock.intellistock_backend.dto;

import org.springframework.http.HttpStatus;

import java.time.OffsetDateTime;
import java.util.Map;

/**
 * Título: Dados devolvidos pela API: Error
 * Explicação: DTO de saída padrão de todos os erros da API.
 */
public record ErrorResponse(
        OffsetDateTime timestamp,
        int status,
        String error,
        String message,
        String path,
        Map<String, String> fields
) {

    /**
     * Título: Monta o objeto de resposta
     * Explicação: Recebe status (HttpStatus), message (String), path (String) e fields (Map<String,String>).
     *   Devolve ErrorResponse.
     */
    public static ErrorResponse of(HttpStatus status, String message, String path, Map<String, String> fields) {
        return new ErrorResponse(OffsetDateTime.now(), status.value(), status.getReasonPhrase(), message, path, fields);
    }
}
