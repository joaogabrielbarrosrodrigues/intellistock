import { StyleSheet, View } from "react-native";
import { getApiErrorMessage } from "../api/errors";
import type { ConsumoMensalPorUnidade } from "../api/types";
import { AppText as Text } from "../components/AppText";
import { Header } from "../components/Header";
import { KpiCard } from "../components/KpiCard";
import { Screen } from "../components/Screen";
import { StateView } from "../components/StateView";
import { Card, SectionTitle, StatusBadge } from "../components/ui";
import { useDashboardQuery } from "../hooks/useIntellistockQueries";
import { colors } from "../theme/colors";
import { radius, spacing } from "../theme/tokens";
import { formatCurrency, formatDate, formatQuantity } from "../utils";

export function DashboardScreen() {
  const query = useDashboardQuery();
  const dashboard = query.data;
  // getDashboard já garante que as três listas são arrays.
  const consumoMensal = dashboard?.consumoMensal ?? [];
  const movimentacoes = dashboard?.movimentacoesRecentes ?? [];
  const proximosVencimentos = dashboard?.contasProximasVencimento ?? [];

  return (
    <Screen refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      <Header subtitle="O que precisa de atenção e como está a operação" title="Visão geral" />
      <StateView
        error={query.isError ? getApiErrorMessage(query.error, "Não foi possível carregar a visão geral.") : null}
        loading={query.isLoading}
        onRetry={() => void query.refetch()}
      />

      {dashboard ? (
        <>
          <Card style={styles.alertCard}>
            <View style={styles.alertTop}>
              <Text style={styles.alertTitle}>Prioridades</Text>
              <StatusBadge
                label={dashboard.estoque.produtosSemEstoque || dashboard.financeiro.contasVencidas || dashboard.sugestoesReposicao ? "Acompanhar" : "Tudo em dia"}
                tone={dashboard.estoque.produtosSemEstoque || dashboard.financeiro.contasVencidas || dashboard.sugestoesReposicao ? "warning" : "success"}
              />
            </View>
            <View style={styles.alertRow}><Text style={[styles.alertCount, dashboard.estoque.produtosSemEstoque > 0 && styles.alertDanger]}>{formatQuantity(dashboard.estoque.produtosSemEstoque)}</Text><Text style={styles.alertText}>produtos sem estoque</Text></View>
            <View style={styles.alertRow}><Text style={styles.alertCount}>{formatQuantity(dashboard.sugestoesReposicao)}</Text><Text style={styles.alertText}>sugestões de reposição</Text></View>
            <View style={styles.alertRow}><Text style={[styles.alertCount, dashboard.financeiro.contasVencidas > 0 && styles.alertDanger]}>{formatQuantity(dashboard.financeiro.contasVencidas)}</Text><Text style={styles.alertText}>contas vencidas</Text></View>
          </Card>

          <SectionTitle title="Estoque" />
          <View style={styles.grid}>
            <KpiCard icon="cube-outline" label="Produtos ativos" value={String(dashboard.estoque.totalProdutos)} />
            <KpiCard
              icon="alert-circle-outline"
              label="Estoque baixo"
              tone={dashboard.estoque.produtosEstoqueBaixo ? "warning" : "primary"}
              value={String(dashboard.estoque.produtosEstoqueBaixo)}
            />
          </View>
          <KpiCard icon="wallet-outline" label="Valor total em estoque" value={formatCurrency(dashboard.estoque.valorTotalEstoque)} />

          <SectionTitle title="Financeiro" />
          <KpiCard
            detail={dashboard.financeiro.contasVencidas ? `${formatCurrency(dashboard.financeiro.valorVencido)} já vencidos` : "Nenhum valor vencido"}
            icon="card-outline"
            label="Contas em aberto"
            tone={dashboard.financeiro.contasVencidas ? "danger" : "primary"}
            value={formatCurrency(dashboard.financeiro.valorEmAberto)}
          />
          <View style={styles.grid}>
            <KpiCard icon="alert-circle-outline" label="Contas vencidas" tone={dashboard.financeiro.contasVencidas ? "danger" : "primary"} value={String(dashboard.financeiro.contasVencidas)} />
            <KpiCard icon="calendar-outline" label="Próximas a vencer" value={String(dashboard.financeiro.contasProximasVencimento)} />
          </View>

          <SectionTitle title="Consumo nos últimos meses" />
          {consumoMensal.length ? (
            consumoMensal.map((serie) => <ConsumptionCard key={serie.unidadeMedida} serie={serie} />)
          ) : (
            <Card><Text style={styles.muted}>Registre saídas para acompanhar o consumo ao longo do tempo.</Text></Card>
          )}

          <SectionTitle title="Movimentações recentes" />
          <Card style={styles.listCard}>
            {movimentacoes.length === 0 ? (
              <Text style={styles.muted}>Nenhuma movimentação recente.</Text>
            ) : movimentacoes.slice(0, 5).map((item, index) => (
              <View key={item.id} style={[styles.row, index > 0 && styles.rowBorder]}>
                <View style={styles.rowText}>
                  <Text numberOfLines={1} style={styles.rowTitle}>{item.produtoNome}</Text>
                  <Text style={styles.rowSubtitle}>
                    {formatDate(item.data)}{item.usuarioNome ? ` · ${item.usuarioNome}` : ""}
                  </Text>
                </View>
                <StatusBadge
                  label={`${item.tipo === "SAIDA" ? "−" : "+"}${formatQuantity(item.quantidade)}`}
                  tone={item.tipo === "SAIDA" ? "danger" : "success"}
                />
              </View>
            ))}
          </Card>

          <SectionTitle title="Próximos vencimentos" />
          <Card style={styles.listCard}>
            {proximosVencimentos.length === 0 ? (
              <Text style={styles.muted}>Nenhuma conta vence nos próximos dias.</Text>
            ) : proximosVencimentos.slice(0, 3).map((conta, index) => (
              <View key={conta.id} style={[styles.row, index > 0 && styles.rowBorder]}>
                <View style={styles.rowText}>
                  <Text numberOfLines={1} style={styles.rowTitle}>{conta.descricao}</Text>
                  <Text style={styles.rowSubtitle}>
                    {formatDate(conta.dataVencimento)} · {conta.fornecedor?.nome ?? "Sem fornecedor"}
                  </Text>
                </View>
                <Text numberOfLines={1} style={styles.money}>{formatCurrency(conta.valor)}</Text>
              </View>
            ))}
          </Card>
        </>
      ) : null}
    </Screen>
  );
}

