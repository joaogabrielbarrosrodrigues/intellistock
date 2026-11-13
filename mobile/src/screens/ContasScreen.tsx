import Ionicons from "@expo/vector-icons/Ionicons";
import { useRef, useState } from "react";
import { Linking, Pressable, StyleSheet, View } from "react-native";
import { getApiErrorMessage } from "../api/errors";
import type { ContaPagar, StatusConta } from "../api/types";
import { getContas } from "../api/intellistock";
import { ContaFormModal } from "../components/ContaFormModal";
import { AppText as Text } from "../components/AppText";
import { EmptyState } from "../components/EmptyState";
import { FeedbackBanner, type FeedbackTone } from "../components/FeedbackBanner";
import { Header } from "../components/Header";
import { Screen } from "../components/Screen";
import { StateView } from "../components/StateView";
import { Card, ConfirmationDialog, StatusBadge } from "../components/ui";
import { useContaMutations, useContasQuery, useFornecedoresQuery } from "../hooks/useIntellistockQueries";
import { useDueReminderStatus } from "../notifications/DueReminderProvider";
import { sendTestDueReminder } from "../notifications/dueReminderScheduler";
import { colors } from "../theme/colors";
import { radius, shadow, spacing } from "../theme/tokens";
import { formatCurrency, formatDate } from "../utils";

type Filter = "TODAS" | StatusConta;
type Action = "pay" | "cancel" | "reopen" | "remove";
type PendingAction = { type: Action; conta: ContaPagar };
type Feedback = { message: string; tone: FeedbackTone };

const filters: Filter[] = ["TODAS", "PENDENTE", "VENCIDA", "PAGA", "CANCELADA"];

export function ContasScreen() {
  const [filter, setFilter] = useState<Filter>("TODAS");
  const [editing, setEditing] = useState<ContaPagar | null | undefined>(undefined);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const submitting = useRef(false);
  const testingReminder = useRef(false);
  const [testing, setTesting] = useState(false);
  const query = useContasQuery(filter === "TODAS" ? undefined : filter);
  const suppliers = useFornecedoresQuery();
  const mutations = useContaMutations();
  const reminderStatus = useDueReminderStatus();
  const contas = query.data ?? [];

  async function testReminder() {
    if (testingReminder.current) return;
    testingReminder.current = true;
    setTesting(true);
    try {
      const allAccounts = await getContas();
      await sendTestDueReminder(allAccounts);
      setFeedback({ message: "Aviso de teste programado para aparecer em alguns segundos.", tone: "success" });
    } catch (error) {
      setFeedback({ message: getApiErrorMessage(error, "Não foi possível enviar o aviso de teste neste aparelho."), tone: "error" });
    } finally {
      testingReminder.current = false;
      setTesting(false);
    }
  }

  async function confirmAction() {
    if (!pendingAction || submitting.current) return;
    submitting.current = true;
    const { type, conta } = pendingAction;

    try {
      if (type === "pay") await mutations.pay.mutateAsync(conta.id);
      if (type === "cancel") await mutations.cancel.mutateAsync(conta.id);
      if (type === "reopen") await mutations.reopen.mutateAsync(conta.id);
      if (type === "remove") await mutations.remove.mutateAsync(conta.id);
      setFeedback({ message: successMessage(type), tone: "success" });
    } catch (error) {
      setFeedback({ message: getApiErrorMessage(error, fallbackMessage(type)), tone: "error" });
    } finally {
      submitting.current = false;
      setPendingAction(null);
    }
  }

  const dialog = pendingAction ? actionDialog(pendingAction) : null;

  return (
    <Screen refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      <Header subtitle="Compromissos e vencimentos" title="Contas a pagar" />
      <View style={styles.filters}>
        {filters.map((value) => (
          <Pressable key={value} accessibilityRole="button" onPress={() => setFilter(value)} style={[styles.filter, filter === value && styles.filterSelected]}>
            <Text style={[styles.filterText, filter === value && styles.filterTextSelected]}>{filterLabel(value)}</Text>
          </Pressable>
        ))}
      </View>
      <Pressable accessibilityLabel="Cadastrar conta" accessibilityRole="button" onPress={() => setEditing(null)} style={styles.newButton}>
        <Ionicons color={colors.white} name="add" size={21} />
        <Text style={styles.newText}>Nova conta</Text>
      </Pressable>

      {reminderStatus === "enabled" ? (
        <Card style={styles.reminderCard}><Text style={styles.reminderText}>Avisos ativados: 7 dias antes, 3 dias antes e no dia do vencimento, às 9h.</Text><Pressable accessibilityRole="button" accessibilityState={{ disabled: testing }} disabled={testing} onPress={() => void testReminder()}><Text style={styles.reminderAction}>{testing ? "Preparando aviso..." : "Testar avisos"}</Text></Pressable></Card>
      ) : reminderStatus === "disabled" ? (
        <Card style={styles.reminderCard}><Text style={styles.reminderText}>Ative as notificações do app para receber lembretes de vencimento.</Text><Pressable accessibilityRole="button" onPress={() => void Linking.openSettings()}><Text style={styles.reminderAction}>Abrir configurações</Text></Pressable></Card>
      ) : reminderStatus === "error" ? (
        <Card style={styles.reminderCard}><Text style={styles.reminderText}>Não foi possível programar os lembretes neste aparelho. Reinicie o app e confira as permissões.</Text></Card>
      ) : null}

      <FeedbackBanner message={feedback?.message} tone={feedback?.tone} />
      <StateView
        error={query.isError ? getApiErrorMessage(query.error, "Não foi possível carregar as contas.") : null}
        loading={query.isLoading}
        onRetry={() => void query.refetch()}
      />

      {!query.isLoading && !query.isError && contas.length === 0 ? (
        <EmptyState message="Cadastre uma conta ou selecione outro filtro." title="Nenhuma conta encontrada" />
      ) : null}

      {contas.map((conta) => <ContaCard key={conta.id} conta={conta} onAction={(type) => setPendingAction({ type, conta })} onEdit={() => setEditing(conta)} />)}

      <ContaFormModal
        conta={editing}
        onClose={() => setEditing(undefined)}
        onSaved={(message) => setFeedback({ message, tone: "success" })}
        suppliers={suppliers.data ?? []}
        suppliersError={suppliers.isError ? getApiErrorMessage(suppliers.error, "Não foi possível carregar os fornecedores.") : null}
        suppliersLoading={suppliers.isLoading}
        onRetrySuppliers={() => void suppliers.refetch()}
        visible={editing !== undefined}
      />
      <ConfirmationDialog
        confirmLabel={dialog?.confirmLabel}
        confirmVariant={pendingAction?.type === "remove" || pendingAction?.type === "cancel" ? "danger" : "primary"}
        loading={isActionPending(pendingAction?.type, mutations)}
        message={dialog?.message ?? ""}
        onCancel={() => setPendingAction(null)}
        onConfirm={() => void confirmAction()}
        title={dialog?.title ?? "Confirmar ação"}
        visible={Boolean(pendingAction)}
      />
    </Screen>
  );
}

