/**
 * Título: Formulário de cadastro e edição de conta
 * Explicação: Componente de formulário de conta a pagar (cadastro ou edição).
 */
import { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { getApiErrorMessage } from "../api/errors";
import type { ContaPagar, Fornecedor } from "../api/types";
import { useContaMutations } from "../hooks/useIntellistockQueries";
import { colors } from "../theme/colors";
import { spacing } from "../theme/tokens";
import { formatDate, formatDateInput, parseDateInput, parseDecimalInput, todayIsoLocal } from "../utils";
import { Button, Choice, FormModal, TextField } from "./ui";
import { AppText as Text } from "./AppText";
import { StateView } from "./StateView";

type Props = {
  visible: boolean;
  conta?: ContaPagar | null;
  suppliers: Fornecedor[];
  suppliersLoading?: boolean;
  suppliersError?: string | null;
  onRetrySuppliers?: () => void;
  onClose: () => void;
  onSaved: (message: string) => void;
};

/**
 * Título: Formulário de cadastro e edição de conta (componente ContaFormModal)
 * Explicação: Seleção do fornecedor (obrigatório), descrição, valor, vencimento em DD/MM/AAAA (as
 *   barras entram sozinhas) e observação. save(): confere fornecedor, descrição, valor maior que zero e
 *   data válida, converte a data para AAAA-MM-DD e envia. Avisa para cadastrar um fornecedor antes, se
 *   não houver nenhum. Usado por ContasScreen.
 */
export function ContaFormModal({ visible, conta, suppliers, suppliersLoading, suppliersError, onRetrySuppliers, onClose, onSaved }: Props) {
  const mutations = useContaMutations();
  const [fornecedorId, setFornecedorId] = useState("");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [vencimento, setVencimento] = useState(() => formatDate(todayIsoLocal()));
  const [observacao, setObservacao] = useState("");
  const [error, setError] = useState<string | null>(null);
  const submitting = useRef(false);

  useEffect(() => {
    if (!visible) return;
    setFornecedorId(conta?.fornecedor?.id ?? "");
    setDescricao(conta?.descricao ?? "");
    setValor(conta ? String(conta.valor) : "");
    setVencimento(formatDate(conta?.dataVencimento ?? todayIsoLocal()));
    setObservacao(conta?.observacao ?? "");
    setError(null);
  }, [conta, visible]);

  /**
   * Título: Valida e salva
   * Explicação: Valida fornecedor, descrição, valor e data (DD/MM/AAAA → AAAA-MM-DD). Na edição chama
   *   useContaMutations().update → updateConta() → PUT /api/contas/{id} (ContaPagarController.atualizar);
   *   no cadastro, create → createConta() → POST /api/contas (ContaPagarController.criar).
   */
  async function save() {
    if (submitting.current) return;
    const amount = parseDecimalInput(valor, 2);
    const dataVencimento = parseDateInput(vencimento);
    if (!fornecedorId) return setError("Selecione o fornecedor.");
    if (!descricao.trim()) return setError("Informe a descrição.");
    if (!Number.isFinite(amount) || amount <= 0) return setError("Informe um valor maior que zero, com até 2 casas decimais.");
    if (amount >= 10_000_000_000_000) return setError("O valor deve ter no máximo 13 dígitos antes da vírgula.");
    if (!dataVencimento) return setError("Informe uma data válida no formato DD/MM/AAAA.");

    submitting.current = true;
    setError(null);
    try {
      const payload = {
        fornecedorId,
        descricao: descricao.trim(),
        valor: amount,
        dataVencimento,
        observacao: observacao.trim() || null
      };
      if (conta) await mutations.update.mutateAsync({ id: conta.id, payload });
      else await mutations.create.mutateAsync(payload);
      onClose();
      onSaved(conta ? "Conta atualizada com sucesso." : "Conta cadastrada com sucesso.");
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Não foi possível salvar a conta."));
    } finally {
      submitting.current = false;
    }
  }

  const saving = mutations.create.isPending || mutations.update.isPending;
  return (
    // Título: Janela do formulário de conta
    // Explicação: O × e o voltar do Android chamam onClose (bloqueado enquanto salva). O título muda entre
    //   Nova conta e Editar conta.
    <FormModal busy={saving} onClose={() => { if (!submitting.current) onClose(); }} title={conta ? "Editar conta" : "Nova conta"} visible={visible}>
      <View style={styles.field}>
        <Text style={styles.label}>Fornecedor</Text>
        {/*
          Título: Carregando / erro dos fornecedores
          Explicação: Mostra o estado de GET /api/fornecedores; Tentar novamente chama onRetrySuppliers.
        */}
        <StateView error={suppliersError} loading={suppliersLoading} onRetry={onRetrySuppliers} />
        <View style={styles.suppliers}>
          {/*
            Título: Escolha do fornecedor
            Explicação: Cada opção chama setFornecedorId(id). A conta exige fornecedor.
          */}
          {suppliers.map((supplier) => (
            <Choice
              disabled={saving}
              key={supplier.id}
              label={supplier.nome}
              onPress={() => setFornecedorId(supplier.id)}
              selected={fornecedorId === supplier.id}
            />
          ))}
        </View>
        {!suppliersLoading && !suppliersError && suppliers.length === 0 ? <Text style={styles.help}>Cadastre um fornecedor antes de criar uma conta.</Text> : null}
      </View>
      {/*
        Título: Campo descrição
        Explicação: Guarda o texto em descricao (obrigatório).
      */}
      <TextField editable={!saving} label="Descrição" maxLength={255} onChangeText={setDescricao} placeholder="Ex.: Boleto de compra" value={descricao} />
      {/*
        Título: Campos valor e vencimento
        Explicação: Valor aceita vírgula e precisa ser maior que zero; o vencimento é digitado como
          DD/MM/AAAA e formatDateInput() põe as barras.
      */}
      <View style={styles.row}>
        <View style={styles.flex}><TextField editable={!saving} keyboardType="decimal-pad" label="Valor" onChangeText={setValor} placeholder="0,00" value={valor} /></View>
        <View style={styles.flex}><TextField editable={!saving} keyboardType="number-pad" label="Vencimento" maxLength={10} onChangeText={(value) => setVencimento(formatDateInput(value))} placeholder="DD/MM/AAAA" value={vencimento} /></View>
      </View>
      {/*
        Título: Campo observação
        Explicação: Guarda o texto em observacao (opcional).
      */}
      <TextField editable={!saving} label="Observação" maxLength={500} multiline onChangeText={setObservacao} placeholder="Opcional" value={observacao} />
      {/*
        Título: Mensagem de erro
        Explicação: Aparece quando a validação da tela ou o backend recusam o envio; o texto vem de
          getApiErrorMessage().
      */}
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      {/*
        Título: Botão Cadastrar conta / Salvar alterações
        Explicação: Chama save(): na edição, useContaMutations().update → updateConta() → PUT
          /api/contas/{id} (ContaPagarController.atualizar); no cadastro, create → createConta() → POST
          /api/contas (ContaPagarController.criar). Fica desativado se não houver fornecedores.
      */}
      <Button disabled={!suppliers.length} loading={saving} onPress={() => void save()} title={conta ? "Salvar alterações" : "Cadastrar conta"} />
    </FormModal>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.xs },
  label: { color: colors.textSecondary, fontSize: 14, fontWeight: "700" },
  suppliers: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  row: { flexDirection: "row", gap: spacing.sm },
  flex: { flex: 1 },
  error: { color: colors.danger, textAlign: "center" },
  help: { color: colors.warning, fontSize: 13 }
});
