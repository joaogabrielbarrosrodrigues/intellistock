package br.com.intellistock.intellistock_backend.repository;

import br.com.intellistock.intellistock_backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {

    boolean existsByEmail(String email);

}