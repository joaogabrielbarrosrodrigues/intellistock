import { useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { getApiErrorMessage } from "../api/errors";
import type { EstoqueItem, TipoMovimentacao } from "../api/types";
import { EmptyState } from "../components/EmptyState";
import { AppText as Text } from "../components/AppText";
import { Header } from "../components/Header";
import { MovimentacaoModal } from "../components/MovimentacaoModal";
import { Screen } from "../components/Screen";
import { Card, SectionTitle, StatusBadge } from "../components/ui";
import { StateView } from "../components/StateView";
import { useEstoqueQuery, useMovimentacoesQuery } from "../hooks/useIntellistockQueries";
import { colors } from "../theme/colors";
import { radius, shadow, spacing } from "../theme/tokens";
import { formatCurrency, formatDate, formatQuantity } from "../utils";

type Filter = "TODOS" | "BAIXO" | "ZERADO";
export function EstoqueScreen() {
  const query = useEstoqueQuery();
  const movements = useMovimentacoesQuery(undefined, 8);
  const [filter, setFilter] = useState<Filter>("TODOS");
  const [launch, setLaunch] = useState<{ item: EstoqueItem; type: TipoMovimentacao } | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const items = query.data ?? [];
  const displayed = useMemo(
    () => items.filter((item) => filter === "TODOS" || item.situacao === filter),
    [filter, items]
  );
  const lowCount = items.filter((item) => item.situacao === "BAIXO").length;
  const zeroCount = items.filter((item) => item.situacao === "ZERADO").length;
  return (
    <Screen
      refreshing={query.isRefetching || movements.isRefetching}
      onRefresh={() => {
        void query.refetch();
        void movements.refetch();
      }}
    >
      <Header subtitle="Saldo, alertas e lançamentos" title="Estoque" />
      <View style={styles.summary}>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{lowCount}</Text>
          <Text style={styles.summaryLabel}>em nível baixo</Text>
        </Card>
        <Card style={styles.summaryCard}>
          <Text style={[styles.summaryValue, { color: colors.danger }]}>{zeroCount}</Text>
          <Text style={styles.summaryLabel}>sem estoque</Text>
        </Card>
      </View>
      <View style={styles.filters}>
        {(["TODOS", "BAIXO", "ZERADO"] as Filter[]).map((value) => (
          <Pressable
            key={value}
            accessibilityRole="button"
            onPress={() => setFilter(value)}
            style={[styles.filter, filter === value && styles.filterSelected]}
          >
            <Text style={[styles.filterText, filter === value && styles.filterTextSelected]}>
              {value === "TODOS" ? "Todos" : value === "BAIXO" ? "Baixo" : "Zerado"}
            </Text>
          </Pressable>
        ))}
      </View>
      {feedback ? (
        <Text accessibilityRole="alert" style={styles.feedback}>
          {feedback}
        </Text>
      ) : null}
      <StateView
        error={
          query.isError
            ? getApiErrorMessage(query.error, "Não foi possível carregar o estoque.")
            : null
        }
        loading={query.isLoading}
        onRetry={() => void query.refetch()}
      />
      {!query.isLoading && !query.isError && displayed.length === 0 ? (
        <EmptyState message="Não há itens nesta situação." title="Estoque sem resultados" />
      ) : null}
      {displayed.map((item) => (
        <View key={item.produtoId} style={styles.card}>
          <View style={styles.cardBody}>
            <View style={styles.cardHeader}>
              <Text numberOfLines={1} style={styles.title}>
                {item.produtoNome}
              </Text>
              <StatusBadge
                label={
                  item.situacao === "NORMAL"
                    ? "Normal"
                    : item.situacao === "BAIXO"
                      ? "Baixo"
                      : "Zerado"
                }
                tone={
                  item.situacao === "NORMAL"
                    ? "success"
                    : item.situacao === "BAIXO"
                      ? "warning"
                      : "danger"
                }
              />
            </View>
            <View style={styles.values}>
              <View>
                <Text style={styles.meta}>Saldo disponível</Text>
                <Text style={styles.quantity}>
                  {formatQuantity(item.quantidade, item.unidadeMedida)}
                </Text>
              </View>
              <View style={styles.valueEnd}>
                <Text style={styles.meta}>Valor em estoque</Text>
                <Text style={styles.stockValue}>{formatCurrency(item.valorEmEstoque)}</Text>
              </View>
            </View>
            <Text style={styles.minimum}>
              Mínimo: {formatQuantity(item.estoqueMinimo, item.unidadeMedida)}
            </Text>
          </View>
          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              onPress={() => setLaunch({ item, type: "ENTRADA" })}
              style={styles.entry}
            >
              <Text style={styles.entryText}>Registrar entrada</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => setLaunch({ item, type: "SAIDA" })}
              style={styles.exit}
            >
              <Text style={styles.exitText}>Registrar saída</Text>
            </Pressable>
          </View>
        </View>
      ))}
      <SectionTitle title="Histórico recente" />
      <Card style={styles.history}>
        {movements.isLoading ? (
          <Text style={styles.muted}>Atualizando histórico...</Text>
        ) : movements.isError ? (
          <StateView
            error={getApiErrorMessage(movements.error, "Não foi possível carregar o histórico.")}
            onRetry={() => void movements.refetch()}
          />
        ) : (movements.data ?? []).length === 0 ? (
          <Text style={styles.muted}>Nenhuma movimentação registrada.</Text>
        ) : (
          (movements.data ?? []).slice(0, 8).map((move, index) => (
            <View key={move.id} style={[styles.move, index > 0 && styles.moveBorder]}>
              <View style={styles.moveText}>
                <Text numberOfLines={1} style={styles.moveName}>
                  {move.produtoNome}
                </Text>
                <Text style={styles.moveDate}>
                  {formatDate(move.data)}
                  {move.observacao ? ` · ${move.observacao}` : ""}
                </Text>
              </View>
              <StatusBadge
                label={`${move.tipo === "SAIDA" ? "−" : "+"}${formatQuantity(move.quantidade)}`}
                tone={move.tipo === "SAIDA" ? "danger" : "success"}
              />
            </View>
          ))
        )}
      </Card>
      <MovimentacaoModal
        initialType={launch?.type}
        item={launch?.item}
        onClose={() => setLaunch(null)}
        onSaved={setFeedback}
        visible={Boolean(launch)}
      />
    </Screen>
  );
}
const styles = StyleSheet.create({
  summary: { flexDirection: "row", gap: spacing.sm },
  summaryCard: { flex: 1 },
  summaryValue: { color: colors.warning, fontSize: 24, fontWeight: "900" },
  summaryLabel: { color: colors.muted, fontSize: 13, marginTop: 2 },
  filters: { flexDirection: "row", gap: spacing.xs },
  filter: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8
  },
  filterSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { color: colors.textSecondary, fontSize: 13, fontWeight: "800" },
  filterTextSelected: { color: colors.white },
  feedback: {
    backgroundColor: colors.successLight,
    borderRadius: radius.sm,
    color: colors.success,
    fontWeight: "700",
    padding: spacing.sm
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: "hidden",
    ...shadow.card
  },
  cardBody: { gap: spacing.sm, padding: spacing.md },
  cardHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
    justifyContent: "space-between"
  },
  title: { color: colors.text, flex: 1, fontSize: 17, fontWeight: "800" },
  values: { flexDirection: "row", justifyContent: "space-between" },
  valueEnd: { alignItems: "flex-end" },
  meta: { color: colors.muted, fontSize: 12 },
  quantity: { color: colors.primaryDark, fontSize: 18, fontWeight: "900", marginTop: 2 },
  stockValue: { color: colors.textSecondary, fontSize: 15, fontWeight: "800", marginTop: 4 },
  minimum: { color: colors.textSecondary, fontSize: 13 },
  actions: {
    borderTopColor: colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: "row"
  },
  entry: { alignItems: "center", flex: 1, justifyContent: "center", minHeight: 44 },
  exit: {
    alignItems: "center",
    borderLeftColor: colors.border,
    borderLeftWidth: StyleSheet.hairlineWidth,
    flex: 1,
    justifyContent: "center"
  },
  entryText: { color: colors.primary, fontSize: 13, fontWeight: "800" },
  exitText: { color: colors.danger, fontSize: 13, fontWeight: "800" },
  history: { paddingVertical: spacing.xs },
  move: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 55,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  moveBorder: { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth },
  moveText: { flex: 1 },
  moveName: { color: colors.text, fontWeight: "800" },
  moveDate: { color: colors.muted, fontSize: 12, marginTop: 2 },
  muted: { color: colors.muted, padding: spacing.xs }
});
