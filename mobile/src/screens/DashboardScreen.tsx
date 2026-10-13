import { StyleSheet, Text, View } from "react-native";
import { getApiErrorMessage } from "../api/errors";
import { Header } from "../components/Header";
import { KpiCard } from "../components/KpiCard";
import { Screen } from "../components/Screen";
import { StateView } from "../components/StateView";
import { useDashboardQuery } from "../hooks/useIntellistockQueries";
import { colors } from "../theme/colors";
import { formatCurrency, formatDate, formatQuantity } from "../utils";

export function DashboardScreen() {
  const query = useDashboardQuery();
  const dashboard = query.data;

  return (
    <Screen refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      <Header title="Dashboard" subtitle="Resumo operacional" />
      <StateView loading={query.isLoading} error={query.isError ? getApiErrorMessage(query.error, "Não foi possível carregar o dashboard.") : null} onRetry={() => void query.refetch()} />
      {dashboard ? (
        <>
          <View style={styles.grid}>
            <KpiCard label="Produtos cadastrados" value={String(dashboard.estoque.totalProdutos)} />
            <KpiCard label="Estoque baixo" value={String(dashboard.estoque.produtosEstoqueBaixo)} tone="warning" />
          </View>
          <View style={styles.grid}>
            <KpiCard label="Valor em estoque" value={formatCurrency(dashboard.estoque.valorTotalEstoque)} />
            <KpiCard label="Contas vencidas" value={String(dashboard.financeiro.contasVencidas)} tone="danger" />
          </View>
          <View style={styles.grid}>
            <KpiCard label="Valor em aberto" value={formatCurrency(dashboard.financeiro.valorEmAberto)} />
            <KpiCard label="Sugestões de reposição" value={String(dashboard.sugestoesReposicao)} tone="warning" />
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Movimentações recentes</Text>
            {dashboard.movimentacoesRecentes.length === 0 ? <Text style={styles.muted}>Nenhuma movimentação recente.</Text> : null}
            {dashboard.movimentacoesRecentes.slice(0, 5).map((item) => (
              <View key={item.id} style={styles.row}>
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle}>{item.produtoNome}</Text>
                  <Text style={styles.rowSubtitle}>{formatDate(item.data)}</Text>
                </View>
                <Text style={[styles.badge, item.tipo === "SAIDA" ? styles.badgeDanger : styles.badgeSuccess]}>{item.tipo === "SAIDA" ? "-" : "+"}{formatQuantity(item.quantidade)}</Text>
              </View>
            ))}
          </View>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", gap: 10 },
  section: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 8, borderWidth: 1, padding: 14 },
  sectionTitle: { color: colors.text, fontSize: 17, fontWeight: "800", marginBottom: 8 },
  muted: { color: colors.muted },
  row: { alignItems: "center", borderTopColor: colors.border, borderTopWidth: 1, flexDirection: "row", justifyContent: "space-between", minHeight: 56, paddingVertical: 8 },
  rowText: { flex: 1 },
  rowTitle: { color: colors.text, fontWeight: "700" },
  rowSubtitle: { color: colors.muted, fontSize: 12, marginTop: 2 },
  badge: { fontWeight: "800" },
  badgeDanger: { color: colors.danger },
  badgeSuccess: { color: colors.success }
});
