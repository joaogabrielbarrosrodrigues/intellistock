package br.com.intellistock.intellistock_backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Título: Entidade da tabela users (usuário)
 * Explicação: Entidade JPA que representa um usuário do sistema. Cada objeto é uma linha da tabela users.
 */
@Entity
@Table(name = "users")
public class User {

    /**
     * Título: Coluna id
     * Explicação: Guarda identificador único, um UUID gerado automaticamente ao gravar. No banco: users.id
     *   (uuid, obrigatória).
     */
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /**
     * Título: Coluna nome
     * Explicação: Guarda nome. No banco: users.nome (varchar(255), obrigatória).
     */
    @Column(nullable = false)
    private String nome;

    /**
     * Título: Coluna email
     * Explicação: Guarda e-mail. No banco: users.email (varchar(255), obrigatória).
     */
    @Column(nullable = false, unique = true)
    private String email;

    /**
     * Título: Coluna senha
     * Explicação: Guarda senha embaralhada com BCrypt (nunca a senha original). No banco: users.senha
     *   (varchar(255), obrigatória).
     */
    @Column(nullable = false)
    private String senha;

    /**
     * Título: Coluna created_at
     * Explicação: Guarda data e hora de criação, preenchida automaticamente. No banco: users.created_at
     *   (timestamptz, obrigatória).
     */
    @Column(nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    /**
     * Título: PrePersist() preenche a data de criação automaticamente antes de gravar
     * Explicação: Não devolve nada.
     */
    @PrePersist
    void prePersist() {
        createdAt = OffsetDateTime.now();
    }

    /**
     * Título: Getters e setters
     * Explicação: Métodos de acesso aos atributos. Services e DTOs leem e alteram os campos por eles, e o
     *   Hibernate grava as mudanças no banco no fim da transação.
     */
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getSenha() {
        return senha;
    }

    public void setSenha(String senha) {
        this.senha = senha;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
