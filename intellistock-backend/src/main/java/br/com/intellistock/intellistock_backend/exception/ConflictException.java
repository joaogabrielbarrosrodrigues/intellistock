package br.com.intellistock.intellistock_backend.exception;

/**
 * Conflito com o estado atual dos dados (ex.: registro duplicado). Retornada como 409.
 */
public class ConflictException extends RuntimeException {

    public ConflictException(String message) {
        super(message);
    }
}
