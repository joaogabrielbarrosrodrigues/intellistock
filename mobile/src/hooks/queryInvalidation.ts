import type { QueryClient } from "@tanstack/react-query";

export const queryKeys = {
  dashboard: ["dashboard"] as const,
  produtos: ["produtos"] as const,
  estoque: ["estoque"] as const,
  contas: ["contas"] as const,
  fornecedores: ["fornecedores"] as const,
  movimentacoes: ["movimentacoes"] as const,
  consumo: ["consumo"] as const,
  reposicoes: ["reposicoes"] as const
};

// Cada grupo lista as telas que dependem dos dados alterados pela operação.
export const affectedQueries = {
  estoque: [queryKeys.produtos, queryKeys.estoque, queryKeys.dashboard,
    queryKeys.movimentacoes, queryKeys.reposicoes, queryKeys.consumo],
  fornecedor: [queryKeys.fornecedores, queryKeys.produtos, queryKeys.contas,
    queryKeys.dashboard, queryKeys.reposicoes],
  conta: [queryKeys.contas, queryKeys.dashboard]
} as const;

export function invalidateRelatedQueries(client: QueryClient, keys: readonly (readonly unknown[])[]) {
  return Promise.all(keys.map((queryKey) => client.invalidateQueries({ queryKey })));
}
