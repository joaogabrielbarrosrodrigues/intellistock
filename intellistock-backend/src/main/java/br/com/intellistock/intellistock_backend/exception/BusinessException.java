package br.com.intellistock.intellistock_backend.exception;

/**
 * Título: Erro de regra de negócio (HTTP 422)
 * Explicação: Tipo de erro para regra de negócio violada.
 *
 * Regra de negocio violada (ex.: estoque insuficiente). Retornada como 422.
 */
public class BusinessException extends RuntimeException {

    /**
     * Título: Construtor
     * Explicação: O Spring chama ao criar o objeto e entrega pronto o que ele precisa: message (String).
     */
    public BusinessException(String message) {
        super(message);
    }
}
