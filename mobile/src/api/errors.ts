/**
 * Título: Mensagem de erro amigável a partir da resposta da API
 * Explicação: Função utilitária que transforma um erro de chamada em uma frase para o usuário.
 */
import axios from "axios";

/**
 * Título: Escolhe a melhor mensagem: a do campo inválido, a mensagem do backend ou um texto padrão
 * Explicação: Usado por ContaFormModal, FornecedorFormModal, MovimentacaoModal, ProductFormModal,
 *   AnalisesScreen e ContasScreen e outros.
 */
export function getApiErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string; error?: string; fields?: Record<string, string> } | string | undefined;
    if (typeof data === "string" && data.trim()) return data;
    if (data && typeof data === "object") {
      const fieldMessage = Object.values(data.fields ?? {}).find((message) => Boolean(message));
      return fieldMessage || data.message || data.error || fallback;
    }
    if (error.code === "ECONNABORTED") return "A conexão demorou demais para responder. Tente novamente.";
    if (!error.response) return "Não foi possível conectar. Confira a rede e tente novamente.";
  }

  return fallback;
}
