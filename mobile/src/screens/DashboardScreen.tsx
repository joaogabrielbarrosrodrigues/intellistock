import { StyleSheet, Text, View } from "react-native";
import { getApiErrorMessage } from "../api/errors";
import { Card, SectionTitle, StatusBadge } from "../components/ui";
import { Header } from "../components/Header";
import { KpiCard } from "../components/KpiCard";
import { Screen } from "../components/Screen";
import { StateView } from "../components/StateView";
import { useDashboardQuery } from "../hooks/useIntellistockQueries";
import { colors } from "../theme/colors";
import { radius, spacing } from "../theme/tokens";
import { formatCurrency, formatDate, formatQuantity } from "../utils";

export function DashboardScreen() {
  const query = useDashboardQuery(); const dashboard = query.data;
  return <Screen refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
    <Header subtitle="Visão geral da operação" title="Olá, gestão" />
    <StateView error={query.isError ? getApiErrorMessage(query.error, "Não foi possível carregar o dashboard.") : null} loading={query.isLoading} onRetry={() => void query.refetch()} />
    {dashboard ? <>
      <View style={styles.grid}><KpiCard icon="cube-outline" label="Produtos ativos" value={String(dashboard.estoque.totalProdutos)} /><KpiCard icon="alert-circle-outline" label="Estoque baixo" tone="warning" value={String(dashboard.estoque.produtosEstoqueBaixo)} /></View>
      <View style={styles.grid}><KpiCard icon="wallet-outline" label="Valor em estoque" value={formatCurrency(dashboard.estoque.valorTotalEstoque)} /><KpiCard icon="card-outline" label="Em aberto" tone={dashboard.financeiro.contasVencidas ? "danger" : "primary"} value={formatCurrency(dashboard.financeiro.valorEmAberto)} /></View>
      <Card style={styles.alertCard}><View style={styles.alertTop}><View style={styles.alertTextBlock}><Text style={styles.alertTitle}>Atenção operacional</Text><Text style={styles.alertText}>{dashboard.estoque.produtosSemEstoque} sem estoque · {dashboard.sugestoesReposicao} sugestões de reposição</Text></View><StatusBadge label={dashboard.financeiro.contasVencidas ? `${dashboard.financeiro.contasVencidas} vencida(s)` : "Financeiro em dia"} tone={dashboard.financeiro.contasVencidas ? "danger" : "success"} /></View></Card>
      <SectionTitle title="Consumo mensal" />
      <Card>{dashboard.consumoMensal.length ? <ConsumptionBars points={dashboard.consumoMensal} /> : <Text style={styles.muted}>Ainda não há saídas registradas para exibir o consumo.</Text>}</Card>
      <SectionTitle title="Movimentações recentes" />
      <Card style={styles.listCard}>{dashboard.movimentacoesRecentes.length === 0 ? <Text style={styles.muted}>Nenhuma movimentação recente.</Text> : dashboard.movimentacoesRecentes.slice(0, 5).map((item, index) => <View key={item.id} style={[styles.row, index > 0 && styles.rowBorder]}><View style={styles.rowText}><Text numberOfLines={1} style={styles.rowTitle}>{item.produtoNome}</Text><Text style={styles.rowSubtitle}>{formatDate(item.data)}{item.usuarioNome ? ` · ${item.usuarioNome}` : ""}</Text></View><StatusBadge label={`${item.tipo === "SAIDA" ? "−" : "+"}${formatQuantity(item.quantidade)}`} tone={item.tipo === "SAIDA" ? "danger" : "success"} /></View>)}</Card>
      <SectionTitle title="Próximos vencimentos" />
      <Card style={styles.listCard}>{dashboard.contasProximasVencimento.length === 0 ? <Text style={styles.muted}>Nenhuma conta vence nos próximos dias.</Text> : dashboard.contasProximasVencimento.slice(0, 3).map((conta, index) => <View key={conta.id} style={[styles.row, index > 0 && styles.rowBorder]}><View style={styles.rowText}><Text numberOfLines={1} style={styles.rowTitle}>{conta.descricao}</Text><Text style={styles.rowSubtitle}>{formatDate(conta.dataVencimento)} · {conta.fornecedor?.nome ?? "Sem fornecedor"}</Text></View><Text style={styles.money}>{formatCurrency(conta.valor)}</Text></View>)}</Card>
    </> : null}
  </Screen>;
}

function ConsumptionBars({ points }: { points: { periodo: string; quantidade: number }[] }) {
  const max = Math.max(...points.map((point) => Number(point.quantidade)), 1);
  return <View style={styles.chart}>{points.map((point) => { const height = Math.max(6, (Number(point.quantidade) / max) * 92); return <View key={point.periodo} style={styles.barItem}><Text style={styles.barValue}>{formatQuantity(point.quantidade)}</Text><View style={styles.barTrack}><View style={[styles.bar, { height }]} /></View><Text numberOfLines={1} style={styles.barLabel}>{point.periodo.slice(5).replace("-", "/")}</Text></View>; })}</View>;
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", gap: spacing.sm }, alertCard: { backgroundColor: colors.primaryLight }, alertTop: { alignItems: "center", flexDirection: "row", gap: spacing.sm, justifyContent: "space-between" }, alertTextBlock: { flex: 1 }, alertTitle: { color: colors.primaryDark, fontSize: 16, fontWeight: "800" }, alertText: { color: colors.textSecondary, marginTop: 3 }, muted: { color: colors.muted, lineHeight: 20 }, listCard: { paddingVertical: spacing.xs }, row: { alignItems: "center", flexDirection: "row", gap: spacing.sm, minHeight: 60, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs }, rowBorder: { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth }, rowText: { flex: 1 }, rowTitle: { color: colors.text, fontWeight: "800" }, rowSubtitle: { color: colors.muted, fontSize: 12, marginTop: 3 }, money: { color: colors.primaryDark, fontSize: 14, fontWeight: "800" }, chart: { alignItems: "flex-end", flexDirection: "row", gap: spacing.xs, height: 132, justifyContent: "space-around" }, barItem: { alignItems: "center", flex: 1, height: "100%", justifyContent: "flex-end" }, barValue: { color: colors.textSecondary, fontSize: 10, marginBottom: 3 }, barTrack: { backgroundColor: colors.surfaceMuted, borderRadius: radius.pill, height: 94, justifyContent: "flex-end", overflow: "hidden", width: 16 }, bar: { backgroundColor: colors.primary, borderRadius: radius.pill, width: "100%" }, barLabel: { color: colors.muted, fontSize: 10, marginTop: 5, maxWidth: 36 }
});
