package br.com.intellistock.intellistock_backend.exception;

/**
 * Título: Erro de registro não encontrado (HTTP 404)
 * Explicação: Tipo de erro para registro inexistente.
 */
public class ResourceNotFoundException extends RuntimeException {

    /**
     * Título: Construtor
     * Explicação: O Spring chama ao criar o objeto e entrega pronto o que ele precisa: message (String).
     */
    public ResourceNotFoundException(String message) {
        super(message);
    }
}
