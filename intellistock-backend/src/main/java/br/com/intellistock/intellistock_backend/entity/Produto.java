package br.com.intellistock.intellistock_backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Título: Entidade da tabela produtos (guarda o saldo atual)
 * Explicação: Entidade JPA que representa um produto do estoque. Cada objeto é uma linha da tabela
 *   produtos, e é aqui que fica o saldo atual.
 */
@Entity
@Table(name = "produtos")
public class Produto {

    /**
     * Título: Coluna id
     * Explicação: Guarda identificador único, um UUID gerado automaticamente ao gravar. No banco: produtos.id
     *   (uuid, obrigatória).
     */
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /**
     * Título: Coluna nome
     * Explicação: Guarda nome. No banco: produtos.nome (varchar(150), obrigatória).
     */
    @Column(nullable = false, length = 150)
    private String nome;

    /**
     * Título: Coluna descricao
     * Explicação: Guarda descrição. No banco: produtos.descricao (varchar(500), pode ficar vazia).
     */
    @Column(length = 500)
    private String descricao;

    /**
     * Título: Coluna quantidade
     * Explicação: Guarda quantidade (no produto, é o saldo atual em estoque). No banco: produtos.quantidade
     *   (numeric(15,3), obrigatória).
     */
    @Column(nullable = false, precision = 15, scale = 3)
    private BigDecimal quantidade = BigDecimal.ZERO;

    /**
     * Título: Coluna estoque_minimo
     * Explicação: Guarda estoque mínimo; abaixo ou igual a ele o produto fica com estoque baixo. No banco:
     *   produtos.estoque_minimo (numeric(15,3), obrigatória).
     */
    @Column(nullable = false, precision = 15, scale = 3)
    private BigDecimal estoqueMinimo = BigDecimal.ZERO;

    /**
     * Título: Coluna unidade_medida
     * Explicação: Guarda unidade de medida, gravada como texto. No banco: produtos.unidade_medida
     *   (varchar(10), obrigatória).
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private UnidadeMedida unidadeMedida;

    /**
     * Título: Coluna preco
     * Explicação: Guarda preço unitário. No banco: produtos.preco (numeric(15,2), obrigatória).
     */
    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal preco = BigDecimal.ZERO;

    /**
     * Título: Coluna fornecedor_id
     * Explicação: Guarda fornecedor ligado a este registro (chave estrangeira). No banco:
     *   produtos.fornecedor_id (uuid, pode ficar vazia).
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fornecedor_id")
    private Fornecedor fornecedor;

    /**
     * Título: Coluna ativo
     * Explicação: Guarda se está ativo; false significa desativado (exclusão lógica). No banco: produtos.ativo
     *   (boolean, obrigatória).
     */
    @Column(nullable = false)
    private boolean ativo = true;

    /**
     * Título: Coluna version
     * Explicação: Guarda número de versão que detecta duas alterações ao mesmo tempo. No banco:
     *   produtos.version (bigint, obrigatória).
     */
    @Version
    private Long version;

    /**
     * Título: Coluna created_at
     * Explicação: Guarda data e hora de criação, preenchida automaticamente. No banco: produtos.created_at
     *   (timestamptz, obrigatória).
     */
    @Column(nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    /**
     * Título: Coluna updated_at
     * Explicação: Guarda data e hora da última alteração, preenchida automaticamente. No banco:
     *   produtos.updated_at (timestamptz, pode ficar vazia).
     */
    private OffsetDateTime updatedAt;

    /**
     * Título: PrePersist()/preUpdate() preenchem as datas automaticamente
     * Explicação: Não devolve nada.
     */
    @PrePersist
    void prePersist() {
        createdAt = OffsetDateTime.now();
        updatedAt = createdAt;
    }

    /**
     * Título: preUpdate
     * Explicação: Não devolve nada.
     */
    @PreUpdate
    void preUpdate() {
        updatedAt = OffsetDateTime.now();
    }

    /**
     * Título: Diz se o saldo está menor ou igual ao estoque mínimo
     * Explicação: Diz se o saldo está menor ou igual ao mínimo. Devolve boolean.
     */
    public boolean isEstoqueBaixo() {
        return quantidade.compareTo(estoqueMinimo) <= 0;
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

    public String getDescricao() {
        return descricao;
    }

    public void setDescricao(String descricao) {
        this.descricao = descricao;
    }

    public BigDecimal getQuantidade() {
        return quantidade;
    }

    public void setQuantidade(BigDecimal quantidade) {
        this.quantidade = quantidade;
    }

    public BigDecimal getEstoqueMinimo() {
        return estoqueMinimo;
    }

    public void setEstoqueMinimo(BigDecimal estoqueMinimo) {
        this.estoqueMinimo = estoqueMinimo;
    }

    public UnidadeMedida getUnidadeMedida() {
        return unidadeMedida;
    }

    public void setUnidadeMedida(UnidadeMedida unidadeMedida) {
        this.unidadeMedida = unidadeMedida;
    }

    public BigDecimal getPreco() {
        return preco;
    }

    public void setPreco(BigDecimal preco) {
        this.preco = preco;
    }

    public Fornecedor getFornecedor() {
        return fornecedor;
    }

    public void setFornecedor(Fornecedor fornecedor) {
        this.fornecedor = fornecedor;
    }

    public boolean isAtivo() {
        return ativo;
    }

    public void setAtivo(boolean ativo) {
        this.ativo = ativo;
    }

    public Long getVersion() {
        return version;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public OffsetDateTime getUpdatedAt() {
        return updatedAt;
    }
}
