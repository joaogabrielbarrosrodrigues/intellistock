package br.com.intellistock.intellistock_backend.service;

import br.com.intellistock.intellistock_backend.config.AnaliseProperties;
import br.com.intellistock.intellistock_backend.dto.ConsumoResponse;
import br.com.intellistock.intellistock_backend.dto.ConsumoSerieResponse;
import br.com.intellistock.intellistock_backend.dto.ConsumoSerieResponse.Agrupamento;
import br.com.intellistock.intellistock_backend.dto.FornecedorResumo;
import br.com.intellistock.intellistock_backend.dto.ReposicaoResponse;
import br.com.intellistock.intellistock_backend.dto.ReposicaoResponse.Prioridade;
import br.com.intellistock.intellistock_backend.dto.Tendencia;
import br.com.intellistock.intellistock_backend.entity.Produto;
import br.com.intellistock.intellistock_backend.entity.TipoMovimentacao;
import br.com.intellistock.intellistock_backend.repository.MovimentacaoRepository;
import br.com.intellistock.intellistock_backend.repository.ProdutoRepository;
import br.com.intellistock.intellistock_backend.repository.QuantidadeNaData;
import br.com.intellistock.intellistock_backend.repository.TotalPorProduto;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Indicadores calculados a partir do historico de SAIDAS (consumo).
 *
 * <p>Tendencia: o periodo analisado e dividido em duas metades e a media diaria da metade
 * mais recente e comparada com a da metade mais antiga. Variacoes acima do limiar
 * configurado indicam ALTA ou BAIXA.</p>
 *
 * <p>Reposicao (modelo de ponto de pedido):</p>
 * <pre>
 * consumoBase       = media diaria (ou media recente, se a tendencia for de ALTA)
 * estoqueSeguranca  = max(estoque minimo cadastrado, consumoBase x diasSeguranca)
 * pontoPedido       = consumoBase x prazoEntrega + estoqueSeguranca
 * precisaRepor      = estoqueAtual &lt;= pontoPedido
 * quantidadeSugerida = consumoBase x (diasCobertura + prazoEntrega) + estoqueSeguranca - estoqueAtual
 * </pre>
 */
@Service
public class AnaliseService {

    private static final int ESCALA_QUANTIDADE = 3;
    private static final BigDecimal CEM = BigDecimal.valueOf(100);

    private final ProdutoRepository produtoRepository;
    private final MovimentacaoRepository movimentacaoRepository;
    private final ProdutoService produtoService;
    private final AnaliseProperties properties;
    private final Clock clock;

    public AnaliseService(ProdutoRepository produtoRepository, MovimentacaoRepository movimentacaoRepository,
                          ProdutoService produtoService, AnaliseProperties properties, Clock clock) {
        this.produtoRepository = produtoRepository;
        this.movimentacaoRepository = movimentacaoRepository;
        this.produtoService = produtoService;
        this.properties = properties;
        this.clock = clock;
    }

    public record ParametrosReposicao(Integer dias, Integer diasCobertura, Integer prazoEntregaDias,
                                      Integer diasSeguranca) {

        public static ParametrosReposicao padrao() {
            return new ParametrosReposicao(null, null, null, null);
        }
    }

    @Transactional(readOnly = true)
    public List<ConsumoResponse> consumo(UUID produtoId, Integer dias) {
        Janela janela = janela(dias == null ? properties.diasAnalise() : dias);
        List<Produto> produtos = produtoId == null
                ? produtoRepository.findByAtivoTrueOrderByNomeAsc()
                : List.of(produtoService.buscarEntidade(produtoId));

        Totais totais = totais(janela);
        return produtos.stream()
                .map(produto -> {
                    Consumo consumo = calcularConsumo(produto.getId(), janela, totais);
                    return new ConsumoResponse(
                            produto.getId(),
                            produto.getNome(),
                            produto.getUnidadeMedida(),
                            janela.dias(),
                            janela.inicio(),
                            janela.fim(),
                            consumo.total(),
                            consumo.mediaDiaria(),
                            consumo.mediaDiaria().multiply(BigDecimal.valueOf(7)).setScale(ESCALA_QUANTIDADE, RoundingMode.HALF_UP),
                            consumo.mediaDiaria().multiply(BigDecimal.valueOf(30)).setScale(ESCALA_QUANTIDADE, RoundingMode.HALF_UP),
                            consumo.mediaRecente(),
                            consumo.tendencia(),
                            consumo.variacaoPercentual()
                    );
                })
                .toList();
    }