function ContaCard({ conta, onEdit, onAction }: { conta: ContaPagar; onEdit: () => void; onAction: (action: Action) => void }) {
  const open = conta.status === "PENDENTE" || conta.status === "VENCIDA";
  return (
    <View style={styles.card}>
      <Pressable accessibilityHint={open ? "Abre a edição da conta" : undefined} accessibilityRole="button" disabled={!open} onPress={onEdit} style={styles.cardBody}>
        <View style={styles.cardHeader}>
          <Text numberOfLines={1} style={styles.title}>{conta.descricao}</Text>
          <StatusBadge label={conta.status} tone={statusTone(conta.status)} />
        </View>
        <Text numberOfLines={1} style={styles.supplier}>{conta.fornecedor?.nome ?? "Fornecedor não informado"}</Text>
        <View style={styles.data}>
          <View>
            <Text style={styles.amount}>{formatCurrency(conta.valor)}</Text>
            <Text style={styles.due}>{dueLabel(conta)}</Text>
          </View>
          {open ? <Text style={styles.edit}>Editar</Text> : null}
        </View>
      </Pressable>
      <View style={styles.actions}>
        {open ? (
          <>
            <ActionButton label="Pagar" onPress={() => onAction("pay")} tone="success" />
            <ActionButton label="Cancelar" onPress={() => onAction("cancel")} tone="neutral" />
          </>
        ) : (
          <ActionButton label="Reabrir" onPress={() => onAction("reopen")} tone="primary" />
        )}
        <Pressable accessibilityLabel={`Excluir ${conta.descricao}`} accessibilityRole="button" onPress={() => onAction("remove")} style={styles.delete}>
          <Ionicons color={colors.danger} name="trash-outline" size={19} />
        </Pressable>
      </View>
    </View>
  );
}

function ActionButton({ label, onPress, tone }: { label: string; onPress: () => void; tone: "success" | "primary" | "neutral" }) {
  const color = tone === "success" ? colors.success : tone === "primary" ? colors.primary : colors.textSecondary;
  return <Pressable accessibilityRole="button" onPress={onPress} style={styles.actionButton}><Text style={[styles.actionText, { color }]}>{label}</Text></Pressable>;
}

