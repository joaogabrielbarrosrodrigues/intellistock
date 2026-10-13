import axios from "axios";

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string; error?: string } | string | undefined;
    if (typeof data === "string" && data.trim()) return data;
    if (data && typeof data === "object") return data.message || data.error || fallback;
    if (error.code === "ECONNABORTED") return "A API demorou demais para responder.";
    if (!error.response) return "Não foi possível conectar à API. Verifique a rede e se o backend está rodando.";
  }

  return fallback;
}
