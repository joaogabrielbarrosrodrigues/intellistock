/**
 * Título: Formulário de cadastro e edição de fornecedor
 * Explicação: Componente de formulário de fornecedor (cadastro ou edição).
 */
import { useEffect, useRef, useState } from "react";
import { StyleSheet } from "react-native";
import { getApiErrorMessage } from "../api/errors";
import type { Fornecedor } from "../api/types";
import { useFornecedorMutations } from "../hooks/useIntellistockQueries";
import { colors } from "../theme/colors";
import { Button, FormModal, TextField } from "./ui";
import { AppText as Text } from "./AppText";

/**
 * Título: Formulário de cadastro e edição de fornecedor (componente FornecedorFormModal)
 * Explicação: Campos: nome (obrigatório), CNPJ, telefone e e-mail. save(): confere o nome e envia; o
 *   CNPJ é validado pelo backend, que devolve a mensagem se estiver errado. Usado por
 *   FornecedoresScreen.
 */
export function FornecedorFormModal({
  visible,
  supplier,
  onClose,
  onSaved
}: {
  visible: boolean;
  supplier?: Fornecedor | null;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const mutations = useFornecedorMutations();
  const submitting = useRef(false);
  const [nome, setNome] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (visible) {
      setNome(supplier?.nome ?? "");
      setCnpj(supplier?.cnpj ?? "");
      setTelefone(supplier?.telefone ?? "");
      setEmail(supplier?.email ?? "");
      setError(null);
    }
  }, [supplier, visible]);
  /**
   * Título: Valida e salva
   * Explicação: Valida o nome e monta o corpo (campos vazios viram null). Na edição chama
   *   useFornecedorMutations().update → updateFornecedor() → PUT /api/fornecedores/{id}
   *   (FornecedorController.atualizar); no cadastro, create → createFornecedor() → POST /api/fornecedores
   *   (FornecedorController.criar).
   */
  async function save() {
    if (submitting.current) return;
    if (!nome.trim()) return setError("Informe o nome do fornecedor.");
    submitting.current = true;
    setError(null);
    try {
      const payload = {
        nome: nome.trim(),
        cnpj: cnpj.trim() || null,
        telefone: telefone.trim() || null,
        email: email.trim() || null
      };
      if (supplier) await mutations.update.mutateAsync({ id: supplier.id, payload });
      else await mutations.create.mutateAsync(payload);
      onClose();
      onSaved(
        supplier ? "Fornecedor atualizado com sucesso." : "Fornecedor cadastrado com sucesso."
      );
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Não foi possível salvar o fornecedor."));
    } finally {
      submitting.current = false;
    }
  }
  const saving = mutations.create.isPending || mutations.update.isPending;
  return (
    // Título: Janela do formulário de fornecedor
    // Explicação: O × e o voltar do Android chamam onClose (bloqueado enquanto salva).
    <FormModal
      busy={saving}
      onClose={() => {
        if (!submitting.current) onClose();
      }}
      title={supplier ? "Editar fornecedor" : "Novo fornecedor"}
      visible={visible}
    >
      {/*
        Título: Campo nome
        Explicação: Guarda o texto em nome (obrigatório).
      */}
      <TextField
        autoCapitalize="words"
        editable={!saving}
        label="Nome"
        maxLength={150}
        onChangeText={setNome}
        placeholder="Razão social ou nome"
        value={nome}
      />
      {/*
        Título: Campo CNPJ
        Explicação: Opcional. O backend limpa a pontuação, valida os dígitos (CnpjUtils) e recusa CNPJ
          repetido com 409.
      */}
      <TextField
        editable={!saving}
        keyboardType="numeric"
        label="CNPJ"
        maxLength={18}
        onChangeText={setCnpj}
        placeholder="Opcional"
        value={cnpj}
      />
      {/*
        Título: Campo telefone
        Explicação: Guarda o texto em telefone (opcional).
      */}
      <TextField
        editable={!saving}
        keyboardType="phone-pad"
        label="Telefone"
        maxLength={20}
        onChangeText={setTelefone}
        placeholder="Opcional"
        value={telefone}
      />
      {/*
        Título: Campo e-mail
        Explicação: Guarda o texto em email (opcional; o backend confere o formato).
      */}
      <TextField
        autoCapitalize="none"
        autoCorrect={false}
        editable={!saving}
        keyboardType="email-address"
        label="E-mail"
        maxLength={180}
        onChangeText={setEmail}
        placeholder="Opcional"
        value={email}
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
        Título: Botão Cadastrar fornecedor / Salvar alterações
        Explicação: Chama save(): na edição, useFornecedorMutations().update → updateFornecedor() → PUT
          /api/fornecedores/{id} (FornecedorController.atualizar); no cadastro, create → createFornecedor() →
          POST /api/fornecedores (FornecedorController.criar). Com sucesso fecha a janela.
      */}
      <Button
        loading={saving}
        onPress={() => void save()}
        title={supplier ? "Salvar alterações" : "Cadastrar fornecedor"}
      />
    </FormModal>
  );
}
const styles = StyleSheet.create({ error: { color: colors.danger, textAlign: "center" } });
