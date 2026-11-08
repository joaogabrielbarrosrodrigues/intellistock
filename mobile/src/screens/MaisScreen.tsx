import { useState } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { getApiErrorMessage } from "../api/errors";
import type { Fornecedor } from "../api/types";
import { EmptyState } from "../components/EmptyState";
import { AppText as Text } from "../components/AppText";
import { FeedbackBanner, type FeedbackTone } from "../components/FeedbackBanner";
import { FornecedorFormModal } from "../components/FornecedorFormModal";
import { Header } from "../components/Header";
import { ReposicaoCard } from "../components/ReposicaoCard";
import { Screen } from "../components/Screen";
import { Card, ConfirmationDialog, SectionTitle, StatusBadge } from "../components/ui";
import { StateView } from "../components/StateView";
import { useConsumoQuery, useFornecedorMutations, useFornecedoresQuery, useReposicoesQuery } from "../hooks/useIntellistockQueries";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { colors } from "../theme/colors";
import { radius, shadow, spacing } from "../theme/tokens";
import { typography } from "../theme/typography";
import { formatQuantity } from "../utils";

type Section = "menu" | "fornecedores" | "analises";
export function MaisScreen() {
  const [section, setSection] = useState<Section>("menu");
  if (section === "fornecedores") return <FornecedoresView onBack={() => setSection("menu")} />;
  if (section === "analises") return <AnalisesView onBack={() => setSection("menu")} />;
  return <Screen><Header subtitle="Fornecedores e planejamento" title="Mais" /><MenuCard icon="people-outline" onPress={() => setSection("fornecedores")} subtitle="Cadastre e mantenha parceiros atualizados" title="Fornecedores" /><MenuCard icon="analytics-outline" onPress={() => setSection("analises")} subtitle="Acompanhe o consumo e planeje compras" title="Análise e reposição" /><Card style={styles.note}><Text style={styles.noteTitle}>Como usar as sugestões</Text><Text style={styles.noteText}>Confira o consumo registrado, o estoque atual e o prazo de entrega antes de comprar.</Text></Card></Screen>;
}

function BackHeader({ title, subtitle, onBack }: { title: string; subtitle: string; onBack: () => void }) { return <View style={styles.backHeader}><Pressable accessibilityLabel="Voltar" accessibilityRole="button" onPress={onBack} style={styles.back}><Ionicons color={colors.primaryDark} name="arrow-back" size={21} /></Pressable><View style={styles.backText}><Text style={styles.backTitle}>{title}</Text><Text style={styles.backSubtitle}>{subtitle}</Text></View></View>; }
function MenuCard({ icon, title, subtitle, onPress }: { icon: "people-outline" | "analytics-outline"; title: string; subtitle: string; onPress: () => void }) { return <Pressable accessibilityRole="button" onPress={onPress} style={styles.menuCard}><View style={styles.menuIcon}><Ionicons color={colors.primary} name={icon} size={24} /></View><View style={styles.menuText}><Text style={styles.menuTitle}>{title}</Text><Text style={styles.menuSubtitle}>{subtitle}</Text></View><Ionicons color={colors.muted} name="chevron-forward" size={20} /></Pressable>; }

