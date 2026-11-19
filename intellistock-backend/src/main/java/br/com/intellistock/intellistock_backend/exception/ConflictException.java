package br.com.intellistock.intellistock_backend.exception;

/**
 * Título: Erro de conflito com dados existentes (HTTP 409)
 * Explicação: Tipo de erro para conflito com dados existentes.
 *
 * Conflito com o estado atual dos dados (ex.: registro duplicado). Retornada como 409.
 */
public class ConflictException extends RuntimeException {

    /**
     * Título: Construtor
     * Explicação: O Spring chama ao criar o objeto e entrega pronto o que ele precisa: message (String).
     */
    public ConflictException(String message) {
        super(message);
    }
}
