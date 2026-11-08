package br.com.intellistock.intellistock_backend.security;

import br.com.intellistock.intellistock_backend.entity.User;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class JwtServiceTest {

    @Test
    void rejeitaSegredoCurto() {
        assertThrows(IllegalStateException.class, () -> new JwtService("curto", 120));
    }

    @Test
    void rejeitaExpiracaoNaoPositiva() {
        assertThrows(IllegalStateException.class, () -> new JwtService("a".repeat(32), 0));
    }

    @Test
    void geraEValidaTokenComConfiguracaoSegura() {
        JwtService service = new JwtService("a".repeat(32), 10);
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setEmail("usuario@example.com");

        assertEquals(user.getId(), service.validateAndGetUserId(service.generateToken(user)));
    }

    @Test
    void rejeitaTokenComSegmentoExtraVazio() {
        JwtService service = new JwtService("a".repeat(32), 10);
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setEmail("usuario@example.com");

        String token = service.generateToken(user);
        assertThrows(IllegalArgumentException.class, () -> service.validateAndGetUserId(token + "."));
    }
}
