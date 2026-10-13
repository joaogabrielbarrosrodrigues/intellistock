import { StyleSheet, Text, View } from "react-native";
import { getApiErrorMessage } from "../api/errors";
import { EmptyState } from "../components/EmptyState";
import { Header } from "../components/Header";
import { Screen } from "../components/Screen";
import { StateView } from "../components/StateView";
import { useEstoqueQuery } from "../hooks/useIntellistockQueries";
import { colors } from "../theme/colors";
import { formatCurrency, formatQuantity } from "../utils";

export function EstoqueScreen() {
  const query = useEstoqueQuery();
  const itens = query.data ?? [];
  return (
    <Screen refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      <Header title="Estoque" subtitle="Posição atual dos produtos" />
      <StateView loading={query.isLoading} error={query.isError ? getApiErrorMessage(query.error, "Não foi possível carregar o estoque.") : null} onRetry={() => void query.refetch()} />
      {!query.isLoading && !query.isError && itens.length === 0 ? <EmptyState message="Nenhum item de estoque encontrado." /> : null}
      {itens.map((item) => (
        <View key={item.produtoId} style={styles.card}>
          <View style={styles.row}><Text style={styles.title}>{item.produtoNome}</Text><Text style={[styles.status, statusStyle[item.situacao]]}>{item.situacao}</Text></View>
          <View style={styles.row}><Text style={styles.meta}>Atual: {formatQuantity(item.quantidade, item.unidadeMedida)}</Text><Text style={styles.meta}>Mínimo: {formatQuantity(item.estoqueMinimo, item.unidadeMedida)}</Text></View>
          <Text style={styles.value}>{formatCurrency(item.valorEmEstoque)}</Text>
        </View>
      ))}
    </Screen>
  );
}

const statusStyle = StyleSheet.create({ NORMAL: { color: colors.success }, BAIXO: { color: colors.warning }, ZERADO: { color: colors.danger } });
const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 8, borderWidth: 1, gap: 8, padding: 14 },
  row: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", gap: 10 },
  title: { color: colors.text, flex: 1, fontSize: 17, fontWeight: "800" },
  status: { fontWeight: "900" },
  meta: { color: colors.muted, flex: 1 },
  value: { color: colors.primaryDark, fontSize: 16, fontWeight: "800" }
});