    /**
     * Serie de consumo agrupada por dia, semana (iniciando na segunda-feira) ou mes.
     *
     * @param produtoId null consolida todos os produtos
     * @param dias      janela em dias; quando null usa 30 (diario), 84 (semanal) ou 180 (mensal)
     */
    @Transactional(readOnly = true)
    public ConsumoSerieResponse serie(UUID produtoId, Agrupamento agrupamento, Integer dias) {
        int periodo = dias != null ? dias : switch (agrupamento) {
            case DIARIO -> 30;
            case SEMANAL -> 84;
            case MENSAL -> 180;
        };
        LocalDate hoje = LocalDate.now(clock);
        Produto produto = produtoId == null ? null : produtoService.buscarEntidade(produtoId);
        List<ConsumoSerieResponse.Ponto> pontos = pontos(produtoId, agrupamento, hoje.minusDays(periodo - 1L), hoje);
        return new ConsumoSerieResponse(produtoId, produto == null ? null : produto.getNome(), agrupamento, pontos);
    }

    /**
     * Consumo total (todos os produtos) dos ultimos meses, incluindo o mes corrente.
     */
    @Transactional(readOnly = true)
    public List<ConsumoSerieResponse.Ponto> consumoMensal(int meses) {
        LocalDate hoje = LocalDate.now(clock);
        return pontos(null, Agrupamento.MENSAL, hoje.withDayOfMonth(1).minusMonths(meses - 1L), hoje);
    }

    @Transactional(readOnly = true)
    public List<ReposicaoResponse> reposicao(ParametrosReposicao parametros, boolean incluirTodos) {
        int diasCobertura = valor(parametros.diasCobertura(), properties.diasCobertura());
        int prazoEntrega = valor(parametros.prazoEntregaDias(), properties.prazoEntregaDias());
        int diasSeguranca = valor(parametros.diasSeguranca(), properties.diasSeguranca());
        Janela janela = janela(valor(parametros.dias(), properties.diasAnalise()));

        Totais totais = totais(janela);
        return produtoRepository.findByAtivoTrueOrderByNomeAsc().stream()
                .map(produto -> calcularReposicao(produto, calcularConsumo(produto.getId(), janela, totais),
                        diasCobertura, prazoEntrega, diasSeguranca))
                .filter(sugestao -> incluirTodos || sugestao.precisaRepor())
                .sorted(Comparator.comparing(ReposicaoResponse::prioridade)
                        .thenComparing(ReposicaoResponse::diasRestantes, Comparator.nullsLast(Comparator.naturalOrder()))
                        .thenComparing(ReposicaoResponse::produtoNome))
                .toList();
    }

    @Transactional(readOnly = true)
    public long contarSugestoesReposicao() {
        return reposicao(ParametrosReposicao.padrao(), false).size();
    }

    private ReposicaoResponse calcularReposicao(Produto produto, Consumo consumo, int diasCobertura,
                                                int prazoEntrega, int diasSeguranca) {
        BigDecimal estoqueAtual = produto.getQuantidade();
        BigDecimal base = consumo.tendencia() == Tendencia.ALTA
                ? consumo.mediaDiaria().max(consumo.mediaRecente())
                : consumo.mediaDiaria();

        BigDecimal minimoCalculado = escala(base.multiply(BigDecimal.valueOf(diasSeguranca)));
        BigDecimal seguranca = produto.getEstoqueMinimo().max(minimoCalculado);
        BigDecimal pontoPedido = escala(base.multiply(BigDecimal.valueOf(prazoEntrega)).add(seguranca));
        BigDecimal necessidade = base.multiply(BigDecimal.valueOf((long) diasCobertura + prazoEntrega))
                .add(seguranca)
                .subtract(estoqueAtual)
                .max(BigDecimal.ZERO)
                .setScale(0, RoundingMode.CEILING);

        boolean precisaRepor = estoqueAtual.compareTo(pontoPedido) <= 0 && necessidade.signum() > 0;
        BigDecimal sugerida = precisaRepor ? necessidade : BigDecimal.ZERO;
        BigDecimal diasRestantes = base.signum() > 0
                ? estoqueAtual.divide(base, 1, RoundingMode.HALF_UP)
                : null;

        return new ReposicaoResponse(
                produto.getId(),
                produto.getNome(),
                produto.getUnidadeMedida(),
                FornecedorResumo.from(produto.getFornecedor()),
                estoqueAtual,
                produto.getEstoqueMinimo(),
                consumo.mediaDiaria(),
                escala(base),
                consumo.tendencia(),
                minimoCalculado,
                seguranca,
                pontoPedido,
                diasRestantes,
                precisaRepor,
                sugerida,
                sugerida.multiply(produto.getPreco()).setScale(2, RoundingMode.HALF_UP),
                prioridade(precisaRepor, estoqueAtual, seguranca, diasRestantes, prazoEntrega)
        );
    }

