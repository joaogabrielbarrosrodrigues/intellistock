/**
 * Título: Hooks que buscam e alteram dados do backend
 * Explicação: Conjunto de hooks de dados que as telas usam. Liga as funções de intellistock.ts ao
 *   TanStack Query, que guarda as respostas em cache e controla carregamento e erro.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  archiveProduto,
  cancelConta,
  createConta,
  createFornecedor,
  createMovimentacao,
  createProduto,
  deleteConta,
  deleteFornecedor,
  getConsumo,
  getContas,
  getDashboard,
  getEstoque,
  getFornecedores,
  getMovimentacoes,
  getProdutos,
  getReposicoes,
  payConta,
  reopenConta,
  updateConta,
  updateFornecedor,
  updateProduto
} from "../api/intellistock";
import type {
  ContaPayload,
  FornecedorPayload,
  Id,
  MovimentacaoPayload,
  ProdutoPayload
} from "../api/types";
import { affectedQueries, invalidateRelatedQueries, queryKeys } from "./queryInvalidation";

export { queryKeys } from "./queryInvalidation";
const defaultQueryOptions = { staleTime: 30_000 };
/**
 * Título: Dados da Visão geral
 * Explicação: Usa o TanStack Query para chamar GET /api/dashboard (DashboardController). Usado por
 *   DashboardScreen.
 */
export function useDashboardQuery() {
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: ({ signal }) => getDashboard(signal),
    ...defaultQueryOptions
  });
}
/**
 * Título: Lista de produtos
 * Explicação: Usa o TanStack Query para chamar GET /api/produtos (ProdutoController). Usado por
 *   ProdutosScreen.
 */
export function useProdutosQuery(busca?: string) {
  return useQuery({
    queryKey: [...queryKeys.produtos, busca ?? ""],
    queryFn: ({ signal }) => getProdutos(busca, signal),
    ...defaultQueryOptions
  });
}
/**
 * Título: Saldos de estoque
 * Explicação: Usa o TanStack Query para chamar GET /api/estoque (EstoqueController). Usado por
 *   RootNavigator e EstoqueScreen.
 */
export function useEstoqueQuery() {
  return useQuery({
    queryKey: queryKeys.estoque,
    queryFn: ({ signal }) => getEstoque(signal),
    ...defaultQueryOptions
  });
}
/**
 * Título: Contas a pagar, com filtro opcional de estado
 * Explicação: Usa o TanStack Query para chamar GET /api/contas (ContaPagarController). Usado por
 *   DueReminderProvider e ContasScreen.
 */
export function useContasQuery(status?: string) {
  return useQuery({
    queryKey: [...queryKeys.contas, status ?? ""],
    queryFn: ({ signal }) => getContas(status, signal),
    ...defaultQueryOptions
  });
}
/**
 * Título: Fornecedores, com busca opcional
 * Explicação: Usa o TanStack Query para chamar GET /api/fornecedores (FornecedorController). Usado por
 *   ContasScreen, FornecedoresScreen e ProdutosScreen.
 */
export function useFornecedoresQuery(busca?: string) {
  return useQuery({
    queryKey: [...queryKeys.fornecedores, busca ?? ""],
    queryFn: ({ signal }) => getFornecedores(busca, signal),
    ...defaultQueryOptions
  });
}
/**
 * Título: Movimentações recentes
 * Explicação: Usa o TanStack Query para chamar GET /api/movimentacoes (MovimentacaoController). Usado
 *   por EstoqueScreen.
 */
export function useMovimentacoesQuery(produtoId?: Id, limite = 100) {
  return useQuery({
    queryKey: [...queryKeys.movimentacoes, produtoId ?? "", limite],
    queryFn: ({ signal }) => getMovimentacoes(produtoId, signal, limite),
    ...defaultQueryOptions
  });
}
/**
 * Título: Análise de consumo
 * Explicação: Usa o TanStack Query para chamar GET /api/analises/consumo (AnaliseController). Usado
 *   por AnalisesScreen.
 */
