import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { getApiErrorMessage } from "../api/errors";
import type { ContaPagar, Fornecedor } from "../api/types";
import { useContaMutations } from "../hooks/useIntellistockQueries";
import { colors } from "../theme/colors";
import { radius, spacing } from "../theme/tokens";
import { Button, FormModal, TextField } from "./ui";

const today = () => new Date().toISOString().slice(0, 10);
export function ContaFormModal({ visible, conta, suppliers, onClose, onSaved }: { visible: boolean; conta?: ContaPagar | null; suppliers: Fornecedor[]; onClose: () => void; onSaved: (message: string) => void }) {
  const mutations = useContaMutations(); const [fornecedorId, setFornecedorId] = useState(""); const [descricao, setDescricao] = useState(""); const [valor, setValor] = useState(""); const [vencimento, setVencimento] = useState(today()); const [observacao, setObservacao] = useState(""); const [error, setError] = useState<string | null>(null);
  useEffect(() => { if (visible) { setFornecedorId(conta?.fornecedor?.id ?? ""); setDescricao(conta?.descricao ?? ""); setValor(conta ? String(conta.valor) : ""); setVencimento(conta?.dataVencimento ?? today()); setObservacao(conta?.observacao ?? ""); setError(null); } }, [conta, visible]);
  async function save() {
    const amount = Number(valor.replace(",", ".")); if (!fornecedorId) return setError("Selecione o fornecedor."); if (!descricao.trim()) return setError("Informe a descrição."); if (!Number.isFinite(amount) || amount <= 0) return setError("Informe um valor maior que zero."); if (!/^\d{4}-\d{2}-\d{2}$/.test(vencimento)) return setError("Use a data no formato AAAA-MM-DD.");
    try { const payload = { fornecedorId, descricao: descricao.trim(), valor: amount, dataVencimento: vencimento, observacao: observacao.trim() || null }; if (conta) await mutations.update.mutateAsync({ id: conta.id, payload }); else await mutations.create.mutateAsync(payload); onClose(); onSaved(conta ? "Conta atualizada com sucesso." : "Conta cadastrada com sucesso."); } catch (requestError) { setError(getApiErrorMessage(requestError, "Não foi possível salvar a conta.")); }
  }
  const saving = mutations.create.isPending || mutations.update.isPending;
  return <FormModal onClose={onClose} title={conta ? "Editar conta" : "Nova conta"} visible={visible}>
    <View style={styles.field}><Text style={styles.label}>Fornecedor</Text><View style={styles.suppliers}>{suppliers.map((supplier) => <Text key={supplier.id} accessibilityRole="button" onPress={() => setFornecedorId(supplier.id)} style={[styles.supplier, fornecedorId === supplier.id && styles.supplierSelected]}>{supplier.nome}</Text>)}</View>{suppliers.length === 0 ? <Text style={styles.help}>Cadastre um fornecedor antes de criar uma conta.</Text> : null}</View>
    <TextField label="Descrição" onChangeText={setDescricao} placeholder="Ex.: Boleto de compra" value={descricao} />
    <View style={styles.row}><View style={styles.flex}><TextField keyboardType="decimal-pad" label="Valor" onChangeText={setValor} placeholder="0,00" value={valor} /></View><View style={styles.flex}><TextField label="Vencimento" onChangeText={setVencimento} placeholder="AAAA-MM-DD" value={vencimento} /></View></View>
    <TextField label="Observação" multiline onChangeText={setObservacao} placeholder="Opcional" value={observacao} />
    {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}<Button disabled={!suppliers.length} loading={saving} onPress={() => void save()} title={conta ? "Salvar alterações" : "Cadastrar conta"} />
  </FormModal>;
}
const styles = StyleSheet.create({ field: { gap: spacing.xs }, label: { color: colors.textSecondary, fontSize: 14, fontWeight: "700" }, suppliers: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }, supplier: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.pill, borderWidth: 1, color: colors.textSecondary, fontSize: 13, fontWeight: "700", maxWidth: "100%", overflow: "hidden", paddingHorizontal: spacing.sm, paddingVertical: 8 }, supplierSelected: { backgroundColor: colors.primaryLight, borderColor: colors.primary, color: colors.primaryDark }, row: { flexDirection: "row", gap: spacing.sm }, flex: { flex: 1 }, error: { color: colors.danger, textAlign: "center" }, help: { color: colors.warning, fontSize: 13 } });
