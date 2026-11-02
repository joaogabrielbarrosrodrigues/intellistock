import { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { getApiErrorMessage } from "../api/errors";
import type { EstoqueItem, TipoMovimentacao } from "../api/types";
import { useMovimentacaoMutation } from "../hooks/useIntellistockQueries";
import { colors } from "../theme/colors";
import { spacing } from "../theme/tokens";
import { formatQuantity } from "../utils";
import { Choice } from "./ProductFormModal";
import { Button, FormModal, TextField } from "./ui";
import { AppText as Text } from "./AppText";

export function MovimentacaoModal({ visible, item, initialType = "SAIDA", onClose, onSaved }: { visible: boolean; item?: EstoqueItem | null; initialType?: TipoMovimentacao; onClose: () => void; onSaved: (message: string) => void }) {
  const mutation = useMovimentacaoMutation(); const [tipo, setTipo] = useState<TipoMovimentacao>(initialType); const [quantidade, setQuantidade] = useState(""); const [observacao, setObservacao] = useState(""); const [error, setError] = useState<string | null>(null);
  const submitting = useRef(false);
  useEffect(() => { if (visible) { submitting.current = false; setTipo(initialType); setQuantidade(""); setObservacao(""); setError(null); } }, [initialType, visible]);
  async function save() {
    if (!item || submitting.current) return;
    const normalized = quantidade.trim().replace(",", ".");
    const amount = Number(normalized);
    if (!/^\d+(?:\.\d{1,3})?$/.test(normalized) || !Number.isFinite(amount) || amount <= 0) {
      setError("Informe uma quantidade maior que zero, com até 3 casas decimais.");
      return;
    }
    submitting.current = true;
    setError(null);
    try {
      const result = await mutation.mutateAsync({ produtoId: item.produtoId, tipo, quantidade: amount, observacao: observacao.trim() || null });
      onClose();
      onSaved(`${tipo === "ENTRADA" ? "Entrada" : "Saída"} registrada. Novo saldo: ${formatQuantity(result.saldoResultante, item.unidadeMedida)}.`);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Não foi possível registrar a movimentação."));
      submitting.current = false;
    }
  }
  return <FormModal onClose={() => { if (!submitting.current) onClose(); }} title="Registrar movimentação" visible={visible}>
    <View style={styles.product}><Text style={styles.productLabel}>Produto</Text><Text style={styles.productName}>{item?.produtoNome}</Text>{item ? <Text style={styles.available}>Disponível: {formatQuantity(item.quantidade, item.unidadeMedida)}</Text> : null}</View>
    <View style={styles.kind}><Choice label="Entrada" onPress={() => setTipo("ENTRADA")} selected={tipo === "ENTRADA"} /><Choice label="Saída" onPress={() => setTipo("SAIDA")} selected={tipo === "SAIDA"} /></View>
    <TextField keyboardType="decimal-pad" label={`Quantidade (${item?.unidadeMedida ?? "unidade"})`} onChangeText={setQuantidade} placeholder="0" value={quantidade} />
    <TextField label="Observação" multiline onChangeText={setObservacao} placeholder="Opcional" value={observacao} />
    {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}<Button loading={mutation.isPending} onPress={() => void save()} title="Confirmar lançamento" />
  </FormModal>;
}
const styles = StyleSheet.create({ product: { backgroundColor: colors.surfaceMuted, borderRadius: 12, gap: 3, padding: spacing.sm }, productLabel: { color: colors.muted, fontSize: 12, fontWeight: "700" }, productName: { color: colors.text, fontSize: 17, fontWeight: "800" }, available: { color: colors.primaryDark }, kind: { flexDirection: "row", gap: spacing.xs }, error: { color: colors.danger, textAlign: "center" } });
