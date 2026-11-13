package br.com.intellistock.intellistock_backend.service;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertThrows;

class AuthServiceConfigurationTest {
    @Test
    void rejeitaCodigoNaoConfiguradoOuEmBranco() {
        assertThrows(IllegalStateException.class, () -> new AuthService(null, null, null, ""));
        assertThrows(IllegalStateException.class, () -> new AuthService(null, null, null, "  "));
    }
}
