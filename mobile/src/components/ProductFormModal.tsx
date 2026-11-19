/**
 * Título: Formulário de cadastro e edição de produto
 * Explicação: Componente de formulário de produto, que abre como janela sobre a tela (cadastro ou
 *   edição).
 */
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

/**
 * Título: Formulário de cadastro e edição de produto (componente ProductFormModal)
 * Explicação: Campos: nome, descrição, quantidade inicial (só no cadastro), estoque mínimo, preço,
 *   unidade de medida e fornecedor. Ao abrir, preenche com os dados do produto em edição ou limpa para
 *   um novo. save(): lê os números (aceita vírgula), confere limites e casas decimais, monta o envio e
 *   chama criar ou editar; trava contra toque duplo; mostra o erro do backend se houver. Usado por
 *   ProdutosScreen.
 */
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

  /**
   * Título: Valida e salva
   * Explicação: Valida nome, mínimo, preço e quantidade inicial e monta o corpo. Na edição chama
   *   useProdutoMutations().update → updateProduto() → PUT /api/produtos/{id}
   *   (ProdutoController.atualizar); no cadastro, create → createProduto() → POST /api/produtos
   *   (ProdutoController.criar). Com sucesso fecha e avisa a tela (onSaved).
   */
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
    // Título: Janela do formulário de produto
    // Explicação: O × e o voltar do Android chamam onClose (bloqueado enquanto salva). O título muda entre
    //   Novo produto e Editar produto.
    <FormModal
      busy={saving}
      onClose={() => {
        if (!submitting.current) onClose();
      }}
      title={product ? "Editar produto" : "Novo produto"}
      visible={visible}
    >
      {/*
        Título: Campo nome
        Explicação: Guarda o texto em nome (obrigatório, até 150 caracteres).
      */}
      <TextField
        autoCapitalize="words"
        editable={!saving}
        label="Nome"
        maxLength={150}
        onChangeText={setNome}
        placeholder="Ex.: Café em grãos"
        value={nome}
      />
      {/*
        Título: Campo descrição
        Explicação: Guarda o texto em descricao (opcional).
      */}
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
        // Título: Campo quantidade inicial
        // Explicação: Só aparece no cadastro. O backend usa esse valor para criar a primeira movimentação de
        //   entrada do produto.
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
          {/*
            Título: Campo estoque mínimo
            Explicação: Guarda em estoqueMinimo; com saldo menor ou igual a ele o produto aparece como estoque
              baixo.
          */}
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
          {/*
            Título: Campo preço unitário
            Explicação: Guarda em preco; aceita vírgula e até 2 casas decimais.
          */}
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
          {/*
            Título: Escolha da unidade de medida
            Explicação: Cada opção chama setUnidadeMedida(unidade).
          */}
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
        {/*
          Título: Carregando / erro dos fornecedores
          Explicação: Mostra o estado de GET /api/fornecedores; Tentar novamente chama onRetrySuppliers.
        */}
        <StateView error={suppliersError} loading={suppliersLoading} onRetry={onRetrySuppliers} />
        <View style={styles.chips}>
          {/*
            Título: Opção Sem fornecedor
            Explicação: Chama setFornecedorId(null): o produto fica sem fornecedor.
          */}
          <Choice
            disabled={saving}
            label="Sem fornecedor"
            onPress={() => setFornecedorId(null)}
            selected={!fornecedorId}
          />
          {/*
            Título: Opções de fornecedor
            Explicação: Cada opção chama setFornecedorId(id do fornecedor).
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
      </View>
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
        Título: Botão Cadastrar produto / Salvar alterações
        Explicação: Chama save(), que valida os números e então: na edição, useProdutoMutations().update →
          updateProduto() → PUT /api/produtos/{id} (ProdutoController.atualizar); no cadastro, create →
          createProduto() → POST /api/produtos (ProdutoController.criar). Com sucesso fecha a janela e mostra
          a faixa de sucesso.
      */}
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
