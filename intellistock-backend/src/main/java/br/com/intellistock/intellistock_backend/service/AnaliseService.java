package br.com.intellistock.intellistock_backend.service;

import br.com.intellistock.intellistock_backend.config.AnaliseProperties;
import br.com.intellistock.intellistock_backend.dto.ConsumoResponse;
import br.com.intellistock.intellistock_backend.dto.ConsumoPorUnidadeResponse;
import br.com.intellistock.intellistock_backend.dto.ConsumoSerieResponse;
import br.com.intellistock.intellistock_backend.dto.ConsumoSerieResponse.Agrupamento;
import br.com.intellistock.intellistock_backend.dto.FornecedorResumo;
import br.com.intellistock.intellistock_backend.dto.ReposicaoResponse;
import br.com.intellistock.intellistock_backend.dto.Tendencia;
import br.com.intellistock.intellistock_backend.entity.Produto;
import br.com.intellistock.intellistock_backend.entity.TipoMovimentacao;
import br.com.intellistock.intellistock_backend.entity.UnidadeMedida;
import br.com.intellistock.intellistock_backend.exception.BusinessException;
import br.com.intellistock.intellistock_backend.repository.MovimentacaoRepository;
import br.com.intellistock.intellistock_backend.repository.ProdutoRepository;
import br.com.intellistock.intellistock_backend.repository.QuantidadeNaData;
import br.com.intellistock.intellistock_backend.repository.QuantidadePorUnidadeNaData;
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
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Título: Cálculo das análises de consumo e da reposição
 * Explicação: Service de análise. Calcula indicadores a partir das saídas registradas; não grava nada.
 *
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

    /**
     * Título: Construtor
     * Explicação: O Spring chama ao criar o objeto e entrega pronto o que ele precisa: produtoRepository
     *   (ProdutoRepository), movimentacaoRepository (MovimentacaoRepository), produtoService (ProdutoService),
     *   properties (AnaliseProperties) e clock (Clock).
     */
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

    /**
     * Título: Consumo e tendência de um produto ou de todos os ativos
     * Explicação: Recebe produtoId (UUID) e dias (Integer). Para um produto ou todos os ativos, soma as saídas
     *   da janela (padrão 30 dias), calcula média diária, semanal (×7) e mensal (×30) e a tendência. Devolve
     *   List<ConsumoResponse>. Chamado por AnaliseController.
     */
    @Transactional(readOnly = true)
    public List<ConsumoResponse> consumo(UUID produtoId, Integer dias) {
        Janela janela = janela(dias == null ? properties.diasAnalise() : dias);
        List<Produto> produtos = produtoId == null
                ? produtoRepository.findByAtivoTrueOrderByNomeAsc()
                : List.of(produtoService.buscarEntidade(produtoId));

        Totais totais = totais(janela, produtoId);
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
     * Título: Série temporal de consumo por produto ou por unidade de medida
     * Explicação: Recebe produtoId (UUID), unidadeMedida (UnidadeMedida), agrupamento (Agrupamento) e dias
     *   (Integer). Distribui as saídas em grupos por dia, semana (começando na segunda) ou mês, para gráficos.
     *   Devolve ConsumoSerieResponse. Chamado por AnaliseController.
     *
     * Serie de consumo agrupada por dia, semana (iniciando na segunda-feira) ou mes.
     *
     * @param produtoId produto específico; quando omitido, unidadeMedida é obrigatória
     * @param dias      janela em dias; quando null usa 30 (diario), 84 (semanal) ou 180 (mensal)
     */
    @Transactional(readOnly = true)
    public ConsumoSerieResponse serie(UUID produtoId, UnidadeMedida unidadeMedida, Agrupamento agrupamento,
                                      Integer dias) {
        if (produtoId == null && unidadeMedida == null) {
            throw new BusinessException("Informe produtoId ou unidadeMedida para gerar a serie de consumo.");
        }
        if (produtoId != null && unidadeMedida != null) {
            throw new BusinessException("Informe apenas produtoId ou unidadeMedida, nao ambos.");
        }
        int periodo = dias != null ? dias : switch (agrupamento) {
            case DIARIO -> 30;
            case SEMANAL -> 84;
            case MENSAL -> 180;
        };
        LocalDate hoje = LocalDate.now(clock);
        Produto produto = produtoId == null ? null : produtoService.buscarEntidade(produtoId);
        UnidadeMedida unidade = produto == null ? unidadeMedida : produto.getUnidadeMedida();
        List<ConsumoSerieResponse.Ponto> pontos = pontos(
                produtoId, unidadeMedida, agrupamento, hoje.minusDays(periodo - 1L), hoje);
        return new ConsumoSerieResponse(
                produtoId, produto == null ? null : produto.getNome(), unidade, agrupamento, pontos);
    }

    /**
     * Título: Consumo mês a mês separado por unidade (usado no dashboard)
     * Explicação: Recebe meses (int). Consumo mês a mês dos últimos meses, separado por unidade de medida (não
     *   soma quilos com litros). Usado no dashboard. Devolve List<ConsumoPorUnidadeResponse>. Chamado por
     *   DashboardService.
     *
     * Consumo mensal separado por unidade de medida. Somar, por exemplo, litros e unidades
     * produz um indicador sem significado; por isso cada unidade possui sua própria série.
     */
    @Transactional(readOnly = true)
    public List<ConsumoPorUnidadeResponse> consumoMensal(int meses) {
        LocalDate hoje = LocalDate.now(clock);
        LocalDate inicio = hoje.withDayOfMonth(1).minusMonths(meses - 1L);
        ZoneId zona = clock.getZone();
        OffsetDateTime inicioTs = inicio.atStartOfDay(zona).toOffsetDateTime();
        OffsetDateTime fimTs = hoje.plusDays(1).atStartOfDay(zona).toOffsetDateTime();

        List<QuantidadePorUnidadeNaData> quantidades = movimentacaoRepository.findQuantidadesPorUnidade(
                TipoMovimentacao.SAIDA, inicioTs, fimTs);
        Map<UnidadeMedida, Map<LocalDate, BigDecimal>> series = new EnumMap<>(UnidadeMedida.class);

        for (QuantidadePorUnidadeNaData item : quantidades) {
            LocalDate mes = item.data().atZoneSameInstant(zona).toLocalDate().withDayOfMonth(1);
            series.computeIfAbsent(item.unidadeMedida(), ignored -> bucketsMensais(inicio, hoje))
                    .merge(mes, item.quantidade(), BigDecimal::add);
        }

        return series.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(entry -> new ConsumoPorUnidadeResponse(
                        entry.getKey(),
                        pontosDosBuckets(entry.getValue(), inicio, hoje, Agrupamento.MENSAL)))
                .toList();
    }

    /**
     * Título: Calcula a sugestão de todos os produtos ativos e ordena por prioridade
     * Explicação: Recebe parametros (ParametrosReposicao) e incluirTodos (boolean). Calcula a sugestão de
     *   compra de todos os produtos ativos com o CalculoReposicao e ordena por prioridade, dias restantes e
     *   nome. Devolve List<ReposicaoResponse>. Chamado por AnaliseController.
     */
    @Transactional(readOnly = true)
    public List<ReposicaoResponse> reposicao(ParametrosReposicao parametros, boolean incluirTodos) {
        int diasCobertura = valor(parametros.diasCobertura(), properties.diasCobertura());
        int prazoEntrega = valor(parametros.prazoEntregaDias(), properties.prazoEntregaDias());
        int diasSeguranca = valor(parametros.diasSeguranca(), properties.diasSeguranca());
        Janela janela = janela(valor(parametros.dias(), properties.diasAnalise()));

        Totais totais = totais(janela, null);
        return produtoRepository.findByAtivoTrueOrderByNomeAsc().stream()
                .map(produto -> calcularReposicao(produto, calcularConsumo(produto.getId(), janela, totais),
                        janela.dias(), diasCobertura, prazoEntrega, diasSeguranca))
                .filter(sugestao -> incluirTodos || sugestao.precisaRepor())
                .sorted(Comparator.comparing(ReposicaoResponse::prioridade)
                        .thenComparing(ReposicaoResponse::diasRestantes, Comparator.nullsLast(Comparator.naturalOrder()))
                        .thenComparing(ReposicaoResponse::produtoNome))
                .toList();
    }

    /**
     * Título: Conta quantos produtos precisam de reposição (número do dashboard)
     * Explicação: Conta quantos produtos precisam de compra, para o número do dashboard. Devolve long. Chamado
     *   por DashboardService.
     */
    @Transactional(readOnly = true)
    public long contarSugestoesReposicao() {
        Janela janela = janela(properties.diasAnalise());
        Totais totais = totais(janela, null);
        return produtoRepository.findAtivosParaAnalise().stream()
                .filter(produto -> calcularReposicao(produto, calcularConsumo(produto.getId(), janela, totais),
                        properties.diasCobertura(), properties.prazoEntregaDias(), properties.diasSeguranca())
                        .precisaRepor())
                .count();
    }

    /**
     * Título: Junta os números do cálculo em uma resposta ou chama o CalculoReposicao
     * Explicação: Recebe produto (Produto), consumo (Consumo), periodoAnaliseDias (int), diasCobertura (int),
     *   prazoEntrega (int) e diasSeguranca (int). Devolve ReposicaoResponse.
     */
    private ReposicaoResponse calcularReposicao(Produto produto, Consumo consumo, int periodoAnaliseDias,
                                                int diasCobertura, int prazoEntrega, int diasSeguranca) {
        BigDecimal estoqueAtual = produto.getQuantidade();
        CalculoReposicao calculo = calcularReposicao(produto, consumo, diasCobertura, prazoEntrega, diasSeguranca);
        BigDecimal sugerida = calculo.quantidadeSugerida(produto.getUnidadeMedida());

        return new ReposicaoResponse(
                produto.getId(),
                produto.getNome(),
                produto.getUnidadeMedida(),
                FornecedorResumo.from(produto.getFornecedor()),
                estoqueAtual,
                produto.getEstoqueMinimo(),
                consumo.mediaDiaria(),
                escala(calculo.consumoBase()),
                consumo.tendencia(),
                calculo.minimoCalculado(),
                calculo.estoqueSeguranca(),
                calculo.pontoPedido(),
                calculo.diasRestantes(estoqueAtual),
                calculo.precisaRepor(),
                sugerida,
                sugerida.multiply(produto.getPreco()).setScale(2, RoundingMode.HALF_UP),
                calculo.prioridade(estoqueAtual, prazoEntrega),
                consumo.total(),
                periodoAnaliseDias,
                diasCobertura,
                prazoEntrega,
                diasSeguranca
        );
    }

    /**
     * Título: Junta os números do cálculo em uma resposta ou chama o CalculoReposicao
     * Explicação: Recebe produto (Produto), consumo (Consumo), diasCobertura (int), prazoEntrega (int) e
     *   diasSeguranca (int). Devolve CalculoReposicao.
     */
    private CalculoReposicao calcularReposicao(Produto produto, Consumo consumo,
                                               int diasCobertura, int prazoEntrega, int diasSeguranca) {
        return CalculoReposicao.calcular(produto.getQuantidade(), produto.getEstoqueMinimo(),
                consumo.mediaDiaria(), consumo.mediaRecente(), consumo.tendencia(),
                diasCobertura, prazoEntrega, diasSeguranca);
    }

    /**
     * Título: Calcula total, médias e tendência de um produto
     * Explicação: Recebe produtoId (UUID), janela (Janela) e totais (Totais). Devolve Consumo.
     */
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

    /**
     * Título: Soma as saídas na metade antiga e na metade recente do período
     * Explicação: Recebe janela (Janela) e produtoId (UUID). Devolve Totais.
     */
    private Totais totais(Janela janela, UUID produtoId) {
        if (produtoId != null) {
            return new Totais(
                    Map.of(produtoId, movimentacaoRepository.sumQuantidadeDoProduto(produtoId, TipoMovimentacao.SAIDA,
                            janela.inicioTs(), janela.meioTs())),
                    Map.of(produtoId, movimentacaoRepository.sumQuantidadeDoProduto(produtoId, TipoMovimentacao.SAIDA,
                            janela.meioTs(), janela.fimTs())));
        }
        return new Totais(
                porProduto(movimentacaoRepository.sumPorProduto(TipoMovimentacao.SAIDA, janela.inicioTs(), janela.meioTs())),
                porProduto(movimentacaoRepository.sumPorProduto(TipoMovimentacao.SAIDA, janela.meioTs(), janela.fimTs()))
        );
    }

    /**
     * Título: Busca as saídas do período e distribui em grupos por dia, semana ou mês
     * Explicação: Recebe produtoId (UUID), unidadeMedida (UnidadeMedida), agrupamento (Agrupamento), inicio
     *   (LocalDate) e fim (LocalDate). Devolve List<ConsumoSerieResponse.Ponto>.
     */
    private List<ConsumoSerieResponse.Ponto> pontos(UUID produtoId, UnidadeMedida unidadeMedida,
                                                    Agrupamento agrupamento, LocalDate inicio, LocalDate fim) {
        ZoneId zona = clock.getZone();
        OffsetDateTime inicioTs = inicio.atStartOfDay(zona).toOffsetDateTime();
        OffsetDateTime fimTs = fim.plusDays(1).atStartOfDay(zona).toOffsetDateTime();

        List<QuantidadeNaData> quantidades = produtoId != null
                ? movimentacaoRepository.findQuantidadesPorProduto(
                        produtoId, TipoMovimentacao.SAIDA, inicioTs, fimTs)
                : movimentacaoRepository.findQuantidadesPorUnidadeMedida(
                        unidadeMedida, TipoMovimentacao.SAIDA, inicioTs, fimTs);

        Map<LocalDate, BigDecimal> buckets = new TreeMap<>();
        for (LocalDate cursor = inicioDoBucket(inicio, agrupamento); !cursor.isAfter(fim);
             cursor = proximoBucket(cursor, agrupamento)) {
            buckets.put(cursor, BigDecimal.ZERO);
        }
        for (QuantidadeNaData item : quantidades) {
            LocalDate data = item.data().atZoneSameInstant(zona).toLocalDate();
            buckets.merge(inicioDoBucket(data, agrupamento), item.quantidade(), BigDecimal::add);
        }

        return pontosDosBuckets(buckets, inicio, fim, agrupamento);
    }

    /**
     * Título: Cria os meses vazios do período
     * Explicação: Recebe inicio (LocalDate) e fim (LocalDate). Devolve Map<LocalDate, BigDecimal>.
     */
    private Map<LocalDate, BigDecimal> bucketsMensais(LocalDate inicio, LocalDate fim) {
        Map<LocalDate, BigDecimal> buckets = new TreeMap<>();
        for (LocalDate cursor = inicio.withDayOfMonth(1); !cursor.isAfter(fim); cursor = cursor.plusMonths(1)) {
            buckets.put(cursor, BigDecimal.ZERO);
        }
        return buckets;
    }

    /**
     * Título: Transforma os grupos em pontos com data de início e fim
     * Explicação: Recebe buckets (Map<LocalDate,BigDecimal>), inicio (LocalDate), fim (LocalDate) e
     *   agrupamento (Agrupamento). Devolve List<ConsumoSerieResponse.Ponto>.
     */
    private List<ConsumoSerieResponse.Ponto> pontosDosBuckets(Map<LocalDate, BigDecimal> buckets,
                                                               LocalDate inicio, LocalDate fim,
                                                               Agrupamento agrupamento) {
        List<ConsumoSerieResponse.Ponto> pontos = new ArrayList<>();
        buckets.forEach((bucket, quantidade) -> {
            LocalDate inicioPonto = bucket.isBefore(inicio) ? inicio : bucket;
            LocalDate fimBucket = proximoBucket(bucket, agrupamento).minusDays(1);
            LocalDate fimPonto = fimBucket.isAfter(fim) ? fim : fimBucket;
            pontos.add(new ConsumoSerieResponse.Ponto(inicioPonto, fimPonto, escala(quantidade)));
        });
        return pontos;
    }

    /**
     * Título: Primeiro dia do grupo (dia, segunda-feira da semana ou dia 1 do mês)
     * Explicação: Recebe data (LocalDate) e agrupamento (Agrupamento). Devolve LocalDate.
     */
    private LocalDate inicioDoBucket(LocalDate data, Agrupamento agrupamento) {
        return switch (agrupamento) {
            case DIARIO -> data;
            case SEMANAL -> data.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
            case MENSAL -> data.withDayOfMonth(1);
        };
    }

    /**
     * Título: Início do grupo seguinte
     * Explicação: Recebe inicioBucket (LocalDate) e agrupamento (Agrupamento). Devolve LocalDate.
     */
    private LocalDate proximoBucket(LocalDate inicioBucket, Agrupamento agrupamento) {
        return switch (agrupamento) {
            case DIARIO -> inicioBucket.plusDays(1);
            case SEMANAL -> inicioBucket.plusWeeks(1);
            case MENSAL -> inicioBucket.plusMonths(1);
        };
    }

    /**
     * Título: Calcula as datas da janela de análise e o ponto do meio
     * Explicação: Recebe dias (int). Devolve Janela.
     */
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

    /**
     * Título: Transforma a lista de somas em um mapa produto → total
     * Explicação: Recebe totais (List<TotalPorProduto>). Devolve Map<UUID, BigDecimal>.
     */
    private static Map<UUID, BigDecimal> porProduto(List<TotalPorProduto> totais) {
        return totais.stream().collect(Collectors.toMap(TotalPorProduto::produtoId, TotalPorProduto::total));
    }

    /**
     * Título: Divide o total pelos dias com 3 casas decimais
     * Explicação: Recebe total (BigDecimal) e dias (int). Devolve BigDecimal.
     */
    private static BigDecimal media(BigDecimal total, int dias) {
        return total.divide(BigDecimal.valueOf(dias), ESCALA_QUANTIDADE, RoundingMode.HALF_UP);
    }

    /**
     * Título: Arredonda para 3 casas decimais
     * Explicação: Recebe valor (BigDecimal). Devolve BigDecimal.
     */
    private static BigDecimal escala(BigDecimal valor) {
        return valor.setScale(ESCALA_QUANTIDADE, RoundingMode.HALF_UP);
    }

    /**
     * Título: Usa o valor informado ou o padrão
     * Explicação: Recebe informado (Integer) e padrao (int). Devolve int.
     */
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
