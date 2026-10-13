import { api } from "./client";
import type { AuthResponse, ContaPagar, DashboardResponse, EstoqueItem, Produto } from "./types";

export async function login(email: string, senha: string, signal?: AbortSignal) {
  const { data } = await api.post<AuthResponse>("/api/auth/login", { email, senha }, { signal });
  return data;
}

export async function getDashboard(signal?: AbortSignal) {
  const { data } = await api.get<DashboardResponse>("/api/dashboard", { signal });
  return data;
}

export async function getProdutos(signal?: AbortSignal) {
  const { data } = await api.get<Produto[]>("/api/produtos", { signal });
  return data;
}

export async function getEstoque(signal?: AbortSignal) {
  const { data } = await api.get<EstoqueItem[]>("/api/estoque", { signal });
  return data;
}

export async function getContas(signal?: AbortSignal) {
  const { data } = await api.get<ContaPagar[]>("/api/contas", { signal });
  return data;
}
