import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { getApiErrorMessage } from "../api/errors";
import type { Fornecedor, Produto, UnidadeMedida } from "../api/types";
import { useProdutoMutations } from "../hooks/useIntellistockQueries";
import { colors } from "../theme/colors";
import { radius, spacing } from "../theme/tokens";
import { Button, FormModal, TextField } from "./ui";
import { AppText as Text } from "./AppText";

const unidades: UnidadeMedida[] = ["UN", "KG", "G", "L", "ML", "CX", "FD", "PCT", "M"];
const numeric = (value: string) => Number(value.replace(",", "."));

export function ProductFormModal({ visible, product, suppliers, onClose, onSaved }: { visible: boolean; product?: Produto | null; suppliers: Fornecedor[]; onClose: () => void; onSaved: (message: string) => void }) {
  const mutations = useProdutoMutations();
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [quantidadeInicial, setQuantidadeInicial] = useState("");
  const [estoqueMinimo, setEstoqueMinimo] = useState("");
  const [preco, setPreco] = useState("");
  const [unidadeMedida, setUnidadeMedida] = useState<UnidadeMedida>("UN");
  const [fornecedorId, setFornecedorId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setNome(product?.nome ?? ""); setDescricao(product?.descricao ?? "");
    setQuantidadeInicial(""); setEstoqueMinimo(product ? String(product.estoqueMinimo) : "");
    setPreco(product ? String(product.preco) : ""); setUnidadeMedida(product?.unidadeMedida ?? "UN");
    setFornecedorId(product?.fornecedor?.id ?? null); setError(null);
  }, [product, visible]);

  async function save() {
    const minimo = numeric(estoqueMinimo); const valor = numeric(preco); const inicial = numeric(quantidadeInicial);
    if (!nome.trim()) return setError("Informe o nome do produto.");
    if (!Number.isFinite(minimo) || minimo < 0) return setError("Informe um estoque mínimo válido.");
    if (!Number.isFinite(valor) || valor < 0) return setError("Informe um preço válido.");
    if (!product && quantidadeInicial && (!Number.isFinite(inicial) || inicial < 0)) return setError("Informe uma quantidade inicial válida.");
    setError(null);
    const payload = { nome: nome.trim(), descricao: descricao.trim() || null, estoqueMinimo: minimo, unidadeMedida, preco: valor, fornecedorId, ...(!product && quantidadeInicial ? { quantidadeInicial: inicial } : {}) };
    try {
      if (product) await mutations.update.mutateAsync({ id: product.id, payload }); else await mutations.create.mutateAsync(payload);
      onClose(); onSaved(product ? "Produto atualizado com sucesso." : "Produto cadastrado com sucesso.");
    } catch (requestError) { setError(getApiErrorMessage(requestError, "Não foi possível salvar o produto.")); }
  }

  const saving = mutations.create.isPending || mutations.update.isPending;
  return <FormModal onClose={onClose} title={product ? "Editar produto" : "Novo produto"} visible={visible}>
    <TextField autoCapitalize="words" label="Nome" onChangeText={setNome} placeholder="Ex.: Café em grãos" value={nome} />
    <TextField label="Descrição" multiline onChangeText={setDescricao} placeholder="Opcional" value={descricao} />
    {!product ? <TextField keyboardType="decimal-pad" label="Quantidade inicial" onChangeText={setQuantidadeInicial} placeholder="0" value={quantidadeInicial} /> : <Text style={styles.helper}>O saldo atual é alterado apenas pelo lançamento de movimentações.</Text>}
    <View style={styles.row}><View style={styles.flex}><TextField keyboardType="decimal-pad" label="Estoque mínimo" onChangeText={setEstoqueMinimo} placeholder="0" value={estoqueMinimo} /></View><View style={styles.flex}><TextField keyboardType="decimal-pad" label="Preço unitário" onChangeText={setPreco} placeholder="0,00" value={preco} /></View></View>
    <View style={styles.field}><Text style={styles.label}>Unidade de medida</Text><View style={styles.chips}>{unidades.map((unit) => <Choice key={unit} label={unit} onPress={() => setUnidadeMedida(unit)} selected={unidadeMedida === unit} />)}</View></View>
    <View style={styles.field}><Text style={styles.label}>Fornecedor</Text><View style={styles.chips}><Choice label="Sem fornecedor" onPress={() => setFornecedorId(null)} selected={!fornecedorId} />{suppliers.map((supplier) => <Choice key={supplier.id} label={supplier.nome} onPress={() => setFornecedorId(supplier.id)} selected={fornecedorId === supplier.id} />)}</View></View>
    {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
    <Button loading={saving} onPress={() => void save()} title={product ? "Salvar alterações" : "Cadastrar produto"} />
  </FormModal>;
}

export function Choice({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={[styles.choice, selected && styles.choiceSelected]}><Text numberOfLines={1} style={[styles.choiceText, selected && styles.choiceTextSelected]}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: spacing.sm }, flex: { flex: 1 }, field: { gap: spacing.xs }, label: { color: colors.textSecondary, fontSize: 14, fontWeight: "700" }, chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  choice: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.pill, borderWidth: 1, maxWidth: "100%", paddingHorizontal: spacing.sm, paddingVertical: 8 }, choiceSelected: { backgroundColor: colors.primaryLight, borderColor: colors.primary }, choiceText: { color: colors.textSecondary, fontSize: 13, fontWeight: "700" }, choiceTextSelected: { color: colors.primaryDark },
  error: { color: colors.danger, textAlign: "center" }, helper: { backgroundColor: colors.primaryLight, borderRadius: radius.sm, color: colors.primaryDark, padding: spacing.sm }
});
