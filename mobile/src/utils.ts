/**
 * Título: Compara textos ignorando acentos e maiúsculas
 * Explicação: Usado por ProdutosScreen.
 */
/**
 * Título: Formatação e leitura de valores digitados
 * Explicação: Módulo de funções utilitárias de formatação e leitura de valores.
 */
export function matchesSearch(text: string, search: string) {
  const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  return normalize(text).includes(normalize(search.trim()));
}

/**
 * Título: Formata em reais (R$ 1.234,56)
 * Explicação: Usado por ReposicaoCard, ContasScreen, DashboardScreen, EstoqueScreen e ProdutosScreen.
 */
export function formatCurrency(value: number | string | null | undefined) {
  const numeric = Number(value ?? 0);
  return numeric.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/**
 * Título: Formata quantidade com até 3 casas e a unidade
 * Explicação: Usado por MovimentacaoModal, ReposicaoCard, RootNavigator, AnalisesScreen,
 *   DashboardScreen e EstoqueScreen e outros.
 */
export function formatQuantity(value: number | string | null | undefined, unit?: string) {
  const numeric = Number(value ?? 0);
  const text = numeric.toLocaleString("pt-BR", { maximumFractionDigits: 3 });
  return unit ? `${text} ${unit}` : text;
}

/**
 * Título: Formata data para DD/MM/AAAA
 * Explicação: Usado por ContaFormModal, ContasScreen, DashboardScreen e EstoqueScreen.
 */
export function formatDate(value?: string) {
  if (!value) return "-";

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    if (!isValidIsoDate(value)) return "-";
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day).toLocaleDateString("pt-BR");
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString("pt-BR");
}

// Formulários aceitam vírgula ou ponto decimal, sem converter formatos como 1e3 ou 0xFF.
/**
 * Título: Lê número digitado com vírgula ou ponto e recusa formatos estranhos
 * Explicação: Usado por ContaFormModal, MovimentacaoModal e ProductFormModal.
 */
export function parseDecimalInput(value: string, fractionDigits = 3) {
  const normalized = value.trim().replace(",", ".");
  if (!normalized) return 0;
  if (!Number.isInteger(fractionDigits) || fractionDigits < 0) return Number.NaN;

  const decimalPattern = fractionDigits === 0
    ? /^-?\d+$/
    : new RegExp(`^-?\\d+(?:\\.\\d{1,${fractionDigits}})?$`);
  if (!decimalPattern.test(normalized)) return Number.NaN;

  const numeric = Number(normalized);
  return Number.isFinite(numeric) ? numeric : Number.NaN;
}

/**
 * Título: Data de hoje em AAAA-MM-DD
 * Explicação: Usado por ContaFormModal.
 */
export function todayIsoLocal() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Título: Põe as barras enquanto a data é digitada
 * Explicação: Usado por ContaFormModal.
 */
export function formatDateInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  return [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)]
    .filter(Boolean)
    .join("/");
}

/**
 * Título: Converte DD/MM/AAAA em AAAA-MM-DD
 * Explicação: Usado por ContaFormModal.
 */
export function parseDateInput(value: string) {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return null;
  const [day, month, year] = value.split("/");
  const isoDate = `${year}-${month}-${day}`;
  return isValidIsoDate(isoDate) ? isoDate : null;
}

/**
 * Título: Confere se a data existe (31/02 não existe)
 * Explicação: Usada só dentro deste arquivo.
 */
export function isValidIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}
