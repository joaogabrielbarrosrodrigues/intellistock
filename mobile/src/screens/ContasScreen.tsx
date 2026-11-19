/**
 * Título: Tela de contas a pagar
 * Explicação: Tela da aba Contas.
 */
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
import { getDueReminderGeneration, sendTestDueReminder } from "../notifications/dueReminderScheduler";
import { colors } from "../theme/colors";
import { radius, shadow, spacing } from "../theme/tokens";
import { formatCurrency, formatDate } from "../utils";

type Filter = "TODAS" | StatusConta;
type Action = "pay" | "cancel" | "reopen" | "remove";
type PendingAction = { type: Action; conta: ContaPagar };
type Feedback = { message: string; tone: FeedbackTone };

const filters: Filter[] = ["TODAS", "PENDENTE", "VENCIDA", "PAGA", "CANCELADA"];

/**
 * Título: Tela de contas a pagar (componente ContasScreen)
 * Explicação: Filtros Todas / Pendente / Vencida / Paga / Cancelada (o filtro é aplicado pelo
 *   backend). Botão "Nova conta" e edição ao tocar numa conta em aberto. ContaCard: valor, fornecedor,
 *   vencimento e os botões Pagar, Cancelar ou Reabrir, e Excluir. Usado por RootNavigator.
 */
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

  /**
   * Título: Busca todas as contas e agenda o aviso de teste
   * Explicação: Chama getContas() → GET /api/contas para pegar todas as contas e sendTestDueReminder()
   *   para agendar, no aparelho, um aviso em 5 segundos. Não grava nada no backend.
   */
  async function testReminder() {
    if (testingReminder.current) return;
    testingReminder.current = true;
    setTesting(true);
    const generation = getDueReminderGeneration();
    try {
      const allAccounts = await getContas();
      const scheduled = await sendTestDueReminder(allAccounts, generation);
      if (!scheduled) return;
      setFeedback({ message: "Aviso de teste programado para aparecer em alguns segundos.", tone: "success" });
    } catch (error) {
      setFeedback({ message: getApiErrorMessage(error, "Não foi possível enviar o aviso de teste neste aparelho."), tone: "error" });
    } finally {
      testingReminder.current = false;
      setTesting(false);
    }
  }

  /**
   * Título: Executa a ação confirmada (pagar, cancelar, reabrir ou excluir)
   * Explicação: Conforme a ação guardada em pendingAction chama: pay → payConta() → PATCH
   *   /api/contas/{id}/pagar (ContaPagarController.pagar); cancel → cancelConta() → PATCH
   *   /api/contas/{id}/cancelar (ContaPagarController.cancelar); reopen → reopenConta() → PATCH
   *   /api/contas/{id}/reabrir (ContaPagarController.reabrir); remove → deleteConta() → DELETE
   *   /api/contas/{id} (ContaPagarController.excluir). Depois mostra a faixa e fecha a confirmação.
   */
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
        {/*
          Título: Filtros por situação da conta
          Explicação: Cada botão chama setFilter(valor). Trocar o filtro muda a consulta
            useContasQuery(status), que chama getContas() → GET /api/contas (ContaPagarController.listar) com
            ?status=... (TODAS não envia filtro).
        */}
        {filters.map((value) => (
          <Pressable key={value} accessibilityRole="button" onPress={() => setFilter(value)} style={[styles.filter, filter === value && styles.filterSelected]}>
            <Text style={[styles.filterText, filter === value && styles.filterTextSelected]}>{filterLabel(value)}</Text>
          </Pressable>
        ))}
      </View>
      {/*
        Título: Botão Nova conta
        Explicação: Chama setEditing(null), que abre o ContaFormModal vazio. Ao salvar:
          useContaMutations().create → createConta() → POST /api/contas (ContaPagarController.criar).
      */}
      <Pressable accessibilityLabel="Cadastrar conta" accessibilityRole="button" onPress={() => setEditing(null)} style={styles.newButton}>
        <Ionicons color={colors.white} name="add" size={21} />
        <Text style={styles.newText}>Nova conta</Text>
      </Pressable>

      {reminderStatus === "enabled" ? (
        // Título: Aviso de lembretes ativos e botão Testar avisos
        // Explicação: O botão chama testReminder(), que busca todas as contas com getContas() → GET
        //   /api/contas e agenda no aparelho um aviso de teste (sendTestDueReminder). Nada é gravado no backend.
        <Card style={styles.reminderCard}><Text style={styles.reminderText}>Avisos ativados: 7 dias antes, 3 dias antes e no dia do vencimento, às 9h.</Text><Pressable accessibilityRole="button" accessibilityState={{ disabled: testing }} disabled={testing} onPress={() => void testReminder()}><Text style={styles.reminderAction}>{testing ? "Preparando aviso..." : "Testar avisos"}</Text></Pressable></Card>
      ) : reminderStatus === "disabled" ? (
        // Título: Aviso de notificações desligadas
        // Explicação: O botão Abrir configurações chama Linking.openSettings(), que abre as configurações do
        //   celular para liberar as notificações do app.
        <Card style={styles.reminderCard}><Text style={styles.reminderText}>Ative as notificações do app para receber lembretes de vencimento.</Text><Pressable accessibilityRole="button" onPress={() => void Linking.openSettings()}><Text style={styles.reminderAction}>Abrir configurações</Text></Pressable></Card>
      ) : reminderStatus === "error" ? (
        // Título: Aviso de falha nos lembretes
        // Explicação: Aparece quando o agendamento dos lembretes no aparelho falhou.
        <Card style={styles.reminderCard}><Text style={styles.reminderText}>Não foi possível programar os lembretes neste aparelho. Reinicie o app e confira as permissões.</Text></Card>
      ) : null}

      {/*
        Título: Faixa de sucesso ou erro
        Explicação: Mostra a mensagem guardada em feedback depois de salvar, excluir ou quando algo falha.
      */}
      <FeedbackBanner message={feedback?.message} tone={feedback?.tone} />
      {/*
        Título: Carregando / erro da lista de contas
        Explicação: Mostra o carregamento ou o erro de GET /api/contas. O botão Tentar novamente chama
          query.refetch(), que repete a chamada.
      */}
      <StateView
        error={query.isError ? getApiErrorMessage(query.error, "Não foi possível carregar as contas.") : null}
        loading={query.isLoading}
        onRetry={() => void query.refetch()}
      />

      {!query.isLoading && !query.isError && contas.length === 0 ? (
        // Título: Aviso de lista vazia
        // Explicação: Aparece quando não há contas na situação escolhida.
        <EmptyState message="Cadastre uma conta ou selecione outro filtro." title="Nenhuma conta encontrada" />
      ) : null}

      {/*
        Título: Lista de contas
        Explicação: Desenha um ContaCard por conta. Os botões do cartão chamam setPendingAction({ type,
          conta }), que abre a confirmação; tocar no cartão chama setEditing(conta), que abre a edição.
      */}
      {contas.map((conta) => <ContaCard key={conta.id} conta={conta} onAction={(type) => setPendingAction({ type, conta })} onEdit={() => setEditing(conta)} />)}

      {/*
        Título: Formulário de cadastro e edição de conta
        Explicação: Visível quando editing não é undefined (null = nova conta; uma conta = edição). Recebe
          os fornecedores de useFornecedoresQuery() → getFornecedores() → GET /api/fornecedores
          (FornecedorController.listar).
      */}
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
      {/*
        Título: Confirmação da ação escolhida no cartão
        Explicação: Confirmar chama confirmAction(), que conforme o tipo faz: Pagar → payConta() → PATCH
          /api/contas/{id}/pagar (ContaPagarController.pagar); Cancelar → cancelConta() → PATCH
          /api/contas/{id}/cancelar (ContaPagarController.cancelar); Reabrir → reopenConta() → PATCH
          /api/contas/{id}/reabrir (ContaPagarController.reabrir); Excluir → deleteConta() → DELETE
          /api/contas/{id} (ContaPagarController.excluir). Cancelar fecha a janela sem chamar o backend.
      */}
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

