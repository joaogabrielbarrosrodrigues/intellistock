/**
 * Título: Uma função para cada rota do backend
 * Explicação: Catálogo de chamadas ao backend: uma função para cada rota que o app usa. É o único
 *   arquivo que conhece as URLs da API, então as telas nunca escrevem endereços.
 */
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

/**
 * Título: Chama POST /api/auth/login
 * Explicação: Faz POST /api/auth/login no backend, atendida por AuthController.login(), sem token.
 *   Envia corpo com e-mail e senha. Devolve a resposta já convertida (200 com AuthResponse (token e
 *   usuário)). Usado por AuthContext.
 */
export async function login(email: string, senha: string, signal?: AbortSignal) {
  return (await api.post<AuthResponse>("/api/auth/login", { email, senha }, { signal })).data;
}
/**
 * Título: Chama POST /api/auth/register
 * Explicação: Faz POST /api/auth/register no backend, atendida por AuthController.register(), sem
 *   token. Envia corpo com nome, e-mail, senha e código de acesso. Devolve a resposta já convertida (201
 *   com UserResponse). Usado por RegisterScreen.
 */
export async function register(payload: { nome: string; email: string; senha: string; codigoAcesso: string }) {
  return (await api.post<User>("/api/auth/register", payload)).data;
}
/**
 * Título: Chama GET /api/dashboard
 * Explicação: Faz GET /api/dashboard no backend, atendida por DashboardController.resumo(), com o
 *   token no cabeçalho. Envia query opcional diasVencimento. Devolve a resposta já convertida (200 com
 *   DashboardResponse). Usado por useIntellistockQueries.
 */
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
/**
 * Título: Chama GET /api/produtos
 * Explicação: Faz GET /api/produtos no backend, atendida por ProdutoController.listar(), com o token
 *   no cabeçalho. Envia query opcional busca, fornecedorId e incluirInativos. Devolve a resposta já
 *   convertida (200 com lista de ProdutoResponse). Usado por useIntellistockQueries.
 */
export async function getProdutos(busca?: string, signal?: AbortSignal) {
  return (
    await api.get<Produto[]>("/api/produtos", { params: busca ? { busca } : undefined, signal })
  ).data;
}
/**
 * Título: Chama GET /api/estoque
 * Explicação: Faz GET /api/estoque no backend, atendida por EstoqueController.listar(), com o token no
 *   cabeçalho. Envia sem parâmetros. Devolve a resposta já convertida (200 com lista de
 *   EstoqueResponse). Usado por useIntellistockQueries.
 */
export async function getEstoque(signal?: AbortSignal) {
  return (await api.get<EstoqueItem[]>("/api/estoque", { signal })).data;
}
/**
 * Título: Chama GET /api/contas
 * Explicação: Faz GET /api/contas no backend, atendida por ContaPagarController.listar(), com o token
 *   no cabeçalho. Envia query opcional status, fornecedorId e datas de vencimento. Devolve a resposta já
 *   convertida (200 com lista de ContaPagarResponse). Usado por useIntellistockQueries e ContasScreen.
 */
export async function getContas(status?: string, signal?: AbortSignal) {
  return (
    await api.get<ContaPagar[]>("/api/contas", { params: status ? { status } : undefined, signal })
  ).data;
}
/**
 * Título: Chama GET /api/fornecedores
 * Explicação: Faz GET /api/fornecedores no backend, atendida por FornecedorController.listar(), com o
 *   token no cabeçalho. Envia query opcional busca. Devolve a resposta já convertida (200 com lista de
 *   FornecedorResponse). Usado por useIntellistockQueries.
 */
export async function getFornecedores(busca?: string, signal?: AbortSignal) {
  return (
    await api.get<Fornecedor[]>("/api/fornecedores", {
      params: busca ? { busca } : undefined,
      signal
    })
  ).data;
}
/**
 * Título: Chama GET /api/movimentacoes
 * Explicação: Faz GET /api/movimentacoes no backend, atendida por MovimentacaoController.listar(), com
 *   o token no cabeçalho. Envia query opcional produtoId, tipo, inicio, fim e limite. Devolve a resposta
 *   já convertida (200 com lista de MovimentacaoResponse). Usado por useIntellistockQueries.
 */