function FornecedoresView({ onBack }: { onBack: () => void }) {
  const [search, setSearch] = useState(""); const [editing, setEditing] = useState<Fornecedor | null | undefined>(undefined); const [removing, setRemoving] = useState<Fornecedor | null>(null); const [feedback, setFeedback] = useState<{ message: string; tone: FeedbackTone } | null>(null); const debouncedSearch = useDebouncedValue(search.trim()); const query = useFornecedoresQuery(debouncedSearch || undefined); const mutations = useFornecedorMutations(); const suppliers = query.data ?? [];
  async function remove() { if (!removing) return; try { await mutations.remove.mutateAsync(removing.id); setRemoving(null); setFeedback({ message: "Fornecedor excluído com sucesso.", tone: "success" }); } catch (error) { setRemoving(null); setFeedback({ message: getApiErrorMessage(error, "Não foi possível excluir o fornecedor. Verifique vínculos com produtos ou contas."), tone: "error" }); } }
  return <Screen refreshing={query.isRefetching} onRefresh={() => void query.refetch()}><BackHeader onBack={onBack} subtitle="Cadastre e mantenha parceiros" title="Fornecedores" /><View style={styles.tools}><View style={styles.search}><Ionicons color={colors.muted} name="search-outline" size={19} /><TextInput accessibilityLabel="Buscar fornecedores" onChangeText={setSearch} placeholder="Buscar fornecedor" placeholderTextColor={colors.muted} style={styles.searchInput} value={search} /></View><Pressable accessibilityLabel="Adicionar fornecedor" accessibilityRole="button" onPress={() => setEditing(null)} style={styles.add}><Ionicons color={colors.white} name="add" size={23} /></Pressable></View><FeedbackBanner message={feedback?.message} tone={feedback?.tone} /><StateView error={query.isError ? getApiErrorMessage(query.error, "Não foi possível carregar os fornecedores.") : null} loading={query.isLoading} onRetry={() => void query.refetch()} />{!query.isLoading && !query.isError && suppliers.length === 0 ? <EmptyState message="Cadastre fornecedores para vinculá-los a produtos e contas." title="Nenhum fornecedor encontrado" /> : null}{suppliers.map((supplier) => <View key={supplier.id} style={styles.supplierCard}><Pressable accessibilityHint="Abre a edição do fornecedor" accessibilityRole="button" onPress={() => setEditing(supplier)} style={styles.supplierBody}><Text style={styles.supplierName}>{supplier.nome}</Text><Text numberOfLines={1} style={styles.supplierInfo}>{supplier.email ?? supplier.telefone ?? supplier.cnpj ?? "Sem dados de contato"}</Text></Pressable><Pressable accessibilityLabel={`Excluir ${supplier.nome}`} accessibilityRole="button" onPress={() => setRemoving(supplier)} style={styles.remove}><Ionicons color={colors.danger} name="trash-outline" size={19} /></Pressable></View>)}<FornecedorFormModal onClose={() => setEditing(undefined)} onSaved={(message) => setFeedback({ message, tone: "success" })}supplier={editing} visible={editing !== undefined} /><ConfirmationDialog confirmLabel="Excluir" loading={mutations.remove.isPending} message="O fornecedor só pode ser removido se não tiver produtos ou contas vinculados." onCancel={() => setRemoving(null)} onConfirm={() => void remove()} title={`Excluir ${removing?.nome ?? "fornecedor"}?`} visible={Boolean(removing)} /></Screen>;
}

