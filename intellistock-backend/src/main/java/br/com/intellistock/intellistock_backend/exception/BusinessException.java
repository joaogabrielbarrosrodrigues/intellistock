package br.com.intellistock.intellistock_backend.exception;

/**
 * Regra de negocio violada (ex.: estoque insuficiente). Retornada como 422.
 */
public class BusinessException extends RuntimeException {

    public BusinessException(String message) {
        super(message);
    }
}