export function useConsumoQuery() {
  return useQuery({
    queryKey: queryKeys.consumo,
    queryFn: ({ signal }) => getConsumo(signal),
    ...defaultQueryOptions
  });
}
/**
 * Título: Sugestões de reposição
 * Explicação: Usa o TanStack Query para chamar GET /api/analises/reposicao (AnaliseController). Usado
 *   por AnalisesScreen.
 */
export function useReposicoesQuery() {
  return useQuery({
    queryKey: queryKeys.reposicoes,
    queryFn: ({ signal }) => getReposicoes(signal),
    ...defaultQueryOptions
  });
}

/**
 * Título: Devolve uma função que manda recarregar listas
 * Explicação: Usada só dentro deste arquivo, por useProdutoMutations, useMovimentacaoMutation,
 *   useFornecedorMutations e useContaMutations.
 */
function useInvalidate() {
  const client = useQueryClient();
  return (keys: readonly (readonly unknown[])[]) =>
    invalidateRelatedQueries(client, keys);
}
/**
 * Título: Criar, editar e desativar produto
 * Explicação: Usa o TanStack Query para chamar POST, PUT e DELETE em /api/produtos
 *   (ProdutoController). Usado por ProductFormModal e ProdutosScreen.
 */
export function useProdutoMutations() {
  const invalidate = useInvalidate();
  const keys = affectedQueries.estoque;
  return {
    create: useMutation({
      mutationFn: (payload: ProdutoPayload) => createProduto(payload),
      onSuccess: () => invalidate(keys)
    }),
    update: useMutation({
      mutationFn: ({ id, payload }: { id: Id; payload: ProdutoPayload }) =>
        updateProduto(id, payload),
      onSuccess: () => invalidate(keys)
    }),
    archive: useMutation({ mutationFn: archiveProduto, onSuccess: () => invalidate(keys) })
  };
}
/**
 * Título: Registrar entrada ou saída
 * Explicação: Usa o TanStack Query para chamar POST /api/movimentacoes (MovimentacaoController). Usado
 *   por MovimentacaoModal.
 */
export function useMovimentacaoMutation() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (payload: MovimentacaoPayload) => createMovimentacao(payload),
    onSuccess: () => invalidate(affectedQueries.estoque)
  });
}
/**
 * Título: Criar, editar e excluir fornecedor
 * Explicação: Usa o TanStack Query para chamar POST, PUT e DELETE em /api/fornecedores
 *   (FornecedorController). Usado por FornecedorFormModal e FornecedoresScreen.
 */
export function useFornecedorMutations() {
  const invalidate = useInvalidate();
  const keys = affectedQueries.fornecedor;
  return {
    create: useMutation({
      mutationFn: (payload: FornecedorPayload) => createFornecedor(payload),
      onSuccess: () => invalidate(keys)
    }),
    update: useMutation({
      mutationFn: ({ id, payload }: { id: Id; payload: FornecedorPayload }) =>
        updateFornecedor(id, payload),
      onSuccess: () => invalidate(keys)
    }),
    remove: useMutation({ mutationFn: deleteFornecedor, onSuccess: () => invalidate(keys) })
  };
}
/**
 * Título: Criar, editar, pagar, cancelar, reabrir e excluir conta
 * Explicação: Usa o TanStack Query para chamar POST, PUT, DELETE e PATCH em /api/contas
 *   (ContaPagarController). Usado por ContaFormModal e ContasScreen.
 */
export function useContaMutations() {
  const invalidate = useInvalidate();
  const keys = affectedQueries.conta;
  return {
    create: useMutation({
      mutationFn: (payload: ContaPayload) => createConta(payload),
      onSuccess: () => invalidate(keys)
    }),
    update: useMutation({
      mutationFn: ({ id, payload }: { id: Id; payload: ContaPayload }) => updateConta(id, payload),
      onSuccess: () => invalidate(keys)
    }),
    pay: useMutation({ mutationFn: payConta, onSuccess: () => invalidate(keys) }),
    cancel: useMutation({ mutationFn: cancelConta, onSuccess: () => invalidate(keys) }),
    reopen: useMutation({ mutationFn: reopenConta, onSuccess: () => invalidate(keys) }),
    remove: useMutation({ mutationFn: deleteConta, onSuccess: () => invalidate(keys) })
  };
}
