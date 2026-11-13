package br.com.intellistock.intellistock_backend.security;

import br.com.intellistock.intellistock_backend.entity.User;
import br.com.intellistock.intellistock_backend.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;

import java.lang.reflect.Proxy;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

class JwtAuthenticationFilterTest {
    private final JwtService jwt = new JwtService("a".repeat(32), 10);
    private final UserRepository repositoryIndisponivel = (UserRepository) Proxy.newProxyInstance(
            UserRepository.class.getClassLoader(), new Class<?>[]{UserRepository.class},
            (proxy, method, args) -> { throw new IllegalStateException("Banco indisponivel"); });
    private final JwtAuthenticationFilter filter = new JwtAuthenticationFilter(jwt, repositoryIndisponivel);

    @AfterEach
    void limparContexto() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void tokenInvalidoContinuaSemConsultarBanco() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer invalido");
        MockFilterChain chain = new MockFilterChain();

        filter.doFilter(request, new MockHttpServletResponse(), chain);

        assertNotNull(chain.getRequest());
    }

    @Test
    void falhaNoBancoNaoEhTratadaComoTokenInvalido() {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setEmail("teste@example.com");
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer " + jwt.generateToken(user));

        assertThrows(IllegalStateException.class,
                () -> filter.doFilter(request, new MockHttpServletResponse(), new MockFilterChain()));
    }
}
