/**
 * Título: Tela de estoque
 * Explicação: Tela da aba Estoque.
 */
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
/**
 * Título: Tela de estoque (componente EstoqueScreen)
 * Explicação: Resumo com quantos produtos estão baixos e quantos zerados. Filtro Todos / Baixo /
 *   Zerado. Cada cartão mostra saldo, valor em estoque e mínimo, com os botões "Registrar entrada" e
 *   "Registrar saída", que abrem o formulário de movimentação. Usado por RootNavigator.
 */
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
      {/*
        Título: Contadores de estoque baixo e sem estoque
        Explicação: Contados no próprio aparelho a partir da lista de GET /api/estoque (situação BAIXO e
          ZERADO).
      */}
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
        {/*
          Título: Filtros de situação
          Explicação: Cada botão chama setFilter(valor) e a lista é filtrada no próprio aparelho; não chama o
            backend.
        */}
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
      {/*
        Título: Mensagem do último lançamento
        Explicação: Mostra o texto devolvido pelo MovimentacaoModal depois de salvar, com o novo saldo.
      */}
      {feedback ? (
        <Text accessibilityRole="alert" style={styles.feedback}>
          {feedback}
        </Text>
      ) : null}
      {/*
        Título: Carregando / erro do estoque
        Explicação: Mostra o carregamento ou o erro de GET /api/estoque. O botão Tentar novamente chama
          query.refetch(), que repete a chamada.
      */}
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
        // Título: Aviso de lista vazia
        // Explicação: Aparece quando nenhum produto está na situação escolhida.
        <EmptyState message="Não há itens nesta situação." title="Estoque sem resultados" />
      ) : null}
      {/*
        Título: Cartões de estoque
        Explicação: Um cartão por produto com saldo, valor em estoque e mínimo, vindos de useEstoqueQuery()
          → getEstoque() → GET /api/estoque (EstoqueController.listar).
      */}
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
            {/*
              Título: Botão Registrar entrada
              Explicação: Chama setLaunch({ item, type: "ENTRADA" }), que abre o MovimentacaoModal já em Entrada.
                Confirmar faz useMovimentacaoMutation() → createMovimentacao() → POST /api/movimentacoes
                (MovimentacaoController.registrar), que soma a quantidade ao saldo.
            */}
            <Pressable
              accessibilityRole="button"
              onPress={() => setLaunch({ item, type: "ENTRADA" })}
              style={styles.entry}
            >
              <Text style={styles.entryText}>Registrar entrada</Text>
            </Pressable>
            {/*
              Título: Botão Registrar saída
              Explicação: Chama setLaunch({ item, type: "SAIDA" }), que abre o MovimentacaoModal já em Saída.
                Confirmar faz POST /api/movimentacoes, que subtrai do saldo e recusa quantidade maior que o saldo
                (erro 422).
            */}
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
      {/*
        Título: Histórico recente
        Explicação: Últimas 8 movimentações de useMovimentacoesQuery(undefined, 8) → getMovimentacoes() →
          GET /api/movimentacoes (MovimentacaoController.listar) com ?limite=8.
      */}
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
      {/*
        Título: Formulário de entrada e saída
        Explicação: Visível quando launch tem um produto. Fechar chama setLaunch(null); ao salvar,
          onSaved=setFeedback mostra a mensagem com o novo saldo.
      */}
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
