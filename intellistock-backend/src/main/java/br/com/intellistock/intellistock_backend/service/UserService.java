package br.com.intellistock.intellistock_backend.service;

import br.com.intellistock.intellistock_backend.entity.User;
import br.com.intellistock.intellistock_backend.repository.UserRepository;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User cadastrar(User user) {

        if (userRepository.existsByEmail(user.getEmail())) {
            throw new RuntimeException("E-mail já cadastrado.");
        }

        return userRepository.save(user);
    }
}