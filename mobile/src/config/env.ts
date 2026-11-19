/// <reference types="expo/types" />
/**
 * Título: Endereço do backend e tempo limite
 * Explicação: Arquivo de configuração com o endereço do backend e o tempo limite das chamadas.
 */

const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

export const API_URL = (configuredApiUrl || "http://localhost:8080").replace(/\/$/, "");

export const appConfig = {
  apiUrl: API_URL,
  requestTimeoutMs: 15000
} as const;
