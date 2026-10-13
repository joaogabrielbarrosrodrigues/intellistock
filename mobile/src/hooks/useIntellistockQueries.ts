import { useQuery } from "@tanstack/react-query";
import { getContas, getDashboard, getEstoque, getProdutos } from "../api/intellistock";

export const queryKeys = {
  dashboard: ["dashboard"] as const,
  produtos: ["produtos"] as const,
  estoque: ["estoque"] as const,
  contas: ["contas"] as const
};

export function useDashboardQuery() {
  return useQuery({ queryKey: queryKeys.dashboard, queryFn: ({ signal }) => getDashboard(signal), staleTime: 30_000 });
}

export function useProdutosQuery() {
  return useQuery({ queryKey: queryKeys.produtos, queryFn: ({ signal }) => getProdutos(signal), staleTime: 30_000 });
}

export function useEstoqueQuery() {
  return useQuery({ queryKey: queryKeys.estoque, queryFn: ({ signal }) => getEstoque(signal), staleTime: 30_000 });
}

export function useContasQuery() {
  return useQuery({ queryKey: queryKeys.contas, queryFn: ({ signal }) => getContas(signal), staleTime: 30_000 });
}
