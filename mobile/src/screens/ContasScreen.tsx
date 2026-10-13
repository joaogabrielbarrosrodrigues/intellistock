import { StyleSheet, Text, View } from "react-native";
import { getApiErrorMessage } from "../api/errors";
import { EmptyState } from "../components/EmptyState";
import { Header } from "../components/Header";
import { Screen } from "../components/Screen";
import { StateView } from "../components/StateView";
import { useContasQuery } from "../hooks/useIntellistockQueries";
import { colors } from "../theme/colors";
import { formatCurrency, formatDate } from "../utils";

export function ContasScreen() {
  const query = useContasQuery();
  const contas = query.data ?? [];
  return (
    <Screen refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      <Header title="Contas" subtitle="Compromissos financeiros" />
      <StateView loading={query.isLoading} error={query.isError ? getApiErrorMessage(query.error, "Não foi possível carregar as contas.") : null} onRetry={() => void query.refetch()} />
      {!query.isLoading && !query.isError && contas.length === 0 ? <EmptyState message="Nenhuma conta cadastrada." /> : null}
      {contas.map((conta) => (
        <View key={conta.id} style={styles.card}>
          <View style={styles.row}><Text style={styles.title}>{conta.descricao}</Text><Text style={[styles.status, statusStyle[conta.status]]}>{conta.status}</Text></View>
          <Text style={styles.subtitle}>{conta.fornecedor?.nome ?? "Fornecedor não informado"}</Text>
          <View style={styles.row}><Text style={styles.value}>{formatCurrency(conta.valor)}</Text><Text style={styles.date}>Vence em {formatDate(conta.dataVencimento)}</Text></View>
        </View>
      ))}
    </Screen>
  );
}

const statusStyle = StyleSheet.create({ PENDENTE: { color: colors.warning }, VENCIDA: { color: colors.danger }, PAGA: { color: colors.success }, CANCELADA: { color: colors.muted } });
const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 8, borderWidth: 1, gap: 8, padding: 14 },
  row: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", gap: 10 },
  title: { color: colors.text, flex: 1, fontSize: 17, fontWeight: "800" },
  subtitle: { color: colors.muted },
  status: { fontWeight: "900", fontSize: 12 },
  value: { color: colors.primaryDark, fontSize: 16, fontWeight: "800" },
  date: { color: colors.muted }
});
