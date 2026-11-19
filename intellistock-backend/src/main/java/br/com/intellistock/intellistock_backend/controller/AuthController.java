package br.com.intellistock.intellistock_backend.controller;

import br.com.intellistock.intellistock_backend.dto.AuthResponse;
import br.com.intellistock.intellistock_backend.dto.LoginRequest;
import br.com.intellistock.intellistock_backend.dto.RegisterRequest;
import br.com.intellistock.intellistock_backend.dto.UserResponse;
import br.com.intellistock.intellistock_backend.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * Título: Rotas de cadastro e login
 * Explicação: Controller REST das rotas de acesso. São as únicas rotas da API que funcionam sem token,
 *   porque é por elas que o usuário consegue um.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    /**
     * Título: Construtor
     * Explicação: O Spring chama ao criar o objeto e entrega pronto o que ele precisa: authService
     *   (AuthService).
     */
    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    /**
     * Título: Cria um usuário novo
     * Explicação: Recebe request (RegisterRequest). Recebe RegisterRequest (nome, e-mail, senha, código de
     *   acesso), valida o formato e repassa ao AuthService. Responde 201 com os dados públicos do usuário.
     *   Devolve UserResponse.
     */
    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    /**
     * Título: Confere e-mail e senha e devolve o token
     * Explicação: Recebe request (LoginRequest). Recebe LoginRequest (e-mail, senha) e devolve AuthResponse
     *   com o token. Devolve AuthResponse.
     */
    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }
}