function ConsumptionCard({ serie }: { serie: ConsumoMensalPorUnidade }) {
  const points = serie.pontos;
  const max = Math.max(...points.map((point) => Number(point.quantidade)), 1);

  return (
    <Card style={styles.chartCard}>
      <View style={styles.chartHeader}>
        <Text style={styles.chartTitle}>Consumo em {serie.unidadeMedida}</Text>
        <StatusBadge label={serie.unidadeMedida} tone="primary" />
      </View>
      <View style={styles.chart}>
        {points.map((point) => {
          const height = Math.max(6, (Number(point.quantidade) / max) * 92);
          return (
            <View accessibilityLabel={`${formatMonth(point.inicio)}: ${formatQuantity(point.quantidade, serie.unidadeMedida)}`} key={point.inicio} style={styles.barItem}>
              <Text style={styles.barValue}>{formatQuantity(point.quantidade)}</Text>
              <View style={styles.barTrack}><View style={[styles.bar, { height }]} /></View>
              <Text numberOfLines={1} style={styles.barLabel}>{formatMonth(point.inicio)}</Text>
            </View>
          );
        })}
      </View>
    </Card>
  );
}

function formatMonth(date: string) {
  const [year, month] = date.split("-");
  return month && year ? `${month}/${year.slice(2)}` : date;
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", gap: spacing.sm },
  alertCard: { backgroundColor: colors.primaryLight, gap: spacing.xs },
  alertTop: { alignItems: "center", flexDirection: "row", gap: spacing.sm, justifyContent: "space-between" },
  alertTitle: { color: colors.primaryDark, fontSize: 16, fontWeight: "800" },
  alertRow: { alignItems: "center", borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: "row", gap: spacing.sm, minHeight: 34 },
  alertCount: { color: colors.primaryDark, fontSize: 17, fontWeight: "800", minWidth: 26 },
  alertDanger: { color: colors.danger },
  alertText: { color: colors.textSecondary, flex: 1, lineHeight: 20 },
  muted: { color: colors.muted, lineHeight: 20 },
  listCard: { paddingVertical: spacing.xs },
  row: { alignItems: "center", flexDirection: "row", gap: spacing.sm, minHeight: 60, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  rowBorder: { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth },
  rowText: { flex: 1 },
  rowTitle: { color: colors.text, fontWeight: "800" },
  rowSubtitle: { color: colors.muted, fontSize: 12, marginTop: 3 },
  money: { color: colors.primaryDark, flexShrink: 1, fontSize: 14, fontWeight: "800" },
  chartCard: { gap: spacing.sm },
  chartHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  chartTitle: { color: colors.text, flex: 1, fontSize: 15, fontWeight: "800" },
  chart: { alignItems: "flex-end", flexDirection: "row", gap: spacing.xs, height: 132, justifyContent: "space-around" },
  barItem: { alignItems: "center", flex: 1, height: "100%", justifyContent: "flex-end" },
  barValue: { color: colors.textSecondary, fontSize: 10, marginBottom: 3 },
  barTrack: { backgroundColor: colors.surfaceMuted, borderRadius: radius.pill, height: 94, justifyContent: "flex-end", overflow: "hidden", width: 16 },
  bar: { backgroundColor: colors.primary, borderRadius: radius.pill, width: "100%" },
  barLabel: { color: colors.muted, fontSize: 10, marginTop: 5, maxWidth: 42 }
});
