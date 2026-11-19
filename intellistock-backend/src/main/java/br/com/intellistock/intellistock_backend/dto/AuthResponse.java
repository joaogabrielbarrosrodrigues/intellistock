package br.com.intellistock.intellistock_backend.dto;

/**
 * Título: Dados devolvidos pela API: Auth
 * Explicação: DTO de saída (record) com a resposta do login.
 */
public record AuthResponse(String token, String tokenType, UserResponse user) {

    /**
     * Título: Texto do objeto para logs
     * Explicação: Monta o texto usado em logs escondendo dados sensíveis (senha, código ou token).
     */
    @Override
    public String toString() {
        return "AuthResponse[token=<redigido>, tokenType=" + tokenType + ", user=" + user + "]";
    }
}
