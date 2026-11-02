import { useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import { getApiErrorMessage } from "../api/errors";
import type { Fornecedor } from "../api/types";
import { useFornecedorMutations } from "../hooks/useIntellistockQueries";
import { colors } from "../theme/colors";
import { Button, FormModal, TextField } from "./ui";
import { AppText as Text } from "./AppText";

export function FornecedorFormModal({ visible, supplier, onClose, onSaved }: { visible: boolean; supplier?: Fornecedor | null; onClose: () => void; onSaved: (message: string) => void }) {
  const mutations = useFornecedorMutations();
  const [nome, setNome] = useState(""); const [cnpj, setCnpj] = useState(""); const [telefone, setTelefone] = useState(""); const [email, setEmail] = useState(""); const [error, setError] = useState<string | null>(null);
  useEffect(() => { if (visible) { setNome(supplier?.nome ?? ""); setCnpj(supplier?.cnpj ?? ""); setTelefone(supplier?.telefone ?? ""); setEmail(supplier?.email ?? ""); setError(null); } }, [supplier, visible]);
  async function save() {
    if (!nome.trim()) return setError("Informe o nome do fornecedor.");
    try { const payload = { nome: nome.trim(), cnpj: cnpj.trim() || null, telefone: telefone.trim() || null, email: email.trim() || null }; if (supplier) await mutations.update.mutateAsync({ id: supplier.id, payload }); else await mutations.create.mutateAsync(payload); onClose(); onSaved(supplier ? "Fornecedor atualizado com sucesso." : "Fornecedor cadastrado com sucesso."); } catch (requestError) { setError(getApiErrorMessage(requestError, "Não foi possível salvar o fornecedor.")); }
  }
  const saving = mutations.create.isPending || mutations.update.isPending;
  return <FormModal onClose={onClose} title={supplier ? "Editar fornecedor" : "Novo fornecedor"} visible={visible}>
    <TextField autoCapitalize="words" label="Nome" onChangeText={setNome} placeholder="Razão social ou nome" value={nome} />
    <TextField keyboardType="numeric" label="CNPJ" onChangeText={setCnpj} placeholder="Opcional" value={cnpj} />
    <TextField keyboardType="phone-pad" label="Telefone" onChangeText={setTelefone} placeholder="Opcional" value={telefone} />
    <TextField autoCapitalize="none" keyboardType="email-address" label="E-mail" onChangeText={setEmail} placeholder="Opcional" value={email} />
    {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}<Button loading={saving} onPress={() => void save()} title={supplier ? "Salvar alterações" : "Cadastrar fornecedor"} />
  </FormModal>;
}
const styles = StyleSheet.create({ error: { color: colors.danger, textAlign: "center" } });