/**
 * Título: Cartão de uma conta com seus botões
 * Explicação: Usada só dentro deste arquivo, por ContasScreen.
 */
function ContaCard({ conta, onEdit, onAction }: { conta: ContaPagar; onEdit: () => void; onAction: (action: Action) => void }) {
  const open = conta.status === "PENDENTE" || conta.status === "VENCIDA";
  return (
    <View style={styles.card}>
      {/*
        Título: Corpo do cartão da conta (toque para editar)
        Explicação: Só responde em contas PENDENTE ou VENCIDA. Chama onEdit, que abre o ContaFormModal;
          salvar faz useContaMutations().update → updateConta() → PUT /api/contas/{id}
          (ContaPagarController.atualizar).
      */}
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
            {/*
              Título: Botões Pagar e Cancelar
              Explicação: Aparecem só em contas em aberto. Chamam onAction("pay") ou onAction("cancel"), que abrem
                a confirmação; a chamada ao backend acontece em confirmAction().
            */}
            <ActionButton label="Pagar" onPress={() => onAction("pay")} tone="success" />
            <ActionButton label="Cancelar" onPress={() => onAction("cancel")} tone="neutral" />
          </>
        ) : (
          // Título: Botão Reabrir
          // Explicação: Aparece em contas pagas ou canceladas. Chama onAction("reopen"); depois da confirmação,
          //   confirmAction() faz PATCH /api/contas/{id}/reabrir.
          <ActionButton label="Reabrir" onPress={() => onAction("reopen")} tone="primary" />
        )}
        {/*
          Título: Botão lixeira (excluir conta)
          Explicação: Chama onAction("remove"), que abre a confirmação; depois de confirmar, confirmAction()
            faz DELETE /api/contas/{id}.
        */}
        <Pressable accessibilityLabel={`Excluir ${conta.descricao}`} accessibilityRole="button" onPress={() => onAction("remove")} style={styles.delete}>
          <Ionicons color={colors.danger} name="trash-outline" size={19} />
        </Pressable>
      </View>
    {/*
      Título: Toque do botão de ação
      Explicação: Chama o onPress recebido do ContaCard (Pagar, Cancelar ou Reabrir).
    */}
    </View>
  );
}

