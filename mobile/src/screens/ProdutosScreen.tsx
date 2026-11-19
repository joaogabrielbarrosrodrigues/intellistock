/**
 * Título: Tela de produtos
 * Explicação: Tela da aba Produtos.
 */
import Ionicons from "@expo/vector-icons/Ionicons";
import { useMemo, useRef, useState } from "react";
import { FlatList, Pressable, StyleSheet, TextInput, View } from "react-native";
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
import { formatCurrency, formatQuantity, matchesSearch } from "../utils";

type Feedback = { message: string; tone: FeedbackTone };

/**
 * Título: Tela de produtos (componente ProdutosScreen)
 * Explicação: Busca todos os produtos uma vez e filtra no próprio aparelho conforme o texto digitado,
 *   ignorando acentos. Lista em FlatList, que só desenha os itens visíveis. Cada cartão mostra nome,
 *   situação, fornecedor, saldo e preço; tocar abre a edição. Usado por RootNavigator.
 */
export function ProdutosScreen() {
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Produto | null | undefined>(undefined);
  const [archiving, setArchiving] = useState<Produto | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const submitting = useRef(false);
  const debouncedSearch = useDebouncedValue(search.trim());
  const query = useProdutosQuery();
  const suppliers = useFornecedoresQuery();
  const mutations = useProdutoMutations();
  const products = useMemo(
    () => (query.data ?? []).filter((product) => matchesSearch(product.nome, debouncedSearch)),
    [query.data, debouncedSearch]
  );

  /**
   * Título: Desativa o produto escolhido depois da confirmação
   * Explicação: Roda quando o usuário confirma. Chama useProdutoMutations().archive → archiveProduto() →
   *   DELETE /api/produtos/{id} (ProdutoController.excluir), mostra a faixa de sucesso ou erro e fecha a
   *   confirmação. O submitting evita envio duplo.
   */
  async function archive() {
    if (!archiving || submitting.current) return;
    submitting.current = true;
    try {
      await mutations.archive.mutateAsync(archiving.id);
      setFeedback({ message: "Produto desativado. O histórico foi preservado.", tone: "success" });
    } catch (error) {
      setFeedback({ message: getApiErrorMessage(error, "Não foi possível desativar o produto."), tone: "error" });
    } finally {
      submitting.current = false;
      setArchiving(null);
    }
  }

  return (
    <Screen scroll={false}>
      {/*
        Título: Lista de produtos
        Explicação: Desenha só os cartões visíveis. Os dados vêm de useProdutosQuery() → getProdutos() → GET
          /api/produtos (ProdutoController.listar) e são filtrados no aparelho pelo texto da busca. Puxar a
          lista para baixo chama query.refetch().
      */}
      <FlatList
        data={products}
        keyExtractor={(product) => product.id}
        keyboardShouldPersistTaps="handled"
        refreshing={query.isRefetching}
        onRefresh={() => void query.refetch()}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <Header subtitle={`${products.length} item(ns) ativo(s)`} title="Produtos" />
            <View style={styles.toolbar}>
              <View style={styles.search}>
                <Ionicons color={colors.muted} name="search-outline" size={20} />
                {/*
                  Título: Campo de busca de produtos
                  Explicação: Guarda o texto em search. Depois de uma pausa (useDebouncedValue), a lista é filtrada no
                    próprio aparelho por matchesSearch(); não chama o backend de novo.
                */}
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
              {/*
                Título: Botão + para cadastrar produto
                Explicação: Chama setEditing(null), que abre o ProductFormModal vazio. Ao salvar, o formulário chama
                  useProdutoMutations().create → createProduto() → POST /api/produtos (ProdutoController.criar).
              */}
              <Pressable accessibilityLabel="Adicionar produto" accessibilityRole="button" onPress={() => setEditing(null)} style={styles.add}>
                <Ionicons color={colors.white} name="add" size={24} />
              </Pressable>
            </View>

            {/*
              Título: Faixa de sucesso ou erro
              Explicação: Mostra a mensagem guardada em feedback depois de salvar, excluir ou quando algo falha.
            */}
            <FeedbackBanner message={feedback?.message} tone={feedback?.tone} />
            {/*
              Título: Carregando / erro da lista de produtos
              Explicação: Mostra o carregamento ou o erro de GET /api/produtos. O botão Tentar novamente chama
                query.refetch(), que repete a chamada.
            */}
            <StateView
              error={query.isError ? getApiErrorMessage(query.error, "Não foi possível carregar os produtos.") : null}
              loading={query.isLoading}
              onRetry={() => void query.refetch()}
            />

          </View>
        }
        ListEmptyComponent={!query.isLoading && !query.isError ? (
          // Título: Aviso de lista vazia
          // Explicação: Aparece quando não há produtos ou quando a busca não encontrou nada.
          <EmptyState
            message={search ? "Tente outra busca ou cadastre um produto." : "Cadastre seu primeiro produto para começar."}
            title={search ? "Nenhum produto encontrado" : "Seu catálogo está vazio"}
          />
        ) : undefined}

        renderItem={({ item: product }) => (
          <View key={product.id} style={styles.card}>
            {/*
              Título: Cartão do produto (toque para editar)
              Explicação: Chama setEditing(product), que abre o ProductFormModal preenchido. Ao salvar:
                useProdutoMutations().update → updateProduto() → PUT /api/produtos/{id}
                (ProdutoController.atualizar).
            */}
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
            {/*
              Título: Botão Desativar produto
              Explicação: Chama setArchiving(product), que só abre a janela de confirmação. Quem desativa de fato
                é archive(), chamada pelo botão Desativar da confirmação.
            */}
            <Pressable accessibilityLabel={`Desativar ${product.nome}`} accessibilityRole="button" onPress={() => setArchiving(product)} style={styles.archive}>
              <Text style={styles.archiveText}>Desativar</Text>
            </Pressable>
          </View>
        )}
      />

      {/*
        Título: Formulário de cadastro e edição de produto
        Explicação: Fica visível quando editing não é undefined (null = novo produto; um produto = edição).
          Recebe os fornecedores de useFornecedoresQuery() → getFornecedores() → GET /api/fornecedores
          (FornecedorController.listar) para a escolha do fornecedor.
      */}
      <ProductFormModal
        onClose={() => setEditing(undefined)}
        onSaved={(message) => setFeedback({ message, tone: "success" })}
        product={editing}
        suppliers={suppliers.data ?? []}
        suppliersError={suppliers.isError ? getApiErrorMessage(suppliers.error, "Não foi possível carregar os fornecedores.") : null}
        suppliersLoading={suppliers.isLoading}
        onRetrySuppliers={() => void suppliers.refetch()}
        visible={editing !== undefined}
      />
      {/*
        Título: Confirmação de desativar produto
        Explicação: O botão Desativar chama archive() → useProdutoMutations().archive → archiveProduto() →
          DELETE /api/produtos/{id} (ProdutoController.excluir). O produto não é apagado do banco: só fica com
          ativo = false. Cancelar chama setArchiving(null) e fecha a janela.
      */}
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
  list: { gap: spacing.md, paddingBottom: spacing.md },
  listHeader: { gap: spacing.md },
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
