/**
 * Título: Quais listas recarregar depois de cada alteração
 * Explicação: Módulo que define os nomes das consultas no cache e quais delas recarregar depois de
 *   cada tipo de alteração.
 */
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

/**
 * Título: Marca as consultas como desatualizadas para serem buscadas de novo
 * Explicação: Usado por useIntellistockQueries.
 */
export function invalidateRelatedQueries(client: QueryClient, keys: readonly (readonly unknown[])[]) {
  return Promise.all(keys.map((queryKey) => client.invalidateQueries({ queryKey })));
}
