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
export function useDashboardQuery() {
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: ({ signal }) => getDashboard(signal),
    ...defaultQueryOptions
  });
}
export function useProdutosQuery(busca?: string) {
  return useQuery({
    queryKey: [...queryKeys.produtos, busca ?? ""],
    queryFn: ({ signal }) => getProdutos(busca, signal),
    ...defaultQueryOptions
  });
}
export function useEstoqueQuery() {
  return useQuery({
    queryKey: queryKeys.estoque,
    queryFn: ({ signal }) => getEstoque(signal),
    ...defaultQueryOptions
  });
}
export function useContasQuery(status?: string) {
  return useQuery({
    queryKey: [...queryKeys.contas, status ?? ""],
    queryFn: ({ signal }) => getContas(status, signal),
    ...defaultQueryOptions
  });
}
export function useFornecedoresQuery(busca?: string) {
  return useQuery({
    queryKey: [...queryKeys.fornecedores, busca ?? ""],
    queryFn: ({ signal }) => getFornecedores(busca, signal),
    ...defaultQueryOptions
  });
}
export function useMovimentacoesQuery() {
  return useQuery({
    queryKey: queryKeys.movimentacoes,
    queryFn: ({ signal }) => getMovimentacoes(signal),
    ...defaultQueryOptions
  });
}
export function useConsumoQuery() {
  return useQuery({
    queryKey: queryKeys.consumo,
    queryFn: ({ signal }) => getConsumo(signal),
    ...defaultQueryOptions
  });
}
export function useReposicoesQuery() {
  return useQuery({
    queryKey: queryKeys.reposicoes,
    queryFn: ({ signal }) => getReposicoes(signal),
    ...defaultQueryOptions
  });
}

function useInvalidate() {
  const client = useQueryClient();
  return (keys: readonly (readonly unknown[])[]) =>
    invalidateRelatedQueries(client, keys);
}
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
export function useMovimentacaoMutation() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (payload: MovimentacaoPayload) => createMovimentacao(payload),
    onSuccess: () => invalidate(affectedQueries.estoque)
  });
}
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
