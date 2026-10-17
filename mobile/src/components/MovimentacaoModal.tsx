import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { getApiErrorMessage } from "../api/errors";
import type { EstoqueItem, TipoMovimentacao } from "../api/types";
import { useMovimentacaoMutation } from "../hooks/useIntellistockQueries";
import { colors } from "../theme/colors";
import { spacing } from "../theme/tokens";
import { Choice } from "./ProductFormModal";
import { Button, FormModal, TextField } from "./ui";

export function MovimentacaoModal({ visible, item, initialType = "SAIDA", onClose, onSaved }: { visible: boolean; item?: EstoqueItem | null; initialType?: TipoMovimentacao; onClose: () => void; onSaved: (message: string) => void }) {
  const mutation = useMovimentacaoMutation(); const [tipo, setTipo] = useState<TipoMovimentacao>(initialType); const [quantidade, setQuantidade] = useState(""); const [observacao, setObservacao] = useState(""); const [error, setError] = useState<string | null>(null);
  useEffect(() => { if (visible) { setTipo(initialType); setQuantidade(""); setObservacao(""); setError(null); } }, [initialType, visible]);
  async function save() {
    const amount = Number(quantidade.replace(",", ".")); if (!item) return; if (!Number.isFinite(amount) || amount <= 0) return setError("Informe uma quantidade maior que zero.");
    try { await mutation.mutateAsync({ produtoId: item.produtoId, tipo, quantidade: amount, observacao: observacao.trim() || null }); onClose(); onSaved(tipo === "ENTRADA" ? "Entrada registrada com sucesso." : "Saída registrada com sucesso."); } catch (requestError) { setError(getApiErrorMessage(requestError, "Não foi possível registrar a movimentação.")); }
  }
  return <FormModal onClose={onClose} title="Registrar movimentação" visible={visible}>
    <View style={styles.product}><Text style={styles.productLabel}>Produto</Text><Text style={styles.productName}>{item?.produtoNome}</Text>{item ? <Text style={styles.available}>Disponível: {item.quantidade} {item.unidadeMedida}</Text> : null}</View>
    <View style={styles.kind}><Choice label="Entrada" onPress={() => setTipo("ENTRADA")} selected={tipo === "ENTRADA"} /><Choice label="Saída" onPress={() => setTipo("SAIDA")} selected={tipo === "SAIDA"} /></View>
    <TextField keyboardType="decimal-pad" label="Quantidade" onChangeText={setQuantidade} placeholder="0" value={quantidade} />
    <TextField label="Observação" multiline onChangeText={setObservacao} placeholder="Opcional" value={observacao} />
    {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}<Button loading={mutation.isPending} onPress={() => void save()} title="Confirmar lançamento" />
  </FormModal>;
}
const styles = StyleSheet.create({ product: { backgroundColor: colors.surfaceMuted, borderRadius: 12, gap: 3, padding: spacing.sm }, productLabel: { color: colors.muted, fontSize: 12, fontWeight: "700" }, productName: { color: colors.text, fontSize: 17, fontWeight: "800" }, available: { color: colors.primaryDark }, kind: { flexDirection: "row", gap: spacing.xs }, error: { color: colors.danger, textAlign: "center" } });
