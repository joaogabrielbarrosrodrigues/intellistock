/**
 * Título: Formulário de entrada e saída de estoque
 * Explicação: Componente de formulário de lançamento de estoque.
 */
import { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { getApiErrorMessage } from "../api/errors";
import type { EstoqueItem, TipoMovimentacao } from "../api/types";
import { useMovimentacaoMutation } from "../hooks/useIntellistockQueries";
import { colors } from "../theme/colors";
import { spacing } from "../theme/tokens";
import { formatQuantity, parseDecimalInput } from "../utils";
import { Button, Choice, FormModal, TextField } from "./ui";
import { AppText as Text } from "./AppText";

/**
 * Título: Formulário de entrada e saída de estoque (componente MovimentacaoModal)
 * Explicação: Mostra o produto e o saldo disponível. Escolha entre Entrada e Saída, quantidade e
 *   observação. save(): confere a quantidade (maior que zero, até 3 casas), envia e mostra o novo saldo
 *   devolvido pelo backend; se for saída maior que o saldo, mostra a mensagem do backend. Usado por
 *   EstoqueScreen.
 */
export function MovimentacaoModal({
  visible,
  item,
  initialType = "SAIDA",
  onClose,
  onSaved
}: {
  visible: boolean;
  item?: EstoqueItem | null;
  initialType?: TipoMovimentacao;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const mutation = useMovimentacaoMutation();
  const [tipo, setTipo] = useState<TipoMovimentacao>(initialType);
  const [quantidade, setQuantidade] = useState("");
  const [observacao, setObservacao] = useState("");
  const [error, setError] = useState<string | null>(null);
  const submitting = useRef(false);
  useEffect(() => {
    if (visible) {
      setTipo(initialType);
      setQuantidade("");
      setObservacao("");
      setError(null);
    }
  }, [initialType, item?.produtoId, visible]);
  /**
   * Título: Valida e registra
   * Explicação: Valida a quantidade e chama useMovimentacaoMutation() → createMovimentacao() → POST
   *   /api/movimentacoes (MovimentacaoController.registrar) com produto, tipo, quantidade e observação.
   *   Com sucesso avisa a tela com o novo saldo devolvido pelo backend.
   */
  async function save() {
    if (!item || submitting.current) return;
    const amount = parseDecimalInput(quantidade);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Informe uma quantidade maior que zero, com até 3 casas decimais.");
      return;
    }
    if (amount >= 1_000_000_000_000)
      return setError("A quantidade deve ter no máximo 12 dígitos antes da vírgula.");
    submitting.current = true;
    setError(null);
    try {
      const result = await mutation.mutateAsync({
        produtoId: item.produtoId,
        tipo,
        quantidade: amount,
        observacao: observacao.trim() || null
      });
      onClose();
      onSaved(
        `${result.tipo === "ENTRADA" ? "Entrada" : "Saída"} registrada. Novo saldo: ${formatQuantity(result.saldoResultante, item.unidadeMedida)}.`
      );
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Não foi possível registrar a movimentação."));
    } finally {
      submitting.current = false;
    }
  }
  return (
    // Título: Janela de lançamento de estoque
    // Explicação: O × e o voltar do Android chamam onClose (bloqueado enquanto salva).
    <FormModal
      busy={mutation.isPending}
      onClose={() => {
        if (!submitting.current) onClose();
      }}
      title="Registrar movimentação"
      visible={visible}
    >
      {/*
        Título: Produto e saldo disponível
        Explicação: Mostra o produto escolhido no cartão do estoque e o saldo atual.
      */}
      <View style={styles.product}>
        <Text style={styles.productLabel}>Produto</Text>
        <Text style={styles.productName}>{item?.produtoNome}</Text>
        {item ? (
          <Text style={styles.available}>
            Disponível: {formatQuantity(item.quantidade, item.unidadeMedida)}
          </Text>
        ) : null}
      </View>
      <View style={styles.kind}>
        {/*
          Título: Escolha Entrada ou Saída
          Explicação: Cada opção chama setTipo("ENTRADA") ou setTipo("SAIDA").
        */}
        <Choice
          disabled={mutation.isPending}
          label="Entrada"
          onPress={() => setTipo("ENTRADA")}
          selected={tipo === "ENTRADA"}
        />
        <Choice
          disabled={mutation.isPending}
          label="Saída"
          onPress={() => setTipo("SAIDA")}
          selected={tipo === "SAIDA"}
        />
      </View>
      {/*
        Título: Campo quantidade
        Explicação: Guarda o texto em quantidade; precisa ser maior que zero, com até 3 casas decimais.
      */}
      <TextField
        editable={!mutation.isPending}
        keyboardType="decimal-pad"
        label={`Quantidade (${item?.unidadeMedida ?? "unidade"})`}
        onChangeText={setQuantidade}
        placeholder="0"
        value={quantidade}
      />
      {/*
        Título: Campo observação
        Explicação: Guarda o texto em observacao (opcional).
      */}
      <TextField
        editable={!mutation.isPending}
        label="Observação"
        maxLength={500}
        multiline
        onChangeText={setObservacao}
        placeholder="Opcional"
        value={observacao}
      />
      {/*
        Título: Mensagem de erro
        Explicação: Aparece quando a validação da tela ou o backend recusam o envio; o texto vem de
          getApiErrorMessage().
      */}
      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : null}
      {/*
        Título: Botão Confirmar lançamento
        Explicação: Chama save() → useMovimentacaoMutation() → createMovimentacao() → POST
          /api/movimentacoes (MovimentacaoController.registrar). O backend atualiza o saldo do produto e
          recusa saída maior que o saldo (422). Com sucesso mostra o novo saldo.
      */}
      <Button
        loading={mutation.isPending}
        onPress={() => void save()}
        title="Confirmar lançamento"
      />
    </FormModal>
  );
}
const styles = StyleSheet.create({
  product: { backgroundColor: colors.surfaceMuted, borderRadius: 12, gap: 3, padding: spacing.sm },
  productLabel: { color: colors.muted, fontSize: 12, fontWeight: "700" },
  productName: { color: colors.text, fontSize: 17, fontWeight: "800" },
  available: { color: colors.primaryDark },
  kind: { flexDirection: "row", gap: spacing.xs },
  error: { color: colors.danger, textAlign: "center" }
});
