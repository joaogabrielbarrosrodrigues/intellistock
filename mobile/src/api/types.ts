export type Id = string;

export type User = { id: Id; nome: string; email: string; createdAt?: string };
export type AuthResponse = { token: string; tokenType: "Bearer"; user: User };
export type UnidadeMedida = "UN" | "KG" | "G" | "L" | "ML" | "CX" | "FD" | "PCT" | "M";
export type TipoMovimentacao = "ENTRADA" | "SAIDA";
export type StatusConta = "PENDENTE" | "VENCIDA" | "PAGA" | "CANCELADA";

export type FornecedorResumo = { id: Id; nome: string };
export type Fornecedor = FornecedorResumo & { cnpj?: string | null; telefone?: string | null; email?: string | null; createdAt?: string };
export type Produto = { id: Id; nome: string; descricao?: string | null; quantidade: number; estoqueMinimo: number; unidadeMedida: UnidadeMedida; preco: number; ativo: boolean; estoqueBaixo: boolean; fornecedor?: FornecedorResumo | null; createdAt?: string; updatedAt?: string };
export type EstoqueItem = { produtoId: Id; produtoNome: string; unidadeMedida: UnidadeMedida; quantidade: number; estoqueMinimo: number; situacao: "NORMAL" | "BAIXO" | "ZERADO"; valorEmEstoque: number };
export type ContaPagar = { id: Id; descricao: string; valor: number; dataVencimento: string; dataPagamento?: string | null; status: StatusConta; diasParaVencimento?: number | null; observacao?: string | null; fornecedor?: FornecedorResumo | null; createdAt?: string; updatedAt?: string };
export type Movimentacao = { id: Id; produtoId: Id; produtoNome: string; tipo: TipoMovimentacao; quantidade: number; data: string; saldoResultante: number; observacao?: string | null; usuarioId?: Id | null; usuarioNome?: string | null };

export type ConsumoItem = { produtoId: Id; produtoNome: string; unidadeMedida: UnidadeMedida; periodoDias: number; totalConsumido: number; mediaDiaria: number; mediaSemanal: number; mediaMensal: number; mediaDiariaRecente: number; tendencia: "ALTA" | "BAIXA" | "ESTAVEL"; variacaoPercentual?: number | null };
export type Reposicao = { produtoId: Id; produtoNome: string; unidadeMedida: UnidadeMedida; fornecedor?: FornecedorResumo | null; estoqueAtual: number; estoqueMinimoCadastrado: number; consumoMedioDiario: number; consumoBaseDiario: number; tendencia: "ALTA" | "BAIXA" | "ESTAVEL"; estoqueMinimoCalculado: number; estoqueSeguranca: number; pontoPedido: number; diasRestantes?: number | null; precisaRepor: boolean; quantidadeSugerida: number; custoEstimado: number; prioridade: "ALTA" | "MEDIA" | "BAIXA" | "NENHUMA"; totalConsumido: number; periodoAnaliseDias: number; diasCobertura: number; prazoEntregaDias: number; diasSeguranca: number };
export type ConsumoMensalPorUnidade = { unidadeMedida: UnidadeMedida; pontos: { inicio: string; fim: string; quantidade: number }[] };

export type DashboardResponse = {
  estoque: { totalProdutos: number; produtosEstoqueBaixo: number; produtosSemEstoque: number; valorTotalEstoque: number; totalFornecedores: number };
  financeiro: { contasPendentes: number; contasVencidas: number; valorEmAberto: number; valorVencido: number; contasProximasVencimento: number; valorProximasVencimento: number };
  sugestoesReposicao: number;
  movimentacoesRecentes: Movimentacao[];
  contasProximasVencimento: ContaPagar[];
  consumoMensal: ConsumoMensalPorUnidade[];
};

export type ProdutoPayload = { nome: string; descricao?: string | null; quantidadeInicial?: number; estoqueMinimo: number; unidadeMedida: UnidadeMedida; preco: number; fornecedorId?: Id | null };
export type FornecedorPayload = { nome: string; cnpj?: string | null; telefone?: string | null; email?: string | null };
export type ContaPayload = { fornecedorId: Id; descricao: string; valor: number; dataVencimento: string; observacao?: string | null };
export type MovimentacaoPayload = { produtoId: Id; tipo: TipoMovimentacao; quantidade: number; observacao?: string | null };