function AnalisesView({ onBack }: { onBack: () => void }) {
  const consumo = useConsumoQuery();
  const reposicoes = useReposicoesQuery();
  const loading = consumo.isLoading || reposicoes.isLoading;
  const error = consumo.isError
    ? getApiErrorMessage(consumo.error, "Não foi possível carregar a análise de consumo.")
    : reposicoes.isError
      ? getApiErrorMessage(reposicoes.error, "Não foi possível carregar as sugestões de reposição.")
      : null;
  const consumed = (consumo.data ?? []).filter((item) => item.totalConsumido > 0);
  const retry = () => { void consumo.refetch(); void reposicoes.refetch(); };

  return (
    <Screen refreshing={consumo.isRefetching || reposicoes.isRefetching} onRefresh={retry}>
      <BackHeader onBack={onBack} subtitle="Baseado no histórico real" title="Análise e reposição" />
      <StateView error={error} loading={loading} onRetry={retry} />
      {!loading && !error ? (
        <>
          <SectionTitle title="Sugestões de reposição" />
          {(reposicoes.data ?? []).length === 0
            ? <EmptyState message="Nenhum produto precisa de reposição neste momento." title="Estoque sob controle" />
            : (reposicoes.data ?? []).map((item) => <ReposicaoCard key={item.produtoId} item={item} />)}
          <SectionTitle title="Consumo por produto" />
          {consumed.length === 0
            ? <EmptyState message="Registre saídas para calcular os indicadores de consumo." title="Ainda sem histórico de consumo" />
            : consumed.slice(0, 20).map((item) => (
              <Card key={item.produtoId} style={styles.analysisCard}>
                <View style={styles.analysisHeader}>
                  <Text numberOfLines={1} style={styles.analysisTitle}>{item.produtoNome}</Text>
                  <StatusBadge label={item.tendencia} tone={item.tendencia === "ALTA" ? "warning" : item.tendencia === "BAIXA" ? "primary" : "neutral"} />
                </View>
                <Text style={styles.analysisMeta}>{formatQuantity(item.totalConsumido, item.unidadeMedida)} consumidos em {item.periodoDias} dias</Text>
                <Text style={styles.suggestion}>Média diária: {formatQuantity(item.mediaDiaria, item.unidadeMedida)}</Text>
              </Card>
            ))}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({ backHeader: { alignItems: "center", flexDirection: "row", gap: spacing.sm }, back: { alignItems: "center", backgroundColor: colors.surfaceMuted, borderRadius: radius.md, height: 44, justifyContent: "center", width: 44 }, backText: { flex: 1 }, backTitle: { color: colors.text, fontSize: 25, fontWeight: "800" }, backSubtitle: { color: colors.muted, fontSize: 13, marginTop: 2 }, menuCard: { alignItems: "center", backgroundColor: colors.surface, borderRadius: radius.lg, flexDirection: "row", gap: spacing.sm, padding: spacing.md, ...shadow.card }, menuIcon: { alignItems: "center", backgroundColor: colors.primaryLight, borderRadius: radius.md, height: 48, justifyContent: "center", width: 48 }, menuText: { flex: 1 }, menuTitle: { color: colors.text, fontSize: 16, fontWeight: "800" }, menuSubtitle: { color: colors.muted, fontSize: 13, lineHeight: 18, marginTop: 3 }, note: { backgroundColor: colors.primaryLight }, noteTitle: { color: colors.primaryDark, fontSize: 16, fontWeight: "800" }, noteText: { color: colors.textSecondary, lineHeight: 20, marginTop: 5 }, tools: { flexDirection: "row", gap: spacing.sm }, search: { alignItems: "center", backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, flex: 1, flexDirection: "row", gap: spacing.xs, minHeight: 48, paddingHorizontal: spacing.sm }, searchInput: { color: colors.text, flex: 1, fontFamily: typography.body }, add: { alignItems: "center", backgroundColor: colors.primary, borderRadius: radius.md, justifyContent: "center", width: 48 }, supplierCard: { alignItems: "center", backgroundColor: colors.surface, borderRadius: radius.lg, flexDirection: "row", overflow: "hidden", ...shadow.card }, supplierBody: { flex: 1, gap: 4, padding: spacing.md }, supplierName: { color: colors.text, fontSize: 16, fontWeight: "800" }, supplierInfo: { color: colors.muted, fontSize: 13 }, remove: { alignItems: "center", alignSelf: "stretch", borderLeftColor: colors.border, borderLeftWidth: StyleSheet.hairlineWidth, justifyContent: "center", width: 50 }, analysisCard: { gap: spacing.xs }, analysisHeader: { alignItems: "center", flexDirection: "row", gap: spacing.xs, justifyContent: "space-between" }, analysisTitle: { color: colors.text, flex: 1, fontSize: 16, fontWeight: "800" }, analysisMeta: { color: colors.muted, fontSize: 13 }, analysisBottom: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginTop: spacing.xs }, suggestion: { color: colors.primaryDark, fontWeight: "800" }, cost: { color: colors.textSecondary, fontWeight: "800" } });