function statusTone(status: StatusConta): "success" | "warning" | "danger" | "neutral" {
  if (status === "PAGA") return "success";
  if (status === "VENCIDA") return "danger";
  if (status === "PENDENTE") return "warning";
  return "neutral";
}

function dueLabel(conta: ContaPagar) {
  if (conta.status === "PAGA") return conta.dataPagamento ? `Pago em ${formatDate(conta.dataPagamento)}` : "Pagamento registrado";
  if (conta.status === "CANCELADA") return "Cancelada";
  if ((conta.diasParaVencimento ?? 0) < 0) return `Venceu em ${formatDate(conta.dataVencimento)}`;
  if (conta.diasParaVencimento === 0) return "Vence hoje";
  return `Vence em ${formatDate(conta.dataVencimento)}`;
}

function filterLabel(filter: Filter) {
  if (filter === "TODAS") return "Todas";
  return filter[0] + filter.slice(1).toLowerCase();
}

function actionDialog(action: PendingAction) {
  const amount = formatCurrency(action.conta.valor);
  if (action.type === "pay") return { title: "Confirmar pagamento", message: `Registrar o pagamento de ${amount}?`, confirmLabel: "Registrar" };
  if (action.type === "cancel") return { title: "Cancelar conta?", message: "A conta sairá dos compromissos em aberto e poderá ser reaberta depois.", confirmLabel: "Cancelar conta" };
  if (action.type === "reopen") return { title: "Reabrir conta?", message: "A conta voltará para os compromissos em aberto.", confirmLabel: "Reabrir" };
  return { title: "Excluir conta?", message: "Esta exclusão é definitiva. Verifique se o registro não é mais necessário.", confirmLabel: "Excluir" };
}

function successMessage(action: Action) {
  if (action === "pay") return "Pagamento registrado com sucesso.";
  if (action === "cancel") return "Conta cancelada com sucesso.";
  if (action === "reopen") return "Conta reaberta com sucesso.";
  return "Conta excluída com sucesso.";
}

function fallbackMessage(action: Action) {
  if (action === "pay") return "Não foi possível registrar o pagamento.";
  if (action === "cancel") return "Não foi possível cancelar a conta.";
  if (action === "reopen") return "Não foi possível reabrir a conta.";
  return "Não foi possível excluir a conta.";
}

function isActionPending(action: Action | undefined, mutations: ReturnType<typeof useContaMutations>) {
  if (action === "pay") return mutations.pay.isPending;
  if (action === "cancel") return mutations.cancel.isPending;
  if (action === "reopen") return mutations.reopen.isPending;
  if (action === "remove") return mutations.remove.isPending;
  return false;
}

const styles = StyleSheet.create({
  reminderCard: { gap: spacing.xs },
  reminderText: { color: colors.textSecondary, fontSize: 13, lineHeight: 19 },
  reminderAction: { color: colors.primary, fontSize: 13, fontWeight: "800", paddingVertical: spacing.xs },
  filters: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  filter: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.pill, borderWidth: 1, paddingHorizontal: spacing.sm, paddingVertical: 8 },
  filterSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { color: colors.textSecondary, fontSize: 13, fontWeight: "800" },
  filterTextSelected: { color: colors.white },
  newButton: { alignItems: "center", backgroundColor: colors.primary, borderRadius: radius.md, flexDirection: "row", gap: 6, justifyContent: "center", minHeight: 48 },
  newText: { color: colors.white, fontSize: 15, fontWeight: "800" },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, overflow: "hidden", ...shadow.card },
  cardBody: { gap: spacing.xs, padding: spacing.md },
  cardHeader: { alignItems: "center", flexDirection: "row", gap: spacing.xs, justifyContent: "space-between" },
  title: { color: colors.text, flex: 1, fontSize: 17, fontWeight: "800" },
  supplier: { color: colors.muted },
  data: { alignItems: "flex-end", flexDirection: "row", justifyContent: "space-between", marginTop: spacing.xs },
  amount: { color: colors.primaryDark, fontSize: 18, fontWeight: "900" },
  due: { color: colors.textSecondary, fontSize: 13, marginTop: 3 },
  edit: { color: colors.primary, fontSize: 13, fontWeight: "800" },
  actions: { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: "row", minHeight: 44 },
  actionButton: { alignItems: "center", flex: 1, justifyContent: "center", paddingHorizontal: spacing.xs },
  actionText: { fontSize: 13, fontWeight: "800" },
  delete: { alignItems: "center", borderLeftColor: colors.border, borderLeftWidth: StyleSheet.hairlineWidth, justifyContent: "center", width: 52 }
});
