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

@Entity
@Table(name = "movimentacoes", indexes = {
        @Index(name = "idx_movimentacoes_produto_data", columnList = "produto_id, data"),
        @Index(name = "idx_movimentacoes_tipo_data", columnList = "tipo, data")
})
public class Movimentacao {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "produto_id", nullable = false)
    private Produto produto;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private TipoMovimentacao tipo;

    @Column(nullable = false, precision = 15, scale = 3)
    private BigDecimal quantidade;

    @Column(nullable = false, precision = 15, scale = 3)
    private BigDecimal saldoResultante;

    @Column(nullable = false)
    private OffsetDateTime data;

    @Column(length = 500)
    private String observacao;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id")
    private User usuario;

    public static Movimentacao of(Produto produto, TipoMovimentacao tipo, BigDecimal quantidade,
                                  BigDecimal saldoResultante, OffsetDateTime data, String observacao,
                                  User usuario) {
        Movimentacao movimentacao = new Movimentacao();
        movimentacao.produto = produto;
        movimentacao.tipo = tipo;
        movimentacao.quantidade = quantidade;
        movimentacao.saldoResultante = saldoResultante;
        movimentacao.data = data;
        movimentacao.observacao = observacao;
        movimentacao.usuario = usuario;
        return movimentacao;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public Produto getProduto() {
        return produto;
    }

    public TipoMovimentacao getTipo() {
        return tipo;
    }

    public BigDecimal getQuantidade() {
        return quantidade;
    }

    public BigDecimal getSaldoResultante() {
        return saldoResultante;
    }

    public OffsetDateTime getData() {
        return data;
    }

    public String getObservacao() {
        return observacao;
    }

    public User getUsuario() {
        return usuario;
    }
}
