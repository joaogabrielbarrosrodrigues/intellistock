package br.com.intellistock.intellistock_backend.dto;

import org.springframework.http.HttpStatus;

import java.time.OffsetDateTime;
import java.util.Map;

public record ErrorResponse(
        OffsetDateTime timestamp,
        int status,
        String error,
        String message,
        String path,
        Map<String, String> fields
) {

    public static ErrorResponse of(HttpStatus status, String message, String path, Map<String, String> fields) {
        return new ErrorResponse(OffsetDateTime.now(), status.value(), status.getReasonPhrase(), message, path, fields);
    }
}
