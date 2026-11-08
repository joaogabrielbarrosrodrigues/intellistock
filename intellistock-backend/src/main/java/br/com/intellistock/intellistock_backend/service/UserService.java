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

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

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

    @Transactional(readOnly = true)
    public User findByEmail(String email) {
        return userRepository.findByEmail(email.toLowerCase(Locale.ROOT))
                .orElseThrow(() -> new ResourceNotFoundException("Usuario nao encontrado."));
    }
}
