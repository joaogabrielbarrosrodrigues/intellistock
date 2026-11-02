import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { getApiErrorMessage } from "../api/errors";
import type { Produto } from "../api/types";
import { EmptyState } from "../components/EmptyState";
import { AppText as Text } from "../components/AppText";
import { FeedbackBanner, type FeedbackTone } from "../components/FeedbackBanner";
import { Header } from "../components/Header";
import { ProductFormModal } from "../components/ProductFormModal";
import { Screen } from "../components/Screen";
import { StateView } from "../components/StateView";
import { ConfirmationDialog, StatusBadge } from "../components/ui";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { useFornecedoresQuery, useProdutoMutations, useProdutosQuery } from "../hooks/useIntellistockQueries";
import { colors } from "../theme/colors";
import { radius, shadow, spacing } from "../theme/tokens";
import { typography } from "../theme/typography";
import { formatCurrency, formatQuantity } from "../utils";

type Feedback = { message: string; tone: FeedbackTone };

export function ProdutosScreen() {
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Produto | null | undefined>(undefined);
  const [archiving, setArchiving] = useState<Produto | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const debouncedSearch = useDebouncedValue(search.trim());
  const query = useProdutosQuery(debouncedSearch || undefined);
  const suppliers = useFornecedoresQuery();
  const mutations = useProdutoMutations();
  const products = query.data ?? [];

  async function archive() {
    if (!archiving) return;
    try {
      await mutations.archive.mutateAsync(archiving.id);
      setFeedback({ message: "Produto desativado. O histórico foi preservado.", tone: "success" });
    } catch (error) {
      setFeedback({ message: getApiErrorMessage(error, "Não foi possível desativar o produto."), tone: "error" });
    } finally {
      setArchiving(null);
    }
  }

  return (
    <Screen refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      <Header subtitle={`${products.length} item(ns) ativo(s)`} title="Produtos" />
      <View style={styles.toolbar}>
        <View style={styles.search}>
          <Ionicons color={colors.muted} name="search-outline" size={20} />
          <TextInput
            accessibilityLabel="Buscar produtos"
            autoCapitalize="none"
            onChangeText={setSearch}
            placeholder="Buscar por nome"
            placeholderTextColor={colors.muted}
            style={styles.searchInput}
            value={search}
          />
        </View>
        <Pressable accessibilityLabel="Adicionar produto" accessibilityRole="button" onPress={() => setEditing(null)} style={styles.add}>
          <Ionicons color={colors.white} name="add" size={24} />
        </Pressable>
      </View>

      <FeedbackBanner message={feedback?.message} tone={feedback?.tone} />
      <StateView
        error={query.isError ? getApiErrorMessage(query.error, "Não foi possível carregar os produtos.") : null}
        loading={query.isLoading}
        onRetry={() => void query.refetch()}
      />

      {!query.isLoading && !query.isError && products.length === 0 ? (
        <EmptyState
          message={search ? "Tente outra busca ou cadastre um produto." : "Cadastre seu primeiro produto para começar."}
          title={search ? "Nenhum produto encontrado" : "Seu catálogo está vazio"}
        />
      ) : null}

      {products.map((product) => (
        <View key={product.id} style={styles.card}>
          <Pressable accessibilityHint="Abre a edição do produto" accessibilityRole="button" onPress={() => setEditing(product)} style={styles.cardPress}>
            <View style={styles.cardHeader}>
              <Text numberOfLines={1} style={styles.title}>{product.nome}</Text>
              <StatusBadge label={product.estoqueBaixo ? "Estoque baixo" : "Em dia"} tone={product.estoqueBaixo ? "warning" : "success"} />
            </View>
            <Text numberOfLines={1} style={styles.subtitle}>{product.fornecedor?.nome ?? product.descricao ?? "Sem fornecedor informado"}</Text>
            <View style={styles.metaRow}>
              <View>
                <Text style={styles.metaLabel}>Disponível</Text>
                <Text style={styles.quantity}>{formatQuantity(product.quantidade, product.unidadeMedida)}</Text>
              </View>
              <View style={styles.priceBlock}>
                <Text style={styles.metaLabel}>Preço unitário</Text>
                <Text style={styles.price}>{formatCurrency(product.preco)}</Text>
              </View>
            </View>
          </Pressable>
          <Pressable accessibilityLabel={`Desativar ${product.nome}`} accessibilityRole="button" onPress={() => setArchiving(product)} style={styles.archive}>
            <Text style={styles.archiveText}>Desativar</Text>
          </Pressable>
        </View>
      ))}

      <ProductFormModal
        onClose={() => setEditing(undefined)}
        onSaved={(message) => setFeedback({ message, tone: "success" })}
        product={editing}
        suppliers={suppliers.data ?? []}
        visible={editing !== undefined}
      />
      <ConfirmationDialog
        confirmLabel="Desativar"
        loading={mutations.archive.isPending}
        message="O produto deixará de aparecer nas listas e não aceitará novas movimentações. Seu histórico será preservado."
        onCancel={() => setArchiving(null)}
        onConfirm={() => void archive()}
        title={`Desativar ${archiving?.nome ?? "produto"}?`}
        visible={Boolean(archiving)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  toolbar: { flexDirection: "row", gap: spacing.sm },
  search: { alignItems: "center", backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, flex: 1, flexDirection: "row", gap: spacing.xs, minHeight: 48, paddingHorizontal: spacing.sm },
  searchInput: { color: colors.text, flex: 1, fontFamily: typography.body, fontSize: 16 },
  add: { alignItems: "center", backgroundColor: colors.primary, borderRadius: radius.md, justifyContent: "center", width: 48 },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, overflow: "hidden", ...shadow.card },
  cardPress: { gap: spacing.xs, padding: spacing.md },
  cardHeader: { alignItems: "center", flexDirection: "row", gap: spacing.xs, justifyContent: "space-between" },
  title: { color: colors.text, flex: 1, fontSize: 17, fontWeight: "800" },
  subtitle: { color: colors.muted },
  metaRow: { flexDirection: "row", justifyContent: "space-between", marginTop: spacing.xs },
  metaLabel: { color: colors.muted, fontSize: 12 },
  quantity: { color: colors.primaryDark, fontSize: 16, fontWeight: "800", marginTop: 2 },
  priceBlock: { alignItems: "flex-end" },
  price: { color: colors.textSecondary, fontSize: 15, fontWeight: "800", marginTop: 2 },
  archive: { alignItems: "center", borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth, justifyContent: "center", minHeight: 44 },
  archiveText: { color: colors.danger, fontSize: 13, fontWeight: "800" }
});
