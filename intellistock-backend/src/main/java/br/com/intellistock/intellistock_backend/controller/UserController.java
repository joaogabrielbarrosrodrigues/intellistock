package br.com.intellistock.intellistock_backend.controller;

import br.com.intellistock.intellistock_backend.dto.UserResponse;
import br.com.intellistock.intellistock_backend.entity.User;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Título: Rota que devolve o usuário logado
 * Explicação: Controller REST com uma única rota, que devolve os dados de quem está logado.
 */
@RestController
@RequestMapping("/api/users")
public class UserController {

    /**
     * Título: Devolve o usuário identificado pelo token
     * Explicação: Recebe user (User). Pega o usuário que o filtro de segurança identificou pelo token
     *   (@AuthenticationPrincipal) e devolve como UserResponse, sem a senha. Não consulta o banco de novo nem
     *   chama service. Devolve UserResponse.
     */
    @GetMapping("/me")
    public UserResponse me(@AuthenticationPrincipal User user) {
        return UserResponse.from(user);
    }
}
