package br.com.intellistock.intellistock_backend.repository;

import br.com.intellistock.intellistock_backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

/**
 * Título: Consultas da tabela users
 * Explicação: Repositório da tabela users.
 */
public interface UserRepository extends JpaRepository<User, UUID> {

    /**
     * Título: Consulta: verifica se o e-mail já está cadastrado
     * Explicação: O Spring Data gera o SQL sozinho a partir do nome do método. Recebe email (String). Devolve
     *   boolean. Usada por UserService.
     */
    boolean existsByEmail(String email);

    /**
     * Título: Consulta: busca o usuário pelo e-mail
     * Explicação: O Spring Data gera o SQL sozinho a partir do nome do método. Recebe email (String). Devolve
     *   Optional<User>. Usada por UserService.
     */
    Optional<User> findByEmail(String email);

}
