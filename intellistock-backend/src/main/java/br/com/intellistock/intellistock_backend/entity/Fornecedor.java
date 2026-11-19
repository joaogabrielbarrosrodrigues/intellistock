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
 * Título: Entidade da tabela fornecedores
 * Explicação: Entidade JPA que representa um fornecedor. Cada objeto é uma linha da tabela fornecedores.
 */
@Entity
@Table(name = "fornecedores")
public class Fornecedor {

    /**
     * Título: Coluna id
     * Explicação: Guarda identificador único, um UUID gerado automaticamente ao gravar. No banco:
     *   fornecedores.id (uuid, obrigatória).
     */
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /**
     * Título: Coluna nome
     * Explicação: Guarda nome. No banco: fornecedores.nome (varchar(150), obrigatória).
     */
    @Column(nullable = false, length = 150)
    private String nome;

    /**
     * Título: Coluna cnpj
     * Explicação: Guarda CNPJ sem pontuação, único e opcional. No banco: fornecedores.cnpj (varchar(14), pode
     *   ficar vazia).
     */
    @Column(unique = true, length = 14)
    private String cnpj;

    /**
     * Título: Coluna telefone
     * Explicação: Guarda telefone de contato. No banco: fornecedores.telefone (varchar(20), pode ficar vazia).
     */
    @Column(length = 20)
    private String telefone;

    /**
     * Título: Coluna email
     * Explicação: Guarda e-mail. No banco: fornecedores.email (varchar(180), pode ficar vazia).
     */
    @Column(length = 180)
    private String email;

    /**
     * Título: Coluna created_at
     * Explicação: Guarda data e hora de criação, preenchida automaticamente. No banco: fornecedores.created_at
     *   (timestamptz, obrigatória).
     */
    @Column(nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    /**
     * Título: prePersist
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

    public String getCnpj() {
        return cnpj;
    }

    public void setCnpj(String cnpj) {
        this.cnpj = cnpj;
    }

    public String getTelefone() {
        return telefone;
    }

    public void setTelefone(String telefone) {
        this.telefone = telefone;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
