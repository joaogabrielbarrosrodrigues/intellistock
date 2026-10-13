import { StyleSheet, Text, View } from "react-native";
import { getApiErrorMessage } from "../api/errors";
import { EmptyState } from "../components/EmptyState";
import { Header } from "../components/Header";
import { Screen } from "../components/Screen";
import { StateView } from "../components/StateView";
import { useProdutosQuery } from "../hooks/useIntellistockQueries";
import { colors } from "../theme/colors";
import { formatCurrency, formatQuantity } from "../utils";

export function ProdutosScreen() {
  const query = useProdutosQuery();
  const produtos = query.data ?? [];
  return (
    <Screen refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      <Header title="Produtos" subtitle={`${produtos.length} itens ativos`} />
      <StateView loading={query.isLoading} error={query.isError ? getApiErrorMessage(query.error, "Não foi possível carregar os produtos.") : null} onRetry={() => void query.refetch()} />
      {!query.isLoading && !query.isError && produtos.length === 0 ? <EmptyState message="Nenhum produto cadastrado." /> : null}
      {produtos.map((produto) => (
        <View key={produto.id} style={styles.card}>
          <View style={styles.cardHeader}><Text style={styles.title}>{produto.nome}</Text>{produto.estoqueBaixo ? <Text style={styles.warning}>Estoque baixo</Text> : null}</View>
          <Text style={styles.subtitle}>{produto.descricao || "Sem descrição"}</Text>
          <View style={styles.metaRow}><Text style={styles.meta}>{formatQuantity(produto.quantidade, produto.unidadeMedida)}</Text><Text style={styles.meta}>{formatCurrency(produto.preco)}</Text></View>
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 8, borderWidth: 1, gap: 8, padding: 14 },
  cardHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", gap: 8 },
  title: { color: colors.text, flex: 1, fontSize: 17, fontWeight: "800" },
  subtitle: { color: colors.muted },
  warning: { color: colors.warning, fontWeight: "800", fontSize: 12 },
  metaRow: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  meta: { color: colors.primaryDark, fontWeight: "700" }
});