/**
 * Título: Botão de ação dentro do cartão
 * Explicação: Usada só dentro deste arquivo, por ContaCard.
 */
function ActionButton({ label, onPress, tone }: { label: string; onPress: () => void; tone: "success" | "primary" | "neutral" }) {
  const color = tone === "success" ? colors.success : tone === "primary" ? colors.primary : colors.textSecondary;
  return <Pressable accessibilityRole="button" onPress={onPress} style={styles.actionButton}><Text style={[styles.actionText, { color }]}>{label}</Text></Pressable>;
}

/**
 * Título: Cor da etiqueta de cada estado
 * Explicação: Usada só dentro deste arquivo, por ContaCard.
 */
function statusTone(status: StatusConta): "success" | "warning" | "danger" | "neutral" {
  if (status === "PAGA") return "success";
  if (status === "VENCIDA") return "danger";
  if (status === "PENDENTE") return "warning";
  return "neutral";
}

/**
 * Título: Texto do vencimento ("Vence hoje", "Pago em ...")
 * Explicação: Usada só dentro deste arquivo, por ContaCard.
 */
function dueLabel(conta: ContaPagar) {
  if (conta.status === "PAGA") return conta.dataPagamento ? `Pago em ${formatDate(conta.dataPagamento)}` : "Pagamento registrado";
  if (conta.status === "CANCELADA") return "Cancelada";
  if ((conta.diasParaVencimento ?? 0) < 0) return `Venceu em ${formatDate(conta.dataVencimento)}`;
  if (conta.diasParaVencimento === 0) return "Vence hoje";
  return `Vence em ${formatDate(conta.dataVencimento)}`;
}

/**
 * Título: Nome legível de cada filtro
 * Explicação: Usada só dentro deste arquivo, por ContasScreen.
 */
function filterLabel(filter: Filter) {
  if (filter === "TODAS") return "Todas";
  return filter[0] + filter.slice(1).toLowerCase();
}

/**
 * Título: Título e texto da confirmação de cada ação
 * Explicação: Usada só dentro deste arquivo, por ContasScreen.
 */
function actionDialog(action: PendingAction) {
  const amount = formatCurrency(action.conta.valor);
  if (action.type === "pay") return { title: "Confirmar pagamento", message: `Registrar o pagamento de ${amount}?`, confirmLabel: "Registrar" };
  if (action.type === "cancel") return { title: "Cancelar conta?", message: "A conta sairá dos compromissos em aberto e poderá ser reaberta depois.", confirmLabel: "Cancelar conta" };
  if (action.type === "reopen") return { title: "Reabrir conta?", message: "A conta voltará para os compromissos em aberto.", confirmLabel: "Reabrir" };
  return { title: "Excluir conta?", message: "Esta exclusão é definitiva. Verifique se o registro não é mais necessário.", confirmLabel: "Excluir" };
}

/**
 * Título: Mensagem de sucesso de cada ação
 * Explicação: Usada só dentro deste arquivo, por ContasScreen.
 */
function successMessage(action: Action) {
  if (action === "pay") return "Pagamento registrado com sucesso.";
  if (action === "cancel") return "Conta cancelada com sucesso.";
  if (action === "reopen") return "Conta reaberta com sucesso.";
  return "Conta excluída com sucesso.";
}

/**
 * Título: Mensagem de erro padrão de cada ação
 * Explicação: Usada só dentro deste arquivo, por ContasScreen.
 */
function fallbackMessage(action: Action) {
  if (action === "pay") return "Não foi possível registrar o pagamento.";
  if (action === "cancel") return "Não foi possível cancelar a conta.";
  if (action === "reopen") return "Não foi possível reabrir a conta.";
  return "Não foi possível excluir a conta.";
}

/**
 * Título: Se a ação escolhida ainda está em andamento
 * Explicação: Usada só dentro deste arquivo, por ContasScreen.
 */
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
