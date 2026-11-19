package br.com.intellistock.intellistock_backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Título: Entidade da tabela contas_pagar
 * Explicação: Entidade JPA que representa uma conta a pagar. Cada objeto é uma linha da tabela
 *   contas_pagar.
 */
@Entity
@Table(name = "contas_pagar", indexes = {
        @Index(name = "idx_contas_pagar_vencimento", columnList = "data_vencimento"),
        @Index(name = "idx_contas_pagar_status", columnList = "status")
})
public class ContaPagar {

    /**
     * Título: Coluna id
     * Explicação: Guarda identificador único, um UUID gerado automaticamente ao gravar. No banco:
     *   contas_pagar.id (uuid, obrigatória).
     */
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /**
     * Título: Coluna fornecedor_id
     * Explicação: Guarda fornecedor ligado a este registro (chave estrangeira). No banco:
     *   contas_pagar.fornecedor_id (uuid, obrigatória).
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "fornecedor_id", nullable = false)
    private Fornecedor fornecedor;

    /**
     * Título: Coluna descricao
     * Explicação: Guarda descrição. No banco: contas_pagar.descricao (varchar(255), obrigatória).
     */
    @Column(nullable = false, length = 255)
    private String descricao;

    /**
     * Título: Coluna valor
     * Explicação: Guarda valor da conta. No banco: contas_pagar.valor (numeric(15,2), obrigatória).
     */
    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal valor;

    /**
     * Título: Coluna data_vencimento
     * Explicação: Guarda data de vencimento. No banco: contas_pagar.data_vencimento (date, obrigatória).
     */
    @Column(name = "data_vencimento", nullable = false)
    private LocalDate dataVencimento;

    /**
     * Título: Coluna data_pagamento
     * Explicação: Guarda data em que foi paga (vazia se não paga). No banco: contas_pagar.data_pagamento
     *   (date, pode ficar vazia).
     */
    private LocalDate dataPagamento;

    /**
     * Título: Coluna status
     * Explicação: Guarda situação gravada: PENDENTE, PAGA ou CANCELADA (VENCIDA é calculada). No banco:
     *   contas_pagar.status (varchar(10), obrigatória).
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private StatusConta status = StatusConta.PENDENTE;

    /**
     * Título: Coluna observacao
     * Explicação: Guarda observação livre. No banco: contas_pagar.observacao (varchar(500), pode ficar vazia).
     */
    @Column(length = 500)
    private String observacao;

    /**
     * Título: Coluna created_at
     * Explicação: Guarda data e hora de criação, preenchida automaticamente. No banco: contas_pagar.created_at
     *   (timestamptz, obrigatória).
     */
    @Column(nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    /**
     * Título: Coluna updated_at
     * Explicação: Guarda data e hora da última alteração, preenchida automaticamente. No banco:
     *   contas_pagar.updated_at (timestamptz, pode ficar vazia).
     */
    private OffsetDateTime updatedAt;

    /**
     * Título: prePersist
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
     * Título: Devolve VENCIDA quando a conta está pendente e o vencimento já passou; nos outros casos
     * Explicação: Recebe hoje (LocalDate). Devolve VENCIDA quando a conta está pendente e o vencimento já
     *   passou; nos outros casos, o status gravado. Devolve StatusConta.
     */
    public StatusConta getStatusEfetivo(LocalDate hoje) {
        if (status == StatusConta.PENDENTE && dataVencimento.isBefore(hoje)) {
            return StatusConta.VENCIDA;
        }
        return status;
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

    public Fornecedor getFornecedor() {
        return fornecedor;
    }

    public void setFornecedor(Fornecedor fornecedor) {
        this.fornecedor = fornecedor;
    }

    public String getDescricao() {
        return descricao;
    }

    public void setDescricao(String descricao) {
        this.descricao = descricao;
    }

    public BigDecimal getValor() {
        return valor;
    }

    public void setValor(BigDecimal valor) {
        this.valor = valor;
    }

    public LocalDate getDataVencimento() {
        return dataVencimento;
    }

    public void setDataVencimento(LocalDate dataVencimento) {
        this.dataVencimento = dataVencimento;
    }

    public LocalDate getDataPagamento() {
        return dataPagamento;
    }

    public void setDataPagamento(LocalDate dataPagamento) {
        this.dataPagamento = dataPagamento;
    }

    public StatusConta getStatus() {
        return status;
    }

    public void setStatus(StatusConta status) {
        this.status = status;
    }

    public String getObservacao() {
        return observacao;
    }

    public void setObservacao(String observacao) {
        this.observacao = observacao;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public OffsetDateTime getUpdatedAt() {
        return updatedAt;
    }
}
