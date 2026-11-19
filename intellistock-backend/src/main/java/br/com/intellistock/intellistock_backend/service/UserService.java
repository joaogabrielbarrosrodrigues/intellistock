package br.com.intellistock.intellistock_backend.service;

import br.com.intellistock.intellistock_backend.dto.RegisterRequest;
import br.com.intellistock.intellistock_backend.dto.UserResponse;
import br.com.intellistock.intellistock_backend.entity.User;
import br.com.intellistock.intellistock_backend.exception.BusinessException;
import br.com.intellistock.intellistock_backend.exception.ConflictException;
import br.com.intellistock.intellistock_backend.exception.ResourceNotFoundException;
import br.com.intellistock.intellistock_backend.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.util.Locale;

/**
 * Título: Criação e busca de usuários
 * Explicação: Service que cria usuários e busca usuário por e-mail.
 */
@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * Título: Construtor
     * Explicação: O Spring chama ao criar o objeto e entrega pronto o que ele precisa: userRepository
     *   (UserRepository) e passwordEncoder (PasswordEncoder).
     */
    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Título: Valida e grava um usuário novo
     * Explicação: Recebe request (RegisterRequest). Padroniza o e-mail (sem espaços, minúsculo), recusa senha
     *   acima de 72 bytes (limite do BCrypt), recusa e-mail já cadastrado (409), embaralha a senha com BCrypt e
     *   grava o usuário. Devolve UserResponse. Chamado por AuthService.
     */
    @Transactional
    public UserResponse register(RegisterRequest request) {
        String email = request.email().trim().toLowerCase(Locale.ROOT);

        // BCrypt limita a senha em bytes, enquanto @Size conta caracteres.
        if (request.senha().getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new BusinessException("Senha muito longa. Reduza a quantidade de caracteres.");
        }

        if (userRepository.existsByEmail(email)) {
            throw new ConflictException("E-mail ja cadastrado.");
        }

        User user = new User();
        user.setNome(request.nome().trim());
        user.setEmail(email);
        user.setSenha(passwordEncoder.encode(request.senha()));

        return UserResponse.from(userRepository.save(user));
    }

    /**
     * Título: Busca um usuário pelo e-mail
     * Explicação: Recebe email (String). Busca um usuário pelo e-mail (404 se não existir). Devolve User.
     *   Chamado por AuthService.
     */
    @Transactional(readOnly = true)
    public User findByEmail(String email) {
        return userRepository.findByEmail(email.toLowerCase(Locale.ROOT))
                .orElseThrow(() -> new ResourceNotFoundException("Usuario nao encontrado."));
    }
}
