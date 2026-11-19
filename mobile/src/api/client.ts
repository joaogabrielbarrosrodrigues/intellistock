/**
 * Título: Cliente HTTP (axios) que conversa com o backend
 * Explicação: O cliente HTTP do app, criado com a biblioteca axios. Toda chamada ao backend passa por
 *   ele.
 */
import axios, { AxiosHeaders } from "axios";
import { appConfig } from "../config/env";

export const api = axios.create({
  baseURL: appConfig.apiUrl,
  timeout: appConfig.requestTimeoutMs,
  headers: {
    "Content-Type": "application/json"
  }
});

let unauthorizedHandler: (() => void) | undefined;

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const currentAuthorization = api.defaults.headers.common.Authorization;
    const requestAuthorization = AxiosHeaders.from(error.config?.headers).get("Authorization");
    // Uma resposta atrasada de outra sessão não deve encerrar o login atual.
    if (error.response?.status === 401 && currentAuthorization && requestAuthorization === currentAuthorization) {
      unauthorizedHandler?.();
    }
    return Promise.reject(error);
  }
);

/**
 * Título: Registra a função que deve rodar quando o backend responder 401
 * Explicação: Usado por AuthContext.
 */
export function onUnauthorized(handler: () => void) {
  unauthorizedHandler = handler;
  return () => {
    if (unauthorizedHandler === handler) unauthorizedHandler = undefined;
  };
}

/**
 * Título: Liga ou desliga o token em todas as chamadas
 * Explicação: Usado por AuthContext.
 */
export function setAuthToken(token: string | null) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    return;
  }

  delete api.defaults.headers.common.Authorization;
}