export async function getMovimentacoes(produtoId?: Id, signal?: AbortSignal, limite = 100) {
  return (
    await api.get<Movimentacao[]>("/api/movimentacoes", {
      params: { produtoId, limite },
      signal
    })
  ).data;
}
/**
 * Título: Chama GET /api/analises/consumo
 * Explicação: Faz GET /api/analises/consumo no backend, atendida por AnaliseController.consumo(), com
 *   o token no cabeçalho. Envia query opcional produtoId e dias. Devolve a resposta já convertida (200
 *   com ConsumoResponse). Usado por useIntellistockQueries.
 */
export async function getConsumo(signal?: AbortSignal) {
  return (await api.get<ConsumoItem[]>("/api/analises/consumo", { signal })).data;
}
/**
 * Título: Chama GET /api/analises/reposicao
 * Explicação: Faz GET /api/analises/reposicao no backend, atendida por AnaliseController.reposicao(),
 *   com o token no cabeçalho. Envia query opcional dias, diasCobertura, prazoEntregaDias, diasSeguranca
 *   e todos. Devolve a resposta já convertida (200 com ReposicaoResponse). Usado por
 *   useIntellistockQueries.
 */
export async function getReposicoes(signal?: AbortSignal) {
  return (await api.get<Reposicao[]>("/api/analises/reposicao", { signal })).data;
}

/**
 * Título: Chama POST /api/produtos
 * Explicação: Faz POST /api/produtos no backend, atendida por ProdutoController.criar(), com o token
 *   no cabeçalho. Envia corpo ProdutoRequest. Devolve a resposta já convertida (201 com
 *   ProdutoResponse). Usado por useIntellistockQueries.
 */
export async function createProduto(payload: ProdutoPayload) {
  return (await api.post<Produto>("/api/produtos", payload)).data;
}
/**
 * Título: Chama PUT /api/produtos/{id}
 * Explicação: Faz PUT /api/produtos/{id} no backend, atendida por ProdutoController.atualizar(), com o
 *   token no cabeçalho. Envia id na URL e corpo ProdutoRequest. Devolve a resposta já convertida (200
 *   com ProdutoResponse). Usado por useIntellistockQueries.
 */
export async function updateProduto(id: Id, payload: ProdutoPayload) {
  return (await api.put<Produto>(`/api/produtos/${id}`, payload)).data;
}
/**
 * Título: Chama DELETE /api/produtos/{id}
 * Explicação: Faz DELETE /api/produtos/{id} no backend, atendida por ProdutoController.excluir(), com
 *   o token no cabeçalho. Envia só o id na URL. Devolve a resposta já convertida (204 sem corpo). Usado
 *   por useIntellistockQueries.
 */
export async function archiveProduto(id: Id) {
  await api.delete(`/api/produtos/${id}`);
}
/**
 * Título: Chama POST /api/fornecedores
 * Explicação: Faz POST /api/fornecedores no backend, atendida por FornecedorController.criar(), com o
 *   token no cabeçalho. Envia corpo FornecedorRequest. Devolve a resposta já convertida (201 com
 *   FornecedorResponse). Usado por useIntellistockQueries.
 */
export async function createFornecedor(payload: FornecedorPayload) {
  return (await api.post<Fornecedor>("/api/fornecedores", payload)).data;
}
/**
 * Título: Chama PUT /api/fornecedores/{id}
 * Explicação: Faz PUT /api/fornecedores/{id} no backend, atendida por
 *   FornecedorController.atualizar(), com o token no cabeçalho. Envia id na URL e corpo
 *   FornecedorRequest. Devolve a resposta já convertida (200 com FornecedorResponse). Usado por
 *   useIntellistockQueries.
 */
