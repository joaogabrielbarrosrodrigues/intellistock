package br.com.intellistock.intellistock_backend.service;

import br.com.intellistock.intellistock_backend.dto.AuthResponse;
import br.com.intellistock.intellistock_backend.dto.LoginRequest;
import br.com.intellistock.intellistock_backend.dto.RegisterRequest;
import br.com.intellistock.intellistock_backend.dto.UserResponse;
import br.com.intellistock.intellistock_backend.entity.User;
import br.com.intellistock.intellistock_backend.exception.InvalidRegistrationCodeException;
import br.com.intellistock.intellistock_backend.security.JwtService;
import br.com.intellistock.intellistock_backend.util.TextoUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UserService userService;
    private final byte[] registrationCode;

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

    public UserResponse register(RegisterRequest request) {
        if (!MessageDigest.isEqual(registrationCode, request.codigoAcesso().getBytes(StandardCharsets.UTF_8))) {
            throw new InvalidRegistrationCodeException();
        }
        return userService.register(request);
    }

    public AuthResponse login(LoginRequest request) {
        if (UserService.senhaExcedeLimite(request.senha())) {
            throw new BadCredentialsException("Credenciais invalidas.");
        }
        String email = TextoUtils.normalizarEmail(request.email());
        authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(email, request.senha()));
        User user = userService.findByEmail(email);
        return new AuthResponse(jwtService.generateToken(user), "Bearer", UserResponse.from(user));
    }
}
