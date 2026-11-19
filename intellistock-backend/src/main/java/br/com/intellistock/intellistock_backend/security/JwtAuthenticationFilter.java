package br.com.intellistock.intellistock_backend.security;

import br.com.intellistock.intellistock_backend.entity.User;
import br.com.intellistock.intellistock_backend.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

/**
 * Título: Filtro que identifica o usuário pelo token em cada pedido
 * Explicação: Filtro HTTP que roda antes de qualquer controller, uma vez por pedido. É o ponto onde o
 *   backend descobre quem está fazendo o pedido.
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserRepository userRepository;

    /**
     * Título: Construtor
     * Explicação: O Spring chama ao criar o objeto e entrega pronto o que ele precisa: jwtService (JwtService)
     *   e userRepository (UserRepository).
     */
    public JwtAuthenticationFilter(JwtService jwtService, UserRepository userRepository) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
    }

    /**
     * Título: Executado uma vez por pedido
     * Explicação: Recebe request (HttpServletRequest), response (HttpServletResponse) e filterChain
     *   (FilterChain). Lê o cabeçalho Authorization; se começar com Bearer , pega o token e manda validar. Não
     *   devolve nada.
     */
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String authorization = request.getHeader("Authorization");

        if (authorization != null && authorization.startsWith("Bearer ")) {
            UUID userId = validarToken(authorization.substring(7));
            if (userId != null) {
                User user = userRepository.findById(userId).orElse(null);

                if (user != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                    UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                            user,
                            null,
                            List.of(new SimpleGrantedAuthority("ROLE_USER"))
                    );
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                }
            }
        }

        filterChain.doFilter(request, response);
    }

    /**
     * Título: Valida o token e devolve o id do usuário, ou null se o token for inválido
     * Explicação: Recebe token (String). Valida e devolve o id, ou null se o token estiver malformado,
     *   adulterado ou vencido. Devolve UUID.
     */
    private UUID validarToken(String token) {
        try {
            return jwtService.validateAndGetUserId(token);
        } catch (IllegalArgumentException | IndexOutOfBoundsException ignored) {
            // Token invalido: endpoints protegidos responderao 401.
            SecurityContextHolder.clearContext();
            return null;
        }
    }
}
