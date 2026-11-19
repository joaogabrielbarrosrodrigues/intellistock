package br.com.intellistock.intellistock_backend.config;

import br.com.intellistock.intellistock_backend.repository.UserRepository;
import br.com.intellistock.intellistock_backend.security.JsonSecurityErrorHandler;
import br.com.intellistock.intellistock_backend.security.JwtAuthenticationFilter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;
import java.util.Locale;

/**
 * Título: Configuração de segurança da API
 * Explicação: Classe de configuração da segurança da API, usando o Spring Security. Define quem pode
 *   acessar o quê e como o login é verificado.
 */
@Configuration
public class SecurityConfig {

    /**
     * Título: Monta a cadeia de filtros de segurança que todo pedido HTTP atravessa antes de chegar a um controller
     * Explicação: Recebe http (HttpSecurity), jwtAuthenticationFilter (JwtAuthenticationFilter),
     *   authenticationProvider (AuthenticationProvider) e securityErrorHandler (JsonSecurityErrorHandler). Monta
     *   as regras aplicadas a todo pedido. Libera sem token só /api/auth/register, /api/auth/login e /error;
     *   todo o resto exige usuário autenticado. Desliga sessão (cada pedido se identifica pelo token), desliga
     *   CSRF (não se aplica a API com token) e coloca o JwtAuthenticationFilter antes de qualquer controller.
     *   Devolve SecurityFilterChain.
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, JwtAuthenticationFilter jwtAuthenticationFilter,
                                                   AuthenticationProvider authenticationProvider,
                                                   JsonSecurityErrorHandler securityErrorHandler) throws Exception {
        return http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(Customizer.withDefaults())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authenticationProvider(authenticationProvider)
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/api/auth/register", "/api/auth/login", "/error").permitAll()
                        .anyRequest().authenticated()
                )
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint(securityErrorHandler)
                        .accessDeniedHandler(securityErrorHandler)
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    /**
     * Título: Define quais sites podem chamar a API pelo navegador (necessário para o app na versão web)
     * Explicação: Recebe allowedOrigins (List<String>). Diz quais endereços web podem chamar a API pelo
     *   navegador (o Expo web em localhost:8081 e 19006), quais métodos e cabeçalhos são aceitos. Devolve
     *   CorsConfigurationSource.
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource(
            @Value("${app.cors.allowed-origins}") List<String> allowedOrigins) {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(allowedOrigins);
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type"));
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", configuration);
        return source;
    }

    /**
     * Título: Ensina o Spring Security a buscar um usuário pelo e-mail no banco durante o login
     * Explicação: Recebe userRepository (UserRepository). Ensina o Spring a encontrar um usuário pelo e-mail
     *   na tabela users durante o login. Devolve UserDetailsService.
     */
    @Bean
    public UserDetailsService userDetailsService(UserRepository userRepository) {
        return username -> userRepository.findByEmail(username.toLowerCase(Locale.ROOT))
                .map(user -> new org.springframework.security.core.userdetails.User(
                        user.getEmail(),
                        user.getSenha(),
                        List.of()
                ))
                .orElseThrow(() -> new UsernameNotFoundException("Usuario nao encontrado."));
    }

    /**
     * Título: Junta a busca de usuário com o comparador de senhas
     * Explicação: Recebe userDetailsService (UserDetailsService) e passwordEncoder (PasswordEncoder). Junta
     *   essa busca com o comparador de senhas BCrypt. É quem confere se a senha digitada bate com a gravada.
     *   Devolve AuthenticationProvider.
     */
    @Bean
    public AuthenticationProvider authenticationProvider(UserDetailsService userDetailsService,
                                                         PasswordEncoder passwordEncoder) {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder);
        return provider;
    }

    /**
     * Título: Expõe o gerenciador de autenticação para o AuthService usar no login
     * Explicação: Recebe configuration (AuthenticationConfiguration). Expõe o verificador para o AuthService
     *   usar. Devolve AuthenticationManager.
     */
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }

    /**
     * Título: Define o BCrypt como algoritmo para embaralhar e comparar senhas
     * Explicação: Define o BCrypt como forma de guardar e comparar senhas. Devolve PasswordEncoder.
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
