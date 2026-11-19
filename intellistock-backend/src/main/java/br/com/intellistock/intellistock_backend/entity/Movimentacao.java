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
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Título: Entidade da tabela movimentacoes (extrato do estoque)
 * Explicação: Entidade JPA que representa um lançamento de estoque. Cada objeto é uma linha da tabela
 *   movimentacoes; o conjunto delas é o extrato do estoque.
 */
@Entity
@Table(name = "movimentacoes", indexes = {
        @Index(name = "idx_movimentacoes_produto_data", columnList = "produto_id, data"),
        @Index(name = "idx_movimentacoes_tipo_data", columnList = "tipo, data")
})
public class Movimentacao {

    /**
     * Título: Coluna id
     * Explicação: Guarda identificador único, um UUID gerado automaticamente ao gravar. No banco:
     *   movimentacoes.id (uuid, obrigatória).
     */
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /**
     * Título: Coluna produto_id
     * Explicação: Guarda produto movimentado (chave estrangeira). No banco: movimentacoes.produto_id (uuid,
     *   obrigatória).
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "produto_id", nullable = false)
    private Produto produto;

    /**
     * Título: Coluna tipo
     * Explicação: Guarda tipo da movimentação: ENTRADA ou SAIDA. No banco: movimentacoes.tipo (varchar(10),
     *   obrigatória).
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private TipoMovimentacao tipo;

    /**
     * Título: Coluna quantidade
     * Explicação: Guarda quantidade (no produto, é o saldo atual em estoque). No banco:
     *   movimentacoes.quantidade (numeric(15,3), obrigatória).
     */
    @Column(nullable = false, precision = 15, scale = 3)
    private BigDecimal quantidade;

    /**
     * Título: Coluna saldo_resultante
     * Explicação: Guarda saldo do produto logo depois deste lançamento. No banco:
     *   movimentacoes.saldo_resultante (numeric(15,3), obrigatória).
     */
    @Column(nullable = false, precision = 15, scale = 3)
    private BigDecimal saldoResultante;

    /**
     * Título: Coluna data
     * Explicação: Guarda data e hora do lançamento. No banco: movimentacoes.data (timestamptz, obrigatória).
     */
    @Column(nullable = false)
    private OffsetDateTime data;

    /**
     * Título: Coluna observacao
     * Explicação: Guarda observação livre. No banco: movimentacoes.observacao (varchar(500), pode ficar
     *   vazia).
     */
    @Column(length = 500)
    private String observacao;

    /**
     * Título: Coluna usuario_id
     * Explicação: Guarda usuário que fez o lançamento (chave estrangeira). No banco: movimentacoes.usuario_id
     *   (uuid, pode ficar vazia).
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id")
    private User usuario;

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

    public Produto getProduto() {
        return produto;
    }

    public void setProduto(Produto produto) {
        this.produto = produto;
    }

    public TipoMovimentacao getTipo() {
        return tipo;
    }

    public void setTipo(TipoMovimentacao tipo) {
        this.tipo = tipo;
    }

    public BigDecimal getQuantidade() {
        return quantidade;
    }

    public void setQuantidade(BigDecimal quantidade) {
        this.quantidade = quantidade;
    }

    public BigDecimal getSaldoResultante() {
        return saldoResultante;
    }

    public void setSaldoResultante(BigDecimal saldoResultante) {
        this.saldoResultante = saldoResultante;
    }

    public OffsetDateTime getData() {
        return data;
    }

    public void setData(OffsetDateTime data) {
        this.data = data;
    }

    public String getObservacao() {
        return observacao;
    }

    public void setObservacao(String observacao) {
        this.observacao = observacao;
    }

    public User getUsuario() {
        return usuario;
    }

    public void setUsuario(User usuario) {
        this.usuario = usuario;
    }
}
