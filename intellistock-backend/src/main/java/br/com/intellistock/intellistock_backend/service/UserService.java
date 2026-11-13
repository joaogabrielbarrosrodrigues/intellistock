package br.com.intellistock.intellistock_backend.service;

import br.com.intellistock.intellistock_backend.dto.RegisterRequest;
import br.com.intellistock.intellistock_backend.dto.UserResponse;
import br.com.intellistock.intellistock_backend.entity.User;
import br.com.intellistock.intellistock_backend.exception.BusinessException;
import br.com.intellistock.intellistock_backend.exception.ConflictException;
import br.com.intellistock.intellistock_backend.exception.ResourceNotFoundException;
import br.com.intellistock.intellistock_backend.repository.UserRepository;
import br.com.intellistock.intellistock_backend.util.TextoUtils;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;

@Service
public class UserService {

    private static final int LIMITE_BYTES_SENHA = 72;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public UserResponse register(RegisterRequest request) {
        String email = TextoUtils.normalizarEmail(request.email());

        if (senhaExcedeLimite(request.senha())) {
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

    @Transactional(readOnly = true)
    public User findByEmail(String email) {
        return userRepository.findByEmail(TextoUtils.normalizarEmail(email))
                .orElseThrow(() -> new ResourceNotFoundException("Usuario nao encontrado."));
    }

    /**
     * BCrypt limita a senha em bytes, enquanto @Size conta caracteres.
     */
    public static boolean senhaExcedeLimite(String senha) {
        return senha.getBytes(StandardCharsets.UTF_8).length > LIMITE_BYTES_SENHA;
    }
}
