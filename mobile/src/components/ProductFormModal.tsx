import { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { getApiErrorMessage } from "../api/errors";
import type { Fornecedor, Produto, UnidadeMedida } from "../api/types";
import { useProdutoMutations } from "../hooks/useIntellistockQueries";
import { colors } from "../theme/colors";
import { radius, spacing } from "../theme/tokens";
import { parseDecimalInput } from "../utils";
import { Button, Choice, FormModal, TextField } from "./ui";
import { AppText as Text } from "./AppText";
import { StateView } from "./StateView";

const unidades: UnidadeMedida[] = ["UN", "KG", "G", "L", "ML", "CX", "FD", "PCT", "M"];

type Props = {
  visible: boolean;
  product?: Produto | null;
  suppliers: Fornecedor[];
  suppliersLoading?: boolean;
  suppliersError?: string | null;
  onRetrySuppliers?: () => void;
  onClose: () => void;
  onSaved: (message: string) => void;
};

export function ProductFormModal({
  visible,
  product,
  suppliers,
  suppliersLoading,
  suppliersError,
  onRetrySuppliers,
  onClose,
  onSaved
}: Props) {
  const mutations = useProdutoMutations();
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [quantidadeInicial, setQuantidadeInicial] = useState("");
  const [estoqueMinimo, setEstoqueMinimo] = useState("");
  const [preco, setPreco] = useState("");
  const [unidadeMedida, setUnidadeMedida] = useState<UnidadeMedida>("UN");
  const [fornecedorId, setFornecedorId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const submitting = useRef(false);

  useEffect(() => {
    if (!visible) return;
    setNome(product?.nome ?? "");
    setDescricao(product?.descricao ?? "");
    setQuantidadeInicial("");
    setEstoqueMinimo(product ? String(product.estoqueMinimo) : "");
    setPreco(product ? String(product.preco) : "");
    setUnidadeMedida(product?.unidadeMedida ?? "UN");
    setFornecedorId(product?.fornecedor?.id ?? null);
    setError(null);
  }, [product, visible]);

  async function save() {
    if (submitting.current) return;
    const minimo = parseDecimalInput(estoqueMinimo);
    const valor = parseDecimalInput(preco, 2);
    const inicial = parseDecimalInput(quantidadeInicial);
    if (!nome.trim()) return setError("Informe o nome do produto.");
    if (!Number.isFinite(minimo) || minimo < 0)
      return setError("Informe um estoque mínimo válido, com até 3 casas decimais.");
    if (minimo >= 1_000_000_000_000)
      return setError("O estoque mínimo deve ter no máximo 12 dígitos antes da vírgula.");
    if (!Number.isFinite(valor) || valor < 0)
      return setError("Informe um preço válido, com até 2 casas decimais.");
    if (valor >= 10_000_000_000_000)
      return setError("O preço deve ter no máximo 13 dígitos antes da vírgula.");
    if (!product && (!Number.isFinite(inicial) || inicial < 0))
      return setError("Informe uma quantidade inicial válida, com até 3 casas decimais.");
    if (!product && inicial >= 1_000_000_000_000)
      return setError("A quantidade inicial deve ter no máximo 12 dígitos antes da vírgula.");
    submitting.current = true;
    setError(null);
    const payload = {
      nome: nome.trim(),
      descricao: descricao.trim() || null,
      estoqueMinimo: minimo,
      unidadeMedida,
      preco: valor,
      fornecedorId,
      ...(!product && quantidadeInicial ? { quantidadeInicial: inicial } : {})
    };
    try {
      if (product) await mutations.update.mutateAsync({ id: product.id, payload });
      else await mutations.create.mutateAsync(payload);
      onClose();
      onSaved(product ? "Produto atualizado com sucesso." : "Produto cadastrado com sucesso.");
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Não foi possível salvar o produto."));
    } finally {
      submitting.current = false;
    }
  }

  const saving = mutations.create.isPending || mutations.update.isPending;
  return (
    <FormModal
      busy={saving}
      onClose={() => {
        if (!submitting.current) onClose();
      }}
      title={product ? "Editar produto" : "Novo produto"}
      visible={visible}
    >
      <TextField
        autoCapitalize="words"
        editable={!saving}
        label="Nome"
        maxLength={150}
        onChangeText={setNome}
        placeholder="Ex.: Café em grãos"
        value={nome}
      />
      <TextField
        editable={!saving}
        label="Descrição"
        maxLength={500}
        multiline
        onChangeText={setDescricao}
        placeholder="Opcional"
        value={descricao}
      />
      {!product ? (
        <TextField
          editable={!saving}
          keyboardType="decimal-pad"
          label="Quantidade inicial"
          onChangeText={setQuantidadeInicial}
          placeholder="0"
          value={quantidadeInicial}
        />
      ) : (
        <Text style={styles.helper}>
          O saldo atual é alterado apenas pelo lançamento de movimentações.
        </Text>
      )}
      <View style={styles.row}>
        <View style={styles.flex}>
          <TextField
            editable={!saving}
            keyboardType="decimal-pad"
            label="Estoque mínimo"
            onChangeText={setEstoqueMinimo}
            placeholder="0"
            value={estoqueMinimo}
          />
        </View>
        <View style={styles.flex}>
          <TextField
            editable={!saving}
            keyboardType="decimal-pad"
            label="Preço unitário"
            onChangeText={setPreco}
            placeholder="0,00"
            value={preco}
          />
        </View>
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>Unidade de medida</Text>
        <View style={styles.chips}>
          {unidades.map((unit) => (
            <Choice
              disabled={saving}
              key={unit}
              label={unit}
              onPress={() => setUnidadeMedida(unit)}
              selected={unidadeMedida === unit}
            />
          ))}
        </View>
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>Fornecedor</Text>
        <StateView error={suppliersError} loading={suppliersLoading} onRetry={onRetrySuppliers} />
        <View style={styles.chips}>
          <Choice
            disabled={saving}
            label="Sem fornecedor"
            onPress={() => setFornecedorId(null)}
            selected={!fornecedorId}
          />
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
      </View>
      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : null}
      <Button
        loading={saving}
        onPress={() => void save()}
        title={product ? "Salvar alterações" : "Cadastrar produto"}
      />
    </FormModal>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: spacing.sm },
  flex: { flex: 1 },
  field: { gap: spacing.xs },
  label: { color: colors.textSecondary, fontSize: 14, fontWeight: "700" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  error: { color: colors.danger, textAlign: "center" },
  helper: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.sm,
    color: colors.primaryDark,
    padding: spacing.sm
  }
});
