package br.com.intellistock.intellistock_backend.service;

import br.com.intellistock.intellistock_backend.dto.RegisterRequest;
import br.com.intellistock.intellistock_backend.dto.UserResponse;
import br.com.intellistock.intellistock_backend.entity.User;
import br.com.intellistock.intellistock_backend.exception.EmailAlreadyRegisteredException;
import br.com.intellistock.intellistock_backend.exception.ResourceNotFoundException;
import br.com.intellistock.intellistock_backend.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

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
        String email = request.email().trim().toLowerCase();

        if (userRepository.existsByEmail(email)) {
            throw new EmailAlreadyRegisteredException("E-mail ja cadastrado.");
        }

        User user = new User();
        user.setNome(request.nome().trim());
        user.setEmail(email);
        user.setSenha(passwordEncoder.encode(request.senha()));

        return UserResponse.from(userRepository.save(user));
    }

    @Transactional(readOnly = true)
    public User findByEmail(String email) {
        return userRepository.findByEmail(email.toLowerCase())
                .orElseThrow(() -> new ResourceNotFoundException("Usuario nao encontrado."));
    }

    @Transactional(readOnly = true)
    public UserResponse findResponseById(UUID id) {
        return userRepository.findById(id)
                .map(UserResponse::from)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario nao encontrado."));
    }
}
