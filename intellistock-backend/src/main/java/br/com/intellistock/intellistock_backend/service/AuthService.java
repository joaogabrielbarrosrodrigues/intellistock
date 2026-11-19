package br.com.intellistock.intellistock_backend.service;

import br.com.intellistock.intellistock_backend.dto.AuthResponse;
import br.com.intellistock.intellistock_backend.dto.LoginRequest;
import br.com.intellistock.intellistock_backend.dto.RegisterRequest;
import br.com.intellistock.intellistock_backend.dto.UserResponse;
import br.com.intellistock.intellistock_backend.entity.User;
import br.com.intellistock.intellistock_backend.exception.InvalidRegistrationCodeException;
import br.com.intellistock.intellistock_backend.security.JwtService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Locale;

/**
 * Título: Regras de cadastro e login
 * Explicação: Service das regras de acesso: quem pode criar conta e como o login é feito.
 */
@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UserService userService;
    private final byte[] registrationCode;

    /**
     * Título: Construtor
     * Explicação: O Spring chama ao criar o objeto e entrega pronto o que ele precisa: authenticationManager
     *   (AuthenticationManager), jwtService (JwtService), userService (UserService) e registrationCode (String).
     */
    public AuthService(AuthenticationManager authenticationManager, JwtService jwtService, UserService userService,
                       @Value("${app.cadastro.codigo:}") String registrationCode) {
        if (registrationCode == null || registrationCode.isBlank() || registrationCode.length() > 128) {
            throw new IllegalStateException("Configure CODIGO_CADASTRO com um valor nao vazio de ate 128 caracteres.");
        }
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.userService = userService;
        this.registrationCode = registrationCode.getBytes(StandardCharsets.UTF_8);
    }

    /**
     * Título: Confere o código de acesso e repassa o cadastro ao UserService
     * Explicação: Recebe request (RegisterRequest). Compara o código digitado com o configurado (comparação em
     *   tempo constante). Se errado, lança InvalidRegistrationCodeException (403); se certo, repassa ao
     *   UserService. Devolve UserResponse. Chamado por AuthController.
     */
    public UserResponse register(RegisterRequest request) {
        if (!MessageDigest.isEqual(registrationCode, request.codigoAcesso().getBytes(StandardCharsets.UTF_8))) {
            throw new InvalidRegistrationCodeException();
        }
        return userService.register(request);
    }

    /**
     * Título: Valida e-mail e senha pelo Spring Security e devolve o token com os dados do usuário
     * Explicação: Recebe request (LoginRequest). Recusa senhas acima de 72 bytes, padroniza o e-mail, pede ao
     *   Spring Security para conferir e-mail e senha (senha errada vira 401), carrega o usuário e devolve o
     *   token gerado pelo JwtService dentro de um AuthResponse. Devolve AuthResponse. Chamado por
     *   AuthController.
     */
    public AuthResponse login(LoginRequest request) {
        if (request.senha().getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new BadCredentialsException("Credenciais invalidas.");
        }
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(email, request.senha()));
        User user = userService.findByEmail(email);
        return new AuthResponse(jwtService.generateToken(user), "Bearer", UserResponse.from(user));
    }
}
