/**
 * Título: Tela de fornecedores
 * Explicação: Tela de fornecedores, aberta pela aba Mais.
 */
import { useRef, useState } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { getApiErrorMessage } from "../api/errors";
import type { Fornecedor } from "../api/types";
import { EmptyState } from "../components/EmptyState";
import { AppText as Text } from "../components/AppText";
import { BackHeader } from "../components/BackHeader";
import { FornecedorFormModal } from "../components/FornecedorFormModal";
import { FeedbackBanner, type FeedbackTone } from "../components/FeedbackBanner";
import { Screen } from "../components/Screen";
import { ConfirmationDialog } from "../components/ui";
import { StateView } from "../components/StateView";
import { useFornecedorMutations, useFornecedoresQuery } from "../hooks/useIntellistockQueries";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import type { MaisStackParamList } from "../navigation/types";
import { colors } from "../theme/colors";
import { radius, shadow, spacing } from "../theme/tokens";
import { typography } from "../theme/typography";

type Feedback = { message: string; tone: FeedbackTone };

/**
 * Título: Tela de fornecedores (componente FornecedoresScreen)
 * Explicação: Busca com atraso de 300 ms; o filtro é feito pelo backend. Lista os fornecedores com
 *   contato; tocar abre a edição. Botão + cadastra; lixeira pede confirmação e exclui (remove),
 *   mostrando a mensagem do backend se o fornecedor tiver vínculos. Usado por RootNavigator.
 */