    private Prioridade prioridade(boolean precisaRepor, BigDecimal estoqueAtual, BigDecimal seguranca,
                                  BigDecimal diasRestantes, int prazoEntrega) {
        if (!precisaRepor) {
            return Prioridade.NENHUMA;
        }
        // Vai faltar produto antes de a reposicao chegar.
        if (estoqueAtual.signum() == 0
                || (diasRestantes != null && diasRestantes.compareTo(BigDecimal.valueOf(prazoEntrega)) <= 0)) {
            return Prioridade.ALTA;
        }
        if (estoqueAtual.compareTo(seguranca) <= 0) {
            return Prioridade.MEDIA;
        }
        return Prioridade.BAIXA;
    }

    private Consumo calcularConsumo(UUID produtoId, Janela janela, Totais totais) {
        BigDecimal antigo = totais.antigos().getOrDefault(produtoId, BigDecimal.ZERO);
        BigDecimal recente = totais.recentes().getOrDefault(produtoId, BigDecimal.ZERO);
        BigDecimal total = antigo.add(recente);

        BigDecimal mediaDiaria = media(total, janela.dias());
        BigDecimal mediaRecente = media(recente, janela.diasRecentes());

        if (janela.diasAntigos() == 0) {
            return new Consumo(total, mediaDiaria, mediaRecente, Tendencia.ESTAVEL, null);
        }

        BigDecimal mediaAntiga = antigo.divide(BigDecimal.valueOf(janela.diasAntigos()), 6, RoundingMode.HALF_UP);
        BigDecimal mediaRecentePrecisa = recente.divide(BigDecimal.valueOf(janela.diasRecentes()), 6, RoundingMode.HALF_UP);

        if (mediaAntiga.signum() == 0) {
            Tendencia tendencia = mediaRecentePrecisa.signum() > 0 ? Tendencia.ALTA : Tendencia.ESTAVEL;
            return new Consumo(total, mediaDiaria, mediaRecente, tendencia, null);
        }

        BigDecimal variacao = mediaRecentePrecisa.subtract(mediaAntiga)
                .multiply(CEM)
                .divide(mediaAntiga, 1, RoundingMode.HALF_UP);
        BigDecimal limiar = BigDecimal.valueOf(properties.limiarTendenciaPercentual());

        Tendencia tendencia;
        if (variacao.compareTo(limiar) >= 0) {
            tendencia = Tendencia.ALTA;
        } else if (variacao.compareTo(limiar.negate()) <= 0) {
            tendencia = Tendencia.BAIXA;
        } else {
            tendencia = Tendencia.ESTAVEL;
        }
        return new Consumo(total, mediaDiaria, mediaRecente, tendencia, variacao);
    }

    private Totais totais(Janela janela) {
        return new Totais(
                porProduto(movimentacaoRepository.sumPorProduto(TipoMovimentacao.SAIDA, janela.inicioTs(), janela.meioTs())),
                porProduto(movimentacaoRepository.sumPorProduto(TipoMovimentacao.SAIDA, janela.meioTs(), janela.fimTs()))
        );
    }