export async function updateFornecedor(id: Id, payload: FornecedorPayload) {
  return (await api.put<Fornecedor>(`/api/fornecedores/${id}`, payload)).data;
}
/**
 * Título: Chama DELETE /api/fornecedores/{id}
 * Explicação: Faz DELETE /api/fornecedores/{id} no backend, atendida por
 *   FornecedorController.excluir(), com o token no cabeçalho. Envia só o id na URL. Devolve a resposta
 *   já convertida (204). Usado por useIntellistockQueries.
 */
export async function deleteFornecedor(id: Id) {
  await api.delete(`/api/fornecedores/${id}`);
}
/**
 * Título: Chama POST /api/contas
 * Explicação: Faz POST /api/contas no backend, atendida por ContaPagarController.criar(), com o token
 *   no cabeçalho. Envia corpo ContaPagarRequest. Devolve a resposta já convertida (201 com
 *   ContaPagarResponse). Usado por useIntellistockQueries.
 */
export async function createConta(payload: ContaPayload) {
  return (await api.post<ContaPagar>("/api/contas", payload)).data;
}
/**
 * Título: Chama PUT /api/contas/{id}
 * Explicação: Faz PUT /api/contas/{id} no backend, atendida por ContaPagarController.atualizar(), com
 *   o token no cabeçalho. Envia id na URL e corpo ContaPagarRequest. Devolve a resposta já convertida
 *   (200 com ContaPagarResponse). Usado por useIntellistockQueries.
 */
export async function updateConta(id: Id, payload: ContaPayload) {
  return (await api.put<ContaPagar>(`/api/contas/${id}`, payload)).data;
}
/**
 * Título: Chama PATCH /api/contas/{id}/pagar
 * Explicação: Faz PATCH /api/contas/{id}/pagar no backend, atendida por ContaPagarController.pagar(),
 *   com o token no cabeçalho. Envia só o id; sem corpo, vale a data de hoje. Devolve a resposta já
 *   convertida (200 com a conta PAGA). Usado por useIntellistockQueries.
 */
export async function payConta(id: Id) {
  return (await api.patch<ContaPagar>(`/api/contas/${id}/pagar`)).data;
}
/**
 * Título: Chama PATCH /api/contas/{id}/cancelar
 * Explicação: Faz PATCH /api/contas/{id}/cancelar no backend, atendida por
 *   ContaPagarController.cancelar(), com o token no cabeçalho. Envia só o id na URL. Devolve a resposta
 *   já convertida (200 com a conta CANCELADA). Usado por useIntellistockQueries.
 */
export async function cancelConta(id: Id) {
  return (await api.patch<ContaPagar>(`/api/contas/${id}/cancelar`)).data;
}
/**
 * Título: Chama PATCH /api/contas/{id}/reabrir
 * Explicação: Faz PATCH /api/contas/{id}/reabrir no backend, atendida por
 *   ContaPagarController.reabrir(), com o token no cabeçalho. Envia só o id na URL. Devolve a resposta
 *   já convertida (200 com a conta PENDENTE). Usado por useIntellistockQueries.
 */
export async function reopenConta(id: Id) {
  return (await api.patch<ContaPagar>(`/api/contas/${id}/reabrir`)).data;
}
/**
 * Título: Chama DELETE /api/contas/{id}
 * Explicação: Faz DELETE /api/contas/{id} no backend, atendida por ContaPagarController.excluir(), com
 *   o token no cabeçalho. Envia só o id na URL. Devolve a resposta já convertida (204 sem corpo). Usado
 *   por useIntellistockQueries.
 */
export async function deleteConta(id: Id) {
  await api.delete(`/api/contas/${id}`);
}
/**
 * Título: Chama POST /api/movimentacoes
 * Explicação: Faz POST /api/movimentacoes no backend, atendida por MovimentacaoController.registrar(),
 *   com o token no cabeçalho. Envia corpo MovimentacaoRequest. Devolve a resposta já convertida (201 com
 *   MovimentacaoResponse (novo saldo)). Usado por useIntellistockQueries.
 */
export async function createMovimentacao(payload: MovimentacaoPayload) {
  return (await api.post<Movimentacao>("/api/movimentacoes", payload)).data;
}
