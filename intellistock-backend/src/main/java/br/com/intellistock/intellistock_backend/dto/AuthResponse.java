package br.com.intellistock.intellistock_backend.dto;

public record AuthResponse(String token, String tokenType, UserResponse user) {

    @Override
    public String toString() {
        return "AuthResponse[token=<redigido>, tokenType=" + tokenType + ", user=" + user + "]";
    }
}
