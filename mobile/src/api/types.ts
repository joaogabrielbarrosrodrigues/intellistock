export type User = {
  id: string;
  nome: string;
  email: string;
  createdAt?: string;
};

export type AuthResponse = {
  token: string;
  tokenType: string;
  user: User;
};

export type DashboardResponse = {
  estoque: {
    totalProdutos: number;
    produtosEstoqueBaixo: number;
    produtosSemEstoque: number;
    valorTotalEstoque: number;
    totalFornecedores: number;
  };
  financeiro: {
    contasPendentes: number;
    contasVencidas: number;
    valorEmAberto: number;
    valorVencido: number;
    contasProximasVencimento: number;
    valorProximasVencimento: number;
  };
  sugestoesReposicao: number;
  movimentacoesRecentes: Movimentacao[];
  contasProximasVencimento: ContaPagar[];
  consumoMensal: { periodo: string; quantidade: number }[];
};

export type Produto = {
  id: string;
  nome: string;
  descricao?: string;
  quantidade: number;
  estoqueMinimo: number;
  unidadeMedida: string;
  preco: number;
  ativo: boolean;
  estoqueBaixo: boolean;
  fornecedor?: { id: string; nome: string } | null;
};

export type EstoqueItem = {
  produtoId: string;
  produtoNome: string;
  unidadeMedida: string;
  quantidade: number;
  estoqueMinimo: number;
  situacao: "NORMAL" | "BAIXO" | "ZERADO";
  valorEmEstoque: number;
};

export type ContaPagar = {
  id: string;
  descricao: string;
  valor: number;
  dataVencimento: string;
  status: "PENDENTE" | "VENCIDA" | "PAGA" | "CANCELADA";
  diasParaVencimento: number;
  fornecedor?: { id: string; nome: string } | null;
};

export type Movimentacao = {
  id: string;
  produtoNome: string;
  tipo: "ENTRADA" | "SAIDA";
  quantidade: number;
  data: string;
  saldoResultante: number;
};
