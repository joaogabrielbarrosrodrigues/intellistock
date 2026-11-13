import { api } from "./client";
import type {
  AuthResponse,
  ContaPagar,
  ContaPayload,
  ConsumoItem,
  DashboardResponse,
  EstoqueItem,
  Fornecedor,
  FornecedorPayload,
  Id,
  Movimentacao,
  MovimentacaoPayload,
  Produto,
  ProdutoPayload,
  Reposicao,
  User
} from "./types";

export async function login(email: string, senha: string, signal?: AbortSignal) {
  return (await api.post<AuthResponse>("/api/auth/login", { email, senha }, { signal })).data;
}
export async function register(payload: { nome: string; email: string; senha: string; codigoAcesso: string }) {
  return (await api.post<User>("/api/auth/register", payload)).data;
}
export async function getDashboard(signal?: AbortSignal) {
  const { data } = await api.get<DashboardResponse>("/api/dashboard", { signal });
  const consumoMensal = Array.isArray(data?.consumoMensal)
    ? data.consumoMensal.filter(
        (serie) => serie && typeof serie.unidadeMedida === "string" && Array.isArray(serie.pontos)
      )
    : [];
  return {
    ...data,
    consumoMensal,
    movimentacoesRecentes: Array.isArray(data?.movimentacoesRecentes)
      ? data.movimentacoesRecentes
      : [],
    contasProximasVencimento: Array.isArray(data?.contasProximasVencimento)
      ? data.contasProximasVencimento
      : []
  };
}
export async function getProdutos(busca?: string, signal?: AbortSignal) {
  return (
    await api.get<Produto[]>("/api/produtos", { params: busca ? { busca } : undefined, signal })
  ).data;
}
export async function getEstoque(signal?: AbortSignal) {
  return (await api.get<EstoqueItem[]>("/api/estoque", { signal })).data;
}
export async function getContas(status?: string, signal?: AbortSignal) {
  return (
    await api.get<ContaPagar[]>("/api/contas", { params: status ? { status } : undefined, signal })
  ).data;
}
export async function getFornecedores(busca?: string, signal?: AbortSignal) {
  return (
    await api.get<Fornecedor[]>("/api/fornecedores", {
      params: busca ? { busca } : undefined,
      signal
    })
  ).data;
}
export async function getMovimentacoes(produtoId?: Id, signal?: AbortSignal, limite = 100) {
  return (
    await api.get<Movimentacao[]>("/api/movimentacoes", {
      params: { produtoId, limite },
      signal
    })
  ).data;
}
export async function getConsumo(signal?: AbortSignal) {
  return (await api.get<ConsumoItem[]>("/api/analises/consumo", { signal })).data;
}
export async function getReposicoes(signal?: AbortSignal) {
  return (await api.get<Reposicao[]>("/api/analises/reposicao", { signal })).data;
}

export async function createProduto(payload: ProdutoPayload) {
  return (await api.post<Produto>("/api/produtos", payload)).data;
}
export async function updateProduto(id: Id, payload: ProdutoPayload) {
  return (await api.put<Produto>(`/api/produtos/${id}`, payload)).data;
}
export async function archiveProduto(id: Id) {
  await api.delete(`/api/produtos/${id}`);
}
export async function createFornecedor(payload: FornecedorPayload) {
  return (await api.post<Fornecedor>("/api/fornecedores", payload)).data;
}
export async function updateFornecedor(id: Id, payload: FornecedorPayload) {
  return (await api.put<Fornecedor>(`/api/fornecedores/${id}`, payload)).data;
}
export async function deleteFornecedor(id: Id) {
  await api.delete(`/api/fornecedores/${id}`);
}
export async function createConta(payload: ContaPayload) {
  return (await api.post<ContaPagar>("/api/contas", payload)).data;
}
export async function updateConta(id: Id, payload: ContaPayload) {
  return (await api.put<ContaPagar>(`/api/contas/${id}`, payload)).data;
}
export async function payConta(id: Id) {
  return (await api.patch<ContaPagar>(`/api/contas/${id}/pagar`)).data;
}
export async function cancelConta(id: Id) {
  return (await api.patch<ContaPagar>(`/api/contas/${id}/cancelar`)).data;
}
export async function reopenConta(id: Id) {
  return (await api.patch<ContaPagar>(`/api/contas/${id}/reabrir`)).data;
}
export async function deleteConta(id: Id) {
  await api.delete(`/api/contas/${id}`);
}
export async function createMovimentacao(payload: MovimentacaoPayload) {
  return (await api.post<Movimentacao>("/api/movimentacoes", payload)).data;
}