    private List<ConsumoSerieResponse.Ponto> pontos(UUID produtoId, Agrupamento agrupamento, LocalDate inicio,
                                                    LocalDate fim) {
        ZoneId zona = clock.getZone();
        OffsetDateTime inicioTs = inicio.atStartOfDay(zona).toOffsetDateTime();
        OffsetDateTime fimTs = fim.plusDays(1).atStartOfDay(zona).toOffsetDateTime();

        List<QuantidadeNaData> quantidades = produtoId == null
                ? movimentacaoRepository.findQuantidades(TipoMovimentacao.SAIDA, inicioTs, fimTs)
                : movimentacaoRepository.findQuantidadesPorProduto(produtoId, TipoMovimentacao.SAIDA, inicioTs, fimTs);

        Map<LocalDate, BigDecimal> buckets = new TreeMap<>();
        for (LocalDate cursor = inicioDoBucket(inicio, agrupamento); !cursor.isAfter(fim);
             cursor = proximoBucket(cursor, agrupamento)) {
            buckets.put(cursor, BigDecimal.ZERO);
        }
        for (QuantidadeNaData item : quantidades) {
            LocalDate data = item.data().atZoneSameInstant(zona).toLocalDate();
            buckets.merge(inicioDoBucket(data, agrupamento), item.quantidade(), BigDecimal::add);
        }

        List<ConsumoSerieResponse.Ponto> pontos = new ArrayList<>();
        buckets.forEach((bucket, quantidade) -> {
            LocalDate inicioPonto = bucket.isBefore(inicio) ? inicio : bucket;
            LocalDate fimBucket = proximoBucket(bucket, agrupamento).minusDays(1);
            LocalDate fimPonto = fimBucket.isAfter(fim) ? fim : fimBucket;
            pontos.add(new ConsumoSerieResponse.Ponto(inicioPonto, fimPonto, escala(quantidade)));
        });
        return pontos;
    }

    private LocalDate inicioDoBucket(LocalDate data, Agrupamento agrupamento) {
        return switch (agrupamento) {
            case DIARIO -> data;
            case SEMANAL -> data.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
            case MENSAL -> data.withDayOfMonth(1);
        };
    }

    private LocalDate proximoBucket(LocalDate inicioBucket, Agrupamento agrupamento) {
        return switch (agrupamento) {
            case DIARIO -> inicioBucket.plusDays(1);
            case SEMANAL -> inicioBucket.plusWeeks(1);
            case MENSAL -> inicioBucket.plusMonths(1);
        };
    }

    private Janela janela(int dias) {
        ZoneId zona = clock.getZone();
        LocalDate fim = LocalDate.now(clock);
        LocalDate inicio = fim.minusDays(dias - 1L);
        int diasAntigos = dias / 2;
        LocalDate meio = inicio.plusDays(diasAntigos);
        return new Janela(
                inicio,
                fim,
                dias,
                diasAntigos,
                dias - diasAntigos,
                inicio.atStartOfDay(zona).toOffsetDateTime(),
                meio.atStartOfDay(zona).toOffsetDateTime(),
                fim.plusDays(1).atStartOfDay(zona).toOffsetDateTime()
        );
    }

    private static Map<UUID, BigDecimal> porProduto(List<TotalPorProduto> totais) {
        return totais.stream().collect(Collectors.toMap(TotalPorProduto::produtoId, TotalPorProduto::total));
    }

    private static BigDecimal media(BigDecimal total, int dias) {
        return total.divide(BigDecimal.valueOf(dias), ESCALA_QUANTIDADE, RoundingMode.HALF_UP);
    }

    private static BigDecimal escala(BigDecimal valor) {
        return valor.setScale(ESCALA_QUANTIDADE, RoundingMode.HALF_UP);
    }

    private static int valor(Integer informado, int padrao) {
        return informado == null ? padrao : informado;
    }

    private record Janela(LocalDate inicio, LocalDate fim, int dias, int diasAntigos, int diasRecentes,
                          OffsetDateTime inicioTs, OffsetDateTime meioTs, OffsetDateTime fimTs) {
    }

    private record Totais(Map<UUID, BigDecimal> antigos, Map<UUID, BigDecimal> recentes) {
    }

    private record Consumo(BigDecimal total, BigDecimal mediaDiaria, BigDecimal mediaRecente, Tendencia tendencia,
                           BigDecimal variacaoPercentual) {
    }
}