export function FornecedoresScreen({ navigation }: NativeStackScreenProps<MaisStackParamList, "Fornecedores">) {
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Fornecedor | null | undefined>(undefined);
  const [removing, setRemoving] = useState<Fornecedor | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const submitting = useRef(false);
  const debouncedSearch = useDebouncedValue(search.trim());
  const query = useFornecedoresQuery(debouncedSearch || undefined);
  const mutations = useFornecedorMutations();
  const suppliers = query.data ?? [];

  /**
   * Título: Exclui o fornecedor depois da confirmação
   * Explicação: Roda quando o usuário confirma. Chama useFornecedorMutations().remove →
   *   deleteFornecedor() → DELETE /api/fornecedores/{id} (FornecedorController.excluir). Se o fornecedor
   *   tiver produto ou conta ligados, o backend responde 409 e a faixa de erro aparece.
   */
  async function remove() {
    if (!removing || submitting.current) return;
    submitting.current = true;
    try {
      await mutations.remove.mutateAsync(removing.id);
      setFeedback({ message: "Fornecedor excluído com sucesso.", tone: "success" });
    } catch (error) {
      setFeedback({
        message: getApiErrorMessage(
          error,
          "Não foi possível excluir o fornecedor. Verifique vínculos com produtos ou contas."
        ),
        tone: "error"
      });
    } finally {
      submitting.current = false;
      setRemoving(null);
    }
  }

  return (
    <Screen refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {/*
        Título: Cabeçalho com voltar
        Explicação: A seta chama navigation.goBack() e volta para o menu Mais.
      */}
      <BackHeader onBack={() => navigation.goBack()} subtitle="Cadastre e mantenha parceiros" title="Fornecedores" />
      <View style={styles.tools}>
        <View style={styles.search}>
          <Ionicons color={colors.muted} name="search-outline" size={19} />
          {/*
            Título: Campo de busca de fornecedores
            Explicação: Guarda o texto em search. Depois da pausa, useFornecedoresQuery(busca) chama
              getFornecedores() → GET /api/fornecedores (FornecedorController.listar) com ?busca=...; aqui a busca
              é feita no backend.
          */}
          <TextInput
            accessibilityLabel="Buscar fornecedores"
            onChangeText={setSearch}
            placeholder="Buscar fornecedor"
            placeholderTextColor={colors.muted}
            style={styles.searchInput}
            value={search}
          />
        </View>
        {/*
          Título: Botão + para cadastrar fornecedor
          Explicação: Chama setEditing(null), que abre o FornecedorFormModal vazio. Ao salvar:
            useFornecedorMutations().create → createFornecedor() → POST /api/fornecedores
            (FornecedorController.criar).
        */}
        <Pressable
          accessibilityLabel="Adicionar fornecedor"
          accessibilityRole="button"
          onPress={() => setEditing(null)}
          style={styles.add}
        >
          <Ionicons color={colors.white} name="add" size={23} />
        </Pressable>
      </View>
      {/*
        Título: Faixa de sucesso ou erro
        Explicação: Mostra a mensagem guardada em feedback depois de salvar, excluir ou quando algo falha.
      */}
      <FeedbackBanner message={feedback?.message} tone={feedback?.tone} />
      {/*
        Título: Carregando / erro da lista de fornecedores
        Explicação: Mostra o carregamento ou o erro de GET /api/fornecedores. O botão Tentar novamente chama
          query.refetch(), que repete a chamada.
      */}
      <StateView
        error={
          query.isError
            ? getApiErrorMessage(query.error, "Não foi possível carregar os fornecedores.")
            : null
        }
        loading={query.isLoading}
        onRetry={() => void query.refetch()}
      />
      {!query.isLoading && !query.isError && suppliers.length === 0 ? (
        // Título: Aviso de lista vazia
        // Explicação: Aparece quando não há fornecedores ou a busca não encontrou nada.
        <EmptyState
          message="Cadastre fornecedores para vinculá-los a produtos e contas."
          title="Nenhum fornecedor encontrado"
        />
      ) : null}
      {suppliers.map((supplier) => (
        <View key={supplier.id} style={styles.supplierCard}>
          {/*
            Título: Cartão do fornecedor (toque para editar)
            Explicação: Chama setEditing(supplier), que abre o FornecedorFormModal preenchido. Ao salvar:
              useFornecedorMutations().update → updateFornecedor() → PUT /api/fornecedores/{id}
              (FornecedorController.atualizar).
          */}
          <Pressable
            accessibilityHint="Abre a edição do fornecedor"
            accessibilityRole="button"
            onPress={() => setEditing(supplier)}
            style={styles.supplierBody}
          >
            <Text style={styles.supplierName}>{supplier.nome}</Text>
            <Text numberOfLines={1} style={styles.supplierInfo}>
              {supplier.email ?? supplier.telefone ?? supplier.cnpj ?? "Sem dados de contato"}
            </Text>
          </Pressable>
          {/*
            Título: Botão lixeira (excluir fornecedor)
            Explicação: Chama setRemoving(supplier), que só abre a janela de confirmação.
          */}
          <Pressable
            accessibilityLabel={`Excluir ${supplier.nome}`}
            accessibilityRole="button"
            onPress={() => setRemoving(supplier)}
            style={styles.remove}
          >
            <Ionicons color={colors.danger} name="trash-outline" size={19} />
          </Pressable>
        </View>
      ))}
      {/*
        Título: Formulário de cadastro e edição de fornecedor
        Explicação: Visível quando editing não é undefined (null = novo; um fornecedor = edição). Fechar
          chama setEditing(undefined).
      */}
      <FornecedorFormModal
        onClose={() => setEditing(undefined)}
        onSaved={(message) => setFeedback({ message, tone: "success" })}
        supplier={editing}
        visible={editing !== undefined}
      />
      {/*
        Título: Confirmação de excluir fornecedor
        Explicação: Excluir chama remove() → useFornecedorMutations().remove → deleteFornecedor() → DELETE
          /api/fornecedores/{id} (FornecedorController.excluir). O backend recusa com 409 se houver produto ou
          conta ligados ao fornecedor.
      */}
      <ConfirmationDialog
        confirmLabel="Excluir"
        loading={mutations.remove.isPending}
        message="O fornecedor só pode ser removido se não tiver produtos ou contas vinculados."
        onCancel={() => setRemoving(null)}
        onConfirm={() => void remove()}
        title={`Excluir ${removing?.nome ?? "fornecedor"}?`}
        visible={Boolean(removing)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  tools: { flexDirection: "row", gap: spacing.sm },
  search: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    gap: spacing.xs,
    minHeight: 48,
    paddingHorizontal: spacing.sm
  },
  searchInput: { color: colors.text, flex: 1, fontFamily: typography.body },
  add: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    justifyContent: "center",
    width: 48
  },
  supplierCard: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    flexDirection: "row",
    overflow: "hidden",
    ...shadow.card
  },
  supplierBody: { flex: 1, gap: 4, padding: spacing.md },
  supplierName: { color: colors.text, fontSize: 16, fontWeight: "800" },
  supplierInfo: { color: colors.muted, fontSize: 13 },
  remove: {
    alignItems: "center",
    alignSelf: "stretch",
    borderLeftColor: colors.border,
    borderLeftWidth: StyleSheet.hairlineWidth,
    justifyContent: "center",
    width: 50
  },
});
